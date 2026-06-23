import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get("q")?.trim();
    if (!q || q.length < 2) return NextResponse.json({ matches: [], teams: [], leagues: [] });

    const [matches, teams, leagues] = await Promise.all([
      prisma.match.findMany({
        where: {
          OR: [
            { homeTeam: { name: { contains: q } } },
            { awayTeam: { name: { contains: q } } },
            { league: { name: { contains: q } } },
          ],
        },
        include: {
          homeTeam: { select: { name: true, logo: true, shortName: true } },
          awayTeam: { select: { name: true, logo: true, shortName: true } },
          league: { select: { name: true } },
        },
        orderBy: { scheduledAt: "desc" },
        take: 5,
      }),
      prisma.team.findMany({
        where: { name: { contains: q } },
        select: { id: true, name: true, slug: true, logo: true, country: true },
        take: 4,
      }),
      prisma.league.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { country: { contains: q } },
          ],
          isActive: true,
        },
        select: { id: true, name: true, slug: true, logo: true, country: true },
        take: 3,
      }),
    ]);

    return NextResponse.json({ matches, teams, leagues });
  } catch (err) {
    console.error("[search]", err);
    return NextResponse.json({ matches: [], teams: [], leagues: [] }, { status: 500 });
  }
}
