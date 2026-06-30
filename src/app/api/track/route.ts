import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";

function getCountryCode(req: NextRequest): string | null {
  // Read proxy headers only — no external HTTP calls.
  // ip-api.com free tier allows 45 req/min; at 50k concurrent visitors it
  // would rate-limit immediately and block each handler for 3s on timeout.
  const cf = req.headers.get("cf-ipcountry");
  if (cf && cf.length === 2 && cf !== "XX" && cf !== "T1") return cf.toUpperCase();
  const vercel = req.headers.get("x-vercel-ip-country");
  if (vercel && vercel.length === 2) return vercel.toUpperCase();
  const nginxGeo = req.headers.get("x-country-code");
  if (nginxGeo && nginxGeo.length === 2) return nginxGeo.toUpperCase();
  return null;
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
