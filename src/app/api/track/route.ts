import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";

function extractPublicIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || null;
  if (!ip) return null;
  // Only use genuinely public IPs for per-IP caching
  if (
    ip === "127.0.0.1" || ip === "::1" ||
    ip.startsWith("192.168.") || ip.startsWith("10.") ||
    ip.startsWith("172.16.") || ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") || ip.startsWith("172.19.") ||
    ip.startsWith("172.2") || ip.startsWith("172.30.") ||
    ip.startsWith("172.31.")
  ) return null;
  return ip;
}

async function lookupCountry(ip: string | null): Promise<string | null> {
  // If no public IP, call ip-api.com without specifying an IP — it identifies the caller.
  // This ensures local dev and VPS without nginx headers still produce data.
  const cacheKey = ip ? `geoip:${ip}` : "geoip:__self__";

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return cached === "XX" ? null : cached;
  } catch {}

  const url = ip
    ? `http://ip-api.com/json/${ip}?fields=countryCode`
    : `http://ip-api.com/json?fields=countryCode`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const { countryCode } = (await res.json()) as { countryCode?: string };
      const code = countryCode && countryCode.length === 2 ? countryCode.toUpperCase() : "XX";
      // Cache per-IP for 7 days; cache the self-lookup for 1 hour
      const ttl = ip ? 7 * 24 * 3600 : 3600;
      try { await redis.setex(cacheKey, ttl, code); } catch {}
      return code === "XX" ? null : code;
    }
  } catch {}

  return null;
}

async function getCountryCode(req: NextRequest): Promise<string | null> {
  // 1. Instant proxy headers — Cloudflare, Vercel, nginx geoip module
  const cf = req.headers.get("cf-ipcountry");
  if (cf && cf.length === 2 && cf !== "XX" && cf !== "T1") return cf.toUpperCase();
  const vercel = req.headers.get("x-vercel-ip-country");
  if (vercel && vercel.length === 2) return vercel.toUpperCase();
  const nginxGeo = req.headers.get("x-country-code");
  if (nginxGeo && nginxGeo.length === 2) return nginxGeo.toUpperCase();

  // 2. ip-api.com lookup (cached in Redis, works everywhere including local dev)
  const ip = extractPublicIp(req);
  return lookupCountry(ip);
}

export async function POST(req: NextRequest) {
  try {
    const { type, matchId } = await req.json();

    if (type === "match" && matchId) {
      let isUser = false;
      try {
        const session = await auth();
        isUser = !!session?.user;
      } catch {}

      // Fire-and-forget — don't hold the response open for a DB write
      prisma.match.update({
        where: { id: matchId },
        data: {
          views: { increment: 1 },
          userViews: isUser ? { increment: 1 } : undefined,
          anonViews: !isUser ? { increment: 1 } : undefined,
        },
      }).catch(() => {});
    }

    if (type === "site") {
      const today = new Date().toISOString().slice(0, 10);
      // Geo lookup is Redis-cached per IP so it's effectively free after first visit
      const country = await getCountryCode(req);

      // Redis INCR — microsecond cost, zero DB load.
      // The socket server flushes these to MySQL every 60 seconds.
      const pipeline = redis.pipeline();
      pipeline.incr("visits:total");
      pipeline.incr(`visits:${today}`);
      if (country) pipeline.incr(`visits:country:${country.toUpperCase()}`);
      await pipeline.exec();
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
