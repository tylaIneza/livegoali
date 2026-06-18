import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const events = await prisma.matchEvent.findMany({
    where: { matchId: id },
    orderBy: { minute: "desc" },
    take: 30,
  });
  return NextResponse.json(events.map((e) => ({
    id: e.id,
    type: e.type,
    minute: e.minute,
    playerName: e.playerName,
    teamId: e.teamId,
    description: e.description,
  })));
}
