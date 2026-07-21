import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cacheGet, cacheSet } from "@/lib/redis";

async function isAdmin() {
  const session = await auth();
  const role = session?.user?.role;
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "EDITOR";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const leagueId = searchParams.get("leagueId");
  const date = searchParams.get("date");
  const take = parseInt(searchParams.get("take") || "20");
  const skip = parseInt(searchParams.get("skip") || "0");
  // Unpublished (e.g. pending-approval PPV imports) are only ever returned
  // to an authenticated admin/editor explicitly asking for them.
  const includeUnpublished = searchParams.get("includeUnpublished") === "1" && await isAdmin();

  const cacheKey = `matches:${status}:${leagueId}:${date}:${take}:${skip}:${includeUnpublished ? "all" : "pub"}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return NextResponse.json(cached);

  const where: Record<string, unknown> = includeUnpublished ? {} : { isPublished: true };
  if (status) {
    if (status === "LIVE") {
      where.status = { in: ["LIVE", "HALFTIME"] };
    } else {
      where.status = status;
    }
  }
  if (leagueId) where.leagueId = leagueId;
  if (date) {
    const d = new Date(date);
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    where.scheduledAt = { gte: start, lte: end };
  }

  const matches = await prisma.match.findMany({
    where,
    include: {
      homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
      awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
      league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
      sport: { select: { id: true, name: true, slug: true, icon: true } },
      streams: { where: { isActive: true }, select: { id: true, url: true, type: true, quality: true, isPrimary: true, isActive: true, priority: true, label: true }, orderBy: { priority: "asc" }, take: 1 },
    },
    orderBy: [
      { status: "asc" },
      { scheduledAt: "asc" },
    ],
    take,
    skip,
  });

  await cacheSet(cacheKey, matches, status === "LIVE" ? 15 : 60);
  return NextResponse.json(matches);
}

async function findOrCreateTeam(name: string, leagueId: string | null, logo?: string): Promise<string> {
  const trimmed = name.trim();
  const existing = await prisma.team.findFirst({
    where: { name: { equals: trimmed } },
  });
  if (existing) {
    if (logo) await prisma.team.update({ where: { id: existing.id }, data: { logo } });
    return existing.id;
  }

  const slug = `${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;
  const team = await prisma.team.create({
    data: { name: trimmed, slug, leagueId: leagueId ?? null, logo: logo || null },
  });
  return team.id;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Create team records for any sport that sends homeTeamName (football, basketball, volleyball, etc.)
  let homeTeamId: string | undefined;
  let awayTeamId: string | undefined;
  if (body.homeTeamName || body.homeTeamId) {
    homeTeamId = body.homeTeamId ?? await findOrCreateTeam(body.homeTeamName, body.leagueId ?? null, body.homeTeamLogo);
    awayTeamId = body.awayTeamId ?? await findOrCreateTeam(body.awayTeamName, body.leagueId ?? null, body.awayTeamLogo);
  }

  const match = await prisma.match.create({
    data: {
      slug: body.slug,
      sportId: body.sportId ?? null,
      leagueId: body.leagueId ?? null,
      homeTeamId: homeTeamId ?? null,
      awayTeamId: awayTeamId ?? null,
      title: body.title ?? null,
      participant1: body.participant1 ?? null,
      participant2: body.participant2 ?? null,
      streamUrl: body.streamUrl ?? null,
      streamType: body.streamType ?? "IFRAME",
      streamQuality: body.streamQuality ?? "HD",
      metadata: body.metadata ?? null,
      scheduledAt: new Date(body.scheduledAt),
      isFeatured: body.isFeatured ?? false,
      venue: body.venue ?? null,
      round: body.round ?? null,
      season: body.season ?? null,
    },
  });

  return NextResponse.json(match, { status: 201 });
}
