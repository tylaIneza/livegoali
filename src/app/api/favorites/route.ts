import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ favorites: [] }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      team: { select: { id: true, name: true, slug: true, logo: true, country: true } },
      league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ favorites });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { teamId, leagueId } = body as { teamId?: string; leagueId?: string };

  if (!teamId && !leagueId) {
    return NextResponse.json({ error: "teamId or leagueId is required" }, { status: 400 });
  }

  const existing = await prisma.favorite.findFirst({
    where: { userId: session.user.id, teamId: teamId ?? null, leagueId: leagueId ?? null },
  });
  if (existing) return NextResponse.json({ favorite: existing });

  const favorite = await prisma.favorite.create({
    data: { userId: session.user.id, teamId: teamId ?? null, leagueId: leagueId ?? null },
  });

  return NextResponse.json({ favorite });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { teamId, leagueId } = body as { teamId?: string; leagueId?: string };

  if (!teamId && !leagueId) {
    return NextResponse.json({ error: "teamId or leagueId is required" }, { status: 400 });
  }

  await prisma.favorite.deleteMany({
    where: { userId: session.user.id, teamId: teamId ?? null, leagueId: leagueId ?? null },
  });

  return NextResponse.json({ ok: true });
}
