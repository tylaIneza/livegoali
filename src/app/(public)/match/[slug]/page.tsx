export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveBadge } from "@/components/match/LiveBadge";
import { Button } from "@/components/ui/button";
import { Play, TrendingUp } from "lucide-react";
import { formatMatchDate } from "@/lib/utils";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const match = await prisma.match.findUnique({
    where: { slug },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      league: { select: { name: true } },
    },
  });
  if (!match) return { title: "Match Not Found" };
  return {
    title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    description: `${match.homeTeam.name} vs ${match.awayTeam.name} - ${match.league.name}`,
  };
}

export default async function MatchPage({ params }: Props) {
  const { slug } = await params;

  const match = await prisma.match.findUnique({
    where: { slug },
    include: {
      homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
      awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
      league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
      streams: { where: { isActive: true }, orderBy: { priority: "asc" } },
      statistics: true,
      lineups: {
        include: {
          players: {
            include: { player: true },
            orderBy: { number: "asc" },
          },
        },
      },
      events: { orderBy: { minute: "asc" } },
      prediction: true,
    },
  });

  if (!match) notFound();

  const isLive = match.status === "LIVE" || match.status === "HALFTIME";
  const isScheduled = match.status === "SCHEDULED";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Match Header */}
      <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden mb-6">
        {/* Competition */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/8 bg-[#0B0F14]/50">
          <div className="flex items-center gap-2">
            {match.league.logo && (
              <Image src={match.league.logo} alt={match.league.name} width={20} height={20} className="object-contain" />
            )}
            <Link href={`/league/${match.league.slug}`} className="text-sm text-gray-400 hover:text-[#00FF84] transition-colors">
              {match.league.name}
            </Link>
            {match.round && <span className="text-gray-600 text-sm">· {match.round}</span>}
          </div>
          {isLive ? (
            <LiveBadge minute={match.matchMinute} status={match.status} />
          ) : (
            <span className="text-sm text-gray-500">{formatMatchDate(match.scheduledAt)}</span>
          )}
        </div>

        {/* Teams & Score */}
        <div className="p-8">
          <div className="flex items-center justify-around">
            {/* Home */}
            <Link href={`/team/${match.homeTeam.slug}`} className="flex flex-col items-center gap-3 group">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-[#0B0F14] border border-white/8 group-hover:border-[#00FF84]/30 transition-all">
                {match.homeTeam.logo ? (
                  <Image src={match.homeTeam.logo} alt={match.homeTeam.name} width={60} height={60} className="object-contain" />
                ) : (
                  <span className="text-3xl font-black text-[#00FF84]">{match.homeTeam.name.charAt(0)}</span>
                )}
              </div>
              <span className="font-bold text-white text-center group-hover:text-[#00FF84] transition-colors">
                {match.homeTeam.name}
              </span>
            </Link>

            {/* Match time / status */}
            <div className="text-center">
              <div className="text-5xl font-black text-gray-600 mb-2">VS</div>
              <div className="text-sm text-gray-500">{formatMatchDate(match.scheduledAt)}</div>
            </div>

            {/* Away */}
            <Link href={`/team/${match.awayTeam.slug}`} className="flex flex-col items-center gap-3 group">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-[#0B0F14] border border-white/8 group-hover:border-[#00FF84]/30 transition-all">
                {match.awayTeam.logo ? (
                  <Image src={match.awayTeam.logo} alt={match.awayTeam.name} width={60} height={60} className="object-contain" />
                ) : (
                  <span className="text-3xl font-black text-blue-400">{match.awayTeam.name.charAt(0)}</span>
                )}
              </div>
              <span className="font-bold text-white text-center group-hover:text-[#00FF84] transition-colors">
                {match.awayTeam.name}
              </span>
            </Link>
          </div>

          {/* Match Events (goals) */}
          {match.events.filter((e) => e.type === "GOAL").length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/8 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                {match.events.filter((e) => e.type === "GOAL" && e.teamId === match.homeTeamId).map((e) => (
                  <div key={e.id} className="text-sm text-gray-400">
                    ⚽ {e.playerName} <span className="text-[#00FF84] font-bold">{e.minute}&apos;</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-right">
                {match.events.filter((e) => e.type === "GOAL" && e.teamId === match.awayTeamId).map((e) => (
                  <div key={e.id} className="text-sm text-gray-400">
                    <span className="text-[#00FF84] font-bold">{e.minute}&apos;</span> {e.playerName} ⚽
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3 justify-center">
          {isLive && match.streams.length > 0 && (
            <Button asChild>
              <Link href={`/live/${match.id}`}>
                <Play className="w-4 h-4" />
                Watch Live
              </Link>
            </Button>
          )}
          {match.enablePrediction && (
            <Button variant="outline" asChild>
              <Link href="/predictions">
                <TrendingUp className="w-4 h-4" />
                Predictions
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {match.statistics && <TabsTrigger value="stats">Statistics</TabsTrigger>}
          {match.lineups.length > 0 && <TabsTrigger value="lineups">Lineups</TabsTrigger>}
          {match.events.length > 0 && <TabsTrigger value="commentary">Commentary</TabsTrigger>}
          {match.prediction && <TabsTrigger value="prediction">Prediction</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview">
          <div className="p-4 rounded-xl border border-white/8 bg-[#121821]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { label: "Venue", value: match.venue || "TBA" },
                { label: "Competition", value: match.league.name },
                { label: "Round", value: match.round || "—" },
                { label: "Season", value: match.season || "2024/25" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-sm font-semibold text-white">{item.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {match.statistics && (
          <TabsContent value="stats">
            <div className="p-5 rounded-xl border border-white/8 bg-[#121821] space-y-4">
              {[
                { label: "Possession", home: match.statistics.homePossession ?? 50, away: match.statistics.awayPossession ?? 50, unit: "%" },
                { label: "Shots", home: match.statistics.homeShots ?? 0, away: match.statistics.awayShots ?? 0 },
                { label: "Shots on Target", home: match.statistics.homeShotsOnTarget ?? 0, away: match.statistics.awayShotsOnTarget ?? 0 },
                { label: "Corners", home: match.statistics.homeCorners ?? 0, away: match.statistics.awayCorners ?? 0 },
                { label: "Yellow Cards", home: match.statistics.homeYellowCards ?? 0, away: match.statistics.awayYellowCards ?? 0 },
                { label: "Red Cards", home: match.statistics.homeRedCards ?? 0, away: match.statistics.awayRedCards ?? 0 },
                { label: "Offsides", home: match.statistics.homeOffsides ?? 0, away: match.statistics.awayOffsides ?? 0 },
                { label: "Fouls", home: match.statistics.homeFouls ?? 0, away: match.statistics.awayFouls ?? 0 },
                ...(match.statistics.homeXG !== null ? [{ label: "Expected Goals (xG)", home: match.statistics.homeXG ?? 0, away: match.statistics.awayXG ?? 0, decimals: 2 }] : []),
              ].map((stat) => (
                <StatRow key={stat.label} {...stat} />
              ))}
            </div>
          </TabsContent>
        )}

        {match.prediction && (
          <TabsContent value="prediction">
            <div className="p-5 rounded-xl border border-white/8 bg-[#121821] space-y-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-[#0B0F14] border border-white/8">
                  <div className="text-3xl font-black text-[#00FF84]">{match.prediction.homeWinProb.toFixed(0)}%</div>
                  <div className="text-xs text-gray-500 mt-1">Home Win</div>
                </div>
                <div className="p-4 rounded-xl bg-[#0B0F14] border border-white/8">
                  <div className="text-3xl font-black text-yellow-400">{match.prediction.drawProb.toFixed(0)}%</div>
                  <div className="text-xs text-gray-500 mt-1">Draw</div>
                </div>
                <div className="p-4 rounded-xl bg-[#0B0F14] border border-white/8">
                  <div className="text-3xl font-black text-blue-400">{match.prediction.awayWinProb.toFixed(0)}%</div>
                  <div className="text-xs text-gray-500 mt-1">Away Win</div>
                </div>
              </div>

              <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                <div className="h-full bg-[#00FF84] rounded-l-full" style={{ width: `${match.prediction.homeWinProb}%` }} />
                <div className="h-full bg-yellow-400" style={{ width: `${match.prediction.drawProb}%` }} />
                <div className="h-full bg-blue-400 rounded-r-full" style={{ width: `${match.prediction.awayWinProb}%` }} />
              </div>

              {match.prediction.expectedHomeGoals !== null && (
                <div className="flex items-center justify-between py-2 border-t border-white/8">
                  <span className="text-gray-400 text-sm">Expected Goals</span>
                  <span className="font-bold text-white">
                    {match.prediction.expectedHomeGoals.toFixed(1)} - {match.prediction.expectedAwayGoals?.toFixed(1)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-t border-white/8">
                <span className="text-gray-400 text-sm">Confidence</span>
                <span className="font-bold text-[#00FF84]">{match.prediction.confidence.toFixed(0)}%</span>
              </div>

              {match.prediction.aiExplanation && (
                <div className="p-4 rounded-xl bg-[#0B0F14]/50 border border-white/8">
                  <p className="text-sm text-gray-400 leading-relaxed">{match.prediction.aiExplanation}</p>
                </div>
              )}

              {match.prediction.expertAnalysis && (
                <div className="p-4 rounded-xl bg-[#00FF84]/5 border border-[#00FF84]/20">
                  <p className="text-xs font-bold text-[#00FF84] mb-1">EXPERT ANALYSIS</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{match.prediction.expertAnalysis}</p>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function StatRow({ label, home, away, unit = "", decimals = 0 }: { label: string; home: number; away: number; unit?: string; decimals?: number }) {
  const total = home + away || 1;
  const homeW = (home / total) * 100;
  const fmt = (v: number) => decimals > 0 ? v.toFixed(decimals) : v;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-bold text-white">{fmt(home)}{unit}</span>
        <span className="text-gray-500 text-xs">{label}</span>
        <span className="font-bold text-white">{fmt(away)}{unit}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        <div className="h-full bg-[#00FF84] rounded-l-full transition-all" style={{ width: `${homeW}%` }} />
        <div className="h-full bg-blue-400 rounded-r-full flex-1" />
      </div>
    </div>
  );
}
