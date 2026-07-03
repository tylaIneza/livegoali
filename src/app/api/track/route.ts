import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";

function getIp(req: NextRequest): string | null {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}

function getCountryFromHeaders(req: NextRequest): string | null {
  const cf = req.headers.get("cf-ipcountry");
  if (cf && cf.length === 2 && cf !== "XX" && cf !== "T1") return cf.toUpperCase();
  const vercel = req.headers.get("x-vercel-ip-country");
  if (vercel && vercel.length === 2) return vercel.toUpperCase();
  const nginxGeo = req.headers.get("x-country-code");
  if (nginxGeo && nginxGeo.length === 2) return nginxGeo.toUpperCase();
  return null;
}

// Fire-and-forget geo lookup after response is already sent.
// 1. Check Redis cache first (24h TTL per IP) — zero external call for returning visitors.
// 2. If not cached, call ip-api.com (45 req/min free tier).
// 3. If rate-limited or error, silently skip — never blocks or crashes.
async function lookupAndRecordCountry(ip: string): Promise<void> {
  try {
    const cacheKey = `geo:${ip}`;

    // Check Redis cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      // Already know this IP's country — just record it
      if (cached !== "XX") {
        await redis.incr(`visits:country:${cached}`);
      }
      return;
    }

    // New IP — call ip-api.com (fire-and-forget already, so awaiting here is fine)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2s max
    try {
      const res = await fetch(
        `http://ip-api.com/json/${ip}?fields=countryCode,status`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (!res.ok) {
        // Rate-limited or server error — cache "XX" for 1 min so we don't hammer it
        await redis.setex(cacheKey, 60, "XX");
        return;
      }

      const data = await res.json() as { status: string; countryCode?: string };
      if (data.status === "success" && data.countryCode && data.countryCode.length === 2) {
        const code = data.countryCode.toUpperCase();
        // Cache for 24 hours — this IP won't trigger another lookup for a day
        await redis.setex(cacheKey, 86_400, code);
        await redis.incr(`visits:country:${code}`);
      } else {
        // ip-api returned "fail" (private IP, reserved range, etc.) — cache briefly
        await redis.setex(cacheKey, 300, "XX");
      }
    } catch {
      clearTimeout(timeout);
      // Timeout or network error — skip silently, don't cache so we retry next visit
    }
  } catch {
    // Redis error or anything else — skip silently
  }
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

      prisma.match.update({
        where: { id: matchId },
        data: {
          views: { increment: 1 },
          userViews: isUser ? { increment: 1 } : undefined,
          anonViews: !isUser ? { increment: 1 } : undefined,
        },
      }).catch(() => {});

      const month = new Date().toISOString().slice(0, 7);
      redis.incr(`match_views:${month}`).catch(() => {});
    }

    if (type === "site") {
      const today = new Date().toISOString().slice(0, 10);

      // Increment visit counters immediately — never delayed by geo lookup
      const pipeline = redis.pipeline();
      pipeline.incr("visits:total");
      pipeline.incr(`visits:${today}`);
      await pipeline.exec();

      // Geo lookup: check headers first (Cloudflare/nginx), fall back to ip-api.com
      // Either way it's non-blocking — response is already sent before this resolves
      const headerCountry = getCountryFromHeaders(req);
      if (headerCountry) {
        // Header-based — instant, no external call needed
        redis.incr(`visits:country:${headerCountry}`).catch(() => {});
      } else {
        // ip-api.com fallback — fully async, never blocks the response
        const ip = getIp(req);
        if (ip && ip !== "127.0.0.1" && ip !== "::1") {
          lookupAndRecordCountry(ip).catch(() => {});
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
