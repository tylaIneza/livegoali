import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { generateAIPrediction } from "@/lib/prediction-engine";
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";

const entrySchema = z.object({
  matchId: z.string(),
  outcome: z.enum(["HOME_WIN", "DRAW", "AWAY_WIN"]),
  predictedHomeScore: z.number().int().min(0).max(20).optional(),
  predictedAwayScore: z.number().int().min(0).max(20).optional(),
  btts: z.boolean().optional(),
  overUnder: z.string().optional(),
});

function predictionCacheKey(matchId: string) {
  return `prediction:${matchId}`;
}

// LiveMatchSidebar polls this every 60s per viewer — a popular live match with
// thousands of concurrent viewers turned into thousands of identical uncached
// queries every minute. Cache it the same way comments/ads/live-check already are.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");

  if (matchId) {
    const key = predictionCacheKey(matchId);
    const cached = await cacheGet(key);
    if (cached) return NextResponse.json(cached);

    const prediction = await prisma.prediction.findUnique({ where: { matchId } });
    try { await cacheSet(key, prediction, 30); } catch {}
    return NextResponse.json(prediction);
  }

  const matches = await prisma.match.findMany({
    where: {
      status: { in: ["SCHEDULED", "LIVE"] },
      prediction: { isNot: null },
    },
    include: {
      homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
      awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
      league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
      prediction: true,
    },
    orderBy: { scheduledAt: "asc" },
    take: 20,
  });

  return NextResponse.json(matches);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Sign in to make predictions" }, { status: 401 });
  }

  const body = await req.json();
  const result = entrySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { matchId, outcome, predictedHomeScore, predictedAwayScore, btts, overUnder } = result.data;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { status: true, enablePrediction: true },
  });

  if (!match?.enablePrediction) {
    return NextResponse.json({ error: "Predictions disabled" }, { status: 403 });
  }

  if (match.status === "FINISHED") {
    return NextResponse.json({ error: "Match already finished" }, { status: 400 });
  }

  const entry = await prisma.predictionEntry.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId } },
    create: {
      userId: session.user.id,
      matchId,
      outcome,
      predictedHomeScore,
      predictedAwayScore,
      btts,
      overUnder,
    },
    update: {
      outcome,
      predictedHomeScore,
      predictedAwayScore,
      btts,
      overUnder,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { matchId, generate } = body;

  if (generate) {
    const prediction = await generateAIPrediction(matchId);
    try { await cacheDel(predictionCacheKey(matchId)); } catch {}
    return NextResponse.json(prediction);
  }

  const prediction = await prisma.prediction.upsert({
    where: { matchId },
    create: { matchId, ...body },
    update: { ...body, isOverridden: true },
  });

  try { await cacheDel(predictionCacheKey(matchId)); } catch {}

  return NextResponse.json(prediction);
}
