export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchCard } from "@/components/match/MatchCard";
import { Trophy, List } from "lucide-react";
import type { Metadata } from "next";
import type { MatchWithTeams } from "@/types";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const league = await prisma.league.findUnique({ where: { slug }, select: { name: true } });
  return { title: league?.name || "League" };
}

export default async function LeaguePage({ params }: Props) {
  const { slug } = await params;

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

  if (!league) notFound();

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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-5 mb-8 p-6 rounded-2xl border border-white/8 bg-[#121821]">
        {league.logo ? (
          <Image src={league.logo} alt={league.name} width={72} height={72} className="object-contain" />
        ) : (
          <div className="w-18 h-18 rounded-2xl bg-[#1F2937] flex items-center justify-center text-3xl">🏆</div>
        )}
        <div>
          <h1 className="text-3xl font-black text-white">{league.name}</h1>
          <p className="text-gray-400">{league.country} · {league.season}</p>
        </div>
      </div>

      <Tabs defaultValue="fixtures">
        <TabsList className="mb-6">
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          {league.standings.length > 0 && <TabsTrigger value="table">Standings</TabsTrigger>}
        </TabsList>

        <TabsContent value="fixtures">
          {fixtures.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No upcoming fixtures</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fixtures.map((m) => <MatchCard key={m.id} match={m as unknown as MatchWithTeams} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results">
          {results.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No recent results</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((m) => <MatchCard key={m.id} match={m as unknown as MatchWithTeams} />)}
            </div>
          )}
        </TabsContent>

        {league.standings.length > 0 && (
          <TabsContent value="table">
            <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8 text-gray-500 text-xs uppercase tracking-wider">
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
                        <td className="px-4 py-3 text-gray-500 font-medium">{s.position}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {s.team.logo && (
                              <Image src={s.team.logo} alt={s.team.name} width={20} height={20} className="object-contain" />
                            )}
                            <span className="font-medium text-white">{s.team.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-400">{s.played}</td>
                        <td className="px-4 py-3 text-center text-gray-400">{s.won}</td>
                        <td className="px-4 py-3 text-center text-gray-400">{s.drawn}</td>
                        <td className="px-4 py-3 text-center text-gray-400">{s.lost}</td>
                        <td className="px-4 py-3 text-center text-gray-400">{s.goalsFor}</td>
                        <td className="px-4 py-3 text-center text-gray-400">{s.goalsAgainst}</td>
                        <td className={`px-4 py-3 text-center font-medium ${s.goalDifference > 0 ? "text-[#00FF84]" : s.goalDifference < 0 ? "text-red-400" : "text-gray-400"}`}>
                          {s.goalDifference > 0 ? "+" : ""}{s.goalDifference}
                        </td>
                        <td className="px-4 py-3 text-center font-black text-white text-base">{s.points}</td>
                        {s.form && (
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="flex justify-center gap-0.5">
                              {s.form.slice(-5).split("").map((r, i) => (
                                <span key={i} className={`w-5 h-5 rounded-sm text-[10px] font-bold flex items-center justify-center ${
                                  r === "W" ? "bg-[#00FF84]/20 text-[#00FF84]"
                                  : r === "D" ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-red-500/20 text-red-400"
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
