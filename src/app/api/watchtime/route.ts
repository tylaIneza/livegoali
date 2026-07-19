import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const KEY = "total_watch_seconds";
const PENDING_KEY = "watchtime:pending_seconds";

function formatHours(hours: number): string {
  if (hours >= 1_000_000) return `${+(hours / 1_000_000).toFixed(1)}M`;
  if (hours >= 1_000) return `${+(hours / 1_000).toFixed(1)}k`;
  return String(hours);
}

export async function GET() {
  const setting = await prisma.settings.findUnique({ where: { key: KEY } }).catch(() => null);
  const totalSeconds = setting ? parseInt(setting.value, 10) || 0 : 0;
  const hours = Math.floor(totalSeconds / 3600);
  return NextResponse.json({ hours, formatted: formatHours(hours) });
}

// Every viewer flushes here every 30s (WatchtimeTracker) — at 10k concurrent
// viewers that's ~333 req/s. Buffer in Redis (atomic INCRBY, no lock
// contention) instead of writing straight to the single Settings row on
// every request; the socket server drains this into MySQL once a minute
// (see flushWatchTime in src/server/socket.ts).
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const seconds = Number(body?.seconds);
    if (!seconds || seconds <= 0 || seconds > 3600) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await redis.incrby(PENDING_KEY, Math.round(seconds));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
