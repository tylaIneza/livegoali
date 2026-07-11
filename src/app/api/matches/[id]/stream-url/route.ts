import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cheap lookup used to warm the /api/stream/extract cache on hover, before
// the player mounts — avoids exposing the full admin-only /api/stream list.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const stream = await prisma.streamSource.findFirst({
    where: { matchId: id, isActive: true },
    orderBy: { priority: "asc" },
    select: { url: true },
  });

  return NextResponse.json({ url: stream?.url ?? null });
}
