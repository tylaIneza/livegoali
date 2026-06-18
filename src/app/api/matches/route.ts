import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const leagueId = searchParams.get("leagueId");
  const date = searchParams.get("date");
  const take = parseInt(searchParams.get("take") || "20");
  const skip = parseInt(searchParams.get("skip") || "0");

  const cacheKey = `matches:${status}:${leagueId}:${date}:${take}:${skip}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return NextResponse.json(cached);

  const where: Record<string, unknown> = {};
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
      streams: { where: { isActive: true }, select: { id: true, url: true, type: true, quality: true, isPrimary: true, isActive: true, priority: true, label: true }, orderBy: { priority: "asc" }, take: 1 },
      prediction: { select: { homeWinProb: true, drawProb: true, awayWinProb: true, confidence: true } },
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

async function findOrCreateTeam(name: string, leagueId: string): Promise<string> {
  const trimmed = name.trim();
  const existing = await prisma.team.findFirst({
    where: { name: { equals: trimmed } },
  });
  if (existing) return existing.id;

  const slug = `${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;
  const team = await prisma.team.create({
    data: { name: trimmed, slug, leagueId },
  });
  return team.id;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Accept either IDs (legacy) or team names (new)
  const homeTeamId = body.homeTeamId ?? await findOrCreateTeam(body.homeTeamName, body.leagueId);
  const awayTeamId = body.awayTeamId ?? await findOrCreateTeam(body.awayTeamName, body.leagueId);

  const match = await prisma.match.create({
    data: {
      slug: body.slug,
      leagueId: body.leagueId,
      homeTeamId,
      awayTeamId,
      scheduledAt: new Date(body.scheduledAt),
      isFeatured: body.isFeatured ?? false,
      enableComments: body.enableComments ?? true,
      enableChat: body.enableChat ?? true,
      enablePrediction: body.enablePrediction ?? true,
      venue: body.venue,
      round: body.round,
      season: body.season,
    },
  });

  return NextResponse.json(match, { status: 201 });
}
