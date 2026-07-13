import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/redis";

export interface LiveCheckMatch {
  id: string;
  slug: string;
  label: string;
  league: string | null;
}

export async function GET() {
  const cacheKey = "notif:live-check";
  const cached = await cacheGet<LiveCheckMatch[]>(cacheKey);
  if (cached) return NextResponse.json({ matches: cached });

  const matches = await prisma.match.findMany({
    where: { status: { in: ["LIVE", "HALFTIME"] } },
    select: {
      id: true,
      slug: true,
      participant1: true,
      participant2: true,
      title: true,
      homeTeam: { select: { shortName: true, name: true } },
      awayTeam: { select: { shortName: true, name: true } },
      league: { select: { name: true } },
      sport: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: 30,
  });

  const payload: LiveCheckMatch[] = matches.map((m) => {
    const home = m.homeTeam?.shortName ?? m.homeTeam?.name ?? m.participant1;
    const away = m.awayTeam?.shortName ?? m.awayTeam?.name ?? m.participant2;
    return {
      id: m.id,
      slug: m.slug,
      label: home && away ? `${home} vs ${away}` : (m.title ?? "Live Event"),
      league: m.league?.name ?? m.sport?.name ?? null,
    };
  });

  await cacheSet(cacheKey, payload, 15);
  return NextResponse.json({ matches: payload });
}
