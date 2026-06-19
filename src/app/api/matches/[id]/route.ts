import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(match);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const match = await prisma.match.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.homeScore !== undefined && { homeScore: body.homeScore }),
      ...(body.awayScore !== undefined && { awayScore: body.awayScore }),
      ...(body.matchMinute !== undefined && { matchMinute: body.matchMinute }),
      ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
      ...(body.enableComments !== undefined && { enableComments: body.enableComments }),
      ...(body.enableChat !== undefined && { enableChat: body.enableChat }),
      ...(body.enablePrediction !== undefined && { enablePrediction: body.enablePrediction }),
    },
  });

  return NextResponse.json(match);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.match.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
