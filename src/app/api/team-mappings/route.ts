import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return null;
  }
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mappings = await prisma.teamMapping.findMany({
    include: { team: { select: { id: true, name: true, logo: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(mappings);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId, livescoreId, livescoreName } = await req.json();
  if (!teamId || !livescoreId || !livescoreName) {
    return NextResponse.json({ error: "teamId, livescoreId and livescoreName are required" }, { status: 400 });
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const existing = await prisma.teamMapping.findFirst({
    where: { OR: [{ teamId }, { livescoreId }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: existing.teamId === teamId ? "This team is already mapped" : "This Livescore ID is already mapped" },
      { status: 409 }
    );
  }

  const mapping = await prisma.teamMapping.create({
    data: { teamId, livescoreId, livescoreName },
    include: { team: { select: { id: true, name: true, logo: true } } },
  });
  return NextResponse.json(mapping, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.teamMapping.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
