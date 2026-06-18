import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function incrementSetting(key: string) {
  const existing = await prisma.settings.findUnique({ where: { key } });
  if (existing) {
    await prisma.settings.update({
      where: { key },
      data: { value: String(parseInt(existing.value) + 1) },
    });
  } else {
    await prisma.settings.create({ data: { key, value: "1" } });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type, matchId } = await req.json();
    let isUser = false;
    try {
      const session = await auth();
      isUser = !!session?.user;
    } catch {}

    if (type === "match" && matchId) {
      await prisma.match.update({
        where: { id: matchId },
        data: {
          views: { increment: 1 },
          userViews: isUser ? { increment: 1 } : undefined,
          anonViews: !isUser ? { increment: 1 } : undefined,
        },
      });
    }

    if (type === "site") {
      const today = new Date().toISOString().slice(0, 10);
      await incrementSetting("site_visits_total");
      await incrementSetting(`site_visits_${today}`);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
