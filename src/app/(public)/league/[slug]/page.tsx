export const dynamic = "force-dynamic";
import { cache } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cacheGet, cacheSet, acquireLock, releaseLock } from "@/lib/redis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchCard } from "@/components/match/MatchCard";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Trophy, List } from "lucide-react";
import type { Metadata } from "next";

interface Props { params: Promise<{ slug: string }> }

async function fetchLeagueDataFromDb(slug: string) {
  const league = await prisma.league.findUnique({
    where: { slug },
    include: {
      standings: {
        include: { team: { select: { id: true, name: true, slug: true, logo: true } } },
        orderBy: { position: "asc" },
        take: 20,
      },
    },
  });

  if (!league) return null;

  const [fixtures, results] = await Promise.all([
    prisma.match.findMany({
      where: { leagueId: league.id, status: { in: ["SCHEDULED", "LIVE", "HALFTIME"] } },
      include: {
        homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
        streams: { where: { isActive: true }, take: 1 },
        prediction: { select: { homeWinProb: true, drawProb: true, awayWinProb: true, confidence: true, recommendation: true, expectedHomeGoals: true, expectedAwayGoals: true, aiExplanation: true, expertAnalysis: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    }),
    prisma.match.findMany({
      where: { leagueId: league.id, status: "FINISHED" },
      include: {
        homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
        streams: { where: { isActive: true }, take: 1 },
        prediction: { select: { homeWinProb: true, drawProb: true, awayWinProb: true, confidence: true, recommendation: true, expectedHomeGoals: true, expectedAwayGoals: true, aiExplanation: true, expertAnalysis: true } },
      },
      orderBy: { scheduledAt: "desc" },
      take: 10,
    }),
  ]);

  return { league, fixtures, results };
}

type LeagueData = NonNullable<Awaited<ReturnType<typeof fetchLeagueDataFromDb>>>;

// Standings/fixtures/results are identical for every visitor of a given
// league — only the favorite-star check below is per-user, so that's kept
// outside the cache. Redis + lock dedupes the 3-query bundle across
// concurrent visitors the same way the match/live pages do.
const getLeagueData = cache(async (slug: string): Promise<LeagueData | null> => {
  const key = `league:detail:${slug}`;
  try {
    const cached = await cacheGet<LeagueData>(key);
    if (cached) return cached;
  } catch {}

  const lockKey = `lock:league:detail:${slug}`;
  const gotLock = await acquireLock(lockKey, 5);
  if (!gotLock) {
    await new Promise((r) => setTimeout(r, 150));
    try {
      const cached = await cacheGet<LeagueData>(key);
      if (cached) return cached;
    } catch {}
  }

  try {
    const data = await fetchLeagueDataFromDb(slug);
    if (data) {
      try { await cacheSet(key, data, 15); } catch {}
    }
    return data;
  } finally {
    if (gotLock) await releaseLock(lockKey);
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getLeagueData(slug);
  return { title: data?.league.name || "League" };
}

export default async function LeaguePage({ params }: Props) {
  const { slug } = await params;

  const data = await getLeagueData(slug);
  if (!data) notFound();
  const { league, fixtures, results } = data;

  const session = await auth();
  const isFavorited = session?.user
    ? !!(await prisma.favorite.findFirst({ where: { userId: session.user.id, leagueId: league.id } }))
    : false;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-5 mb-8 p-6 rounded-2xl border border-white/8 bg-card">
        {league.logo ? (
          <Image src={league.logo} alt={league.name} width={72} height={72} className="object-contain" />
        ) : (
          <div className="w-18 h-18 rounded-2xl bg-muted flex items-center justify-center text-3xl">🏆</div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-black text-white">{league.name}</h1>
          <p className="text-white/75">{league.country} · {league.season}</p>
        </div>
        <FavoriteButton leagueId={league.id} initialFavorited={isFavorited} className="shrink-0" />
      </div>

      <Tabs defaultValue="fixtures">
        <TabsList className="mb-6">
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          {league.standings.length > 0 && <TabsTrigger value="table">Standings</TabsTrigger>}
        </TabsList>

        <TabsContent value="fixtures">
          {fixtures.length === 0 ? (
            <p className="text-center text-white/70 py-12">No upcoming fixtures</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fixtures.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results">
          {results.length === 0 ? (
            <p className="text-center text-white/70 py-12">No recent results</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          )}
        </TabsContent>

        {league.standings.length > 0 && (
          <TabsContent value="table">
            <div className="rounded-2xl border border-white/8 bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8 text-white/70 text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left w-8">#</th>
                      <th className="px-4 py-3 text-left">Team</th>
                      <th className="px-4 py-3 text-center">P</th>
                      <th className="px-4 py-3 text-center">W</th>
                      <th className="px-4 py-3 text-center">D</th>
                      <th className="px-4 py-3 text-center">L</th>
                      <th className="px-4 py-3 text-center">GF</th>
                      <th className="px-4 py-3 text-center">GA</th>
                      <th className="px-4 py-3 text-center">GD</th>
                      <th className="px-4 py-3 text-center font-bold text-white">Pts</th>
                      <th className="px-4 py-3 text-center hidden sm:table-cell">Form</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {league.standings.map((s) => (
                      <tr key={s.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3 text-white/70 font-medium">{s.position}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {s.team.logo && (
                              <Image src={s.team.logo} alt={s.team.name} width={20} height={20} className="object-contain" />
                            )}
                            <span className="font-medium text-white">{s.team.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-white/75">{s.played}</td>
                        <td className="px-4 py-3 text-center text-white/75">{s.won}</td>
                        <td className="px-4 py-3 text-center text-white/75">{s.drawn}</td>
                        <td className="px-4 py-3 text-center text-white/75">{s.lost}</td>
                        <td className="px-4 py-3 text-center text-white/75">{s.goalsFor}</td>
                        <td className="px-4 py-3 text-center text-white/75">{s.goalsAgainst}</td>
                        <td className={`px-4 py-3 text-center font-medium ${s.goalDifference > 0 ? "text-accent" : s.goalDifference < 0 ? "text-danger" : "text-white/75"}`}>
                          {s.goalDifference > 0 ? "+" : ""}{s.goalDifference}
                        </td>
                        <td className="px-4 py-3 text-center font-black text-white text-base">{s.points}</td>
                        {s.form && (
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="flex justify-center gap-0.5">
                              {s.form.slice(-5).split("").map((r, i) => (
                                <span key={i} className={`w-5 h-5 rounded-sm text-[10px] font-bold flex items-center justify-center ${
                                  r === "W" ? "bg-accent/20 text-accent"
                                  : r === "D" ? "bg-warning/20 text-warning"
                                  : "bg-danger/20 text-danger"
                                }`}>{r}</span>
                              ))}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
