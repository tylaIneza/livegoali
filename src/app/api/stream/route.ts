import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { matchId, url, type, quality, label, isPrimary, priority } = body;

  if (!matchId || !url) {
    return NextResponse.json({ error: "matchId and url required" }, { status: 400 });
  }

  const stream = await prisma.streamSource.create({
    data: {
      matchId,
      url,
      type: type || "HLS",
      quality: quality || "HD",
      label: label || null,
      isPrimary: isPrimary ?? false,
      priority: priority ?? 0,
      isActive: true,
    },
  });

  return NextResponse.json(stream, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");

  const streams = await prisma.streamSource.findMany({
    where: matchId ? { matchId } : undefined,
    orderBy: [{ matchId: "asc" }, { priority: "asc" }],
  });

  return NextResponse.json(streams);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, isActive } = await req.json();
  const stream = await prisma.streamSource.update({
    where: { id },
    data: { isActive },
  });

  return NextResponse.json(stream);
}
