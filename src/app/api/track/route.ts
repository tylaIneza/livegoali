import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { randomBytes } from "crypto";

// Atomic increment using MySQL ON DUPLICATE KEY UPDATE to avoid race conditions
async function incrementSetting(key: string) {
  const id = randomBytes(12).toString("hex");
  await prisma.$executeRaw`
    INSERT INTO Settings (id, \`key\`, value, updatedAt)
    VALUES (${id}, ${key}, '1', NOW())
    ON DUPLICATE KEY UPDATE value = CAST(CAST(value AS UNSIGNED) + 1 AS CHAR), updatedAt = NOW()
  `;
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
