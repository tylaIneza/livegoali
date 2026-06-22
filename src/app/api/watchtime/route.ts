import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const KEY = "total_watch_seconds";

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const seconds = Number(body?.seconds);
    if (!seconds || seconds <= 0 || seconds > 3600) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await prisma.$executeRaw`
      INSERT INTO Settings (id, \`key\`, value, updatedAt)
      VALUES (${crypto.randomUUID()}, ${KEY}, ${String(seconds)}, NOW())
      ON DUPLICATE KEY UPDATE value = CAST(value AS UNSIGNED) + ${seconds}, updatedAt = NOW()
    `;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
