export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LiveGoaliPlayer } from "@/components/player/LiveGoaliPlayer";
import { ViewTracker } from "@/components/ViewTracker";
import { LiveViewerTracker } from "@/components/LiveViewerTracker";
import { LiveMatchSidebar } from "@/components/match/LiveMatchSidebar";
import { LiveBadge } from "@/components/match/LiveBadge";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

interface Props {
  params: Promise<{ matchId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { matchId } = await params;
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        league: { select: { name: true } },
      },
    });
    if (!match) return { title: "Match Not Found" };
    return {
      title: `${match.homeTeam.name} vs ${match.awayTeam.name} Live`,
      description: `Watch ${match.homeTeam.name} vs ${match.awayTeam.name} live on LiveGoali — ${match.league.name}.`,
    };
  } catch {
    return { title: "Live Match | LiveGoali" };
  }
}

export default async function LiveMatchPage({ params }: Props) {
  const { matchId } = await params;

  let match;
  try {
    match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
        streams: { where: { isActive: true }, orderBy: { priority: "asc" } },
        statistics: true,
        events: { orderBy: { minute: "desc" }, take: 20 },
        prediction: true,
      },
    });
  } catch (err) {
    console.error("[LiveMatchPage] DB error:", err);
    notFound();
  }

  if (!match) notFound();

  const isLive = match.status === "LIVE" || match.status === "HALFTIME";

  return (
    <div className="bg-[#0B0F14]">
      <ViewTracker type="match" matchId={match.id} />
      <LiveViewerTracker matchId={match.id} />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Match header */}
        <div className="mb-6 p-4 rounded-2xl glass border border-white/8">
          {/* Top row: league + live badge */}
          <div className="flex items-center justify-between mb-4">
            <Link href={`/league/${match.league.slug}`} className="flex items-center gap-2 min-w-0">
              {match.league.logo && (
                <Image src={match.league.logo} alt={match.league.name} width={18} height={18} className="object-contain shrink-0" />
              )}
              <span className="text-xs text-gray-400 truncate">{match.league.name}</span>
            </Link>
            {isLive && <LiveBadge minute={match.matchMinute} status={match.status} />}
          </div>

          {/* Teams row */}
          <div className="flex items-center justify-between gap-2">
            {/* Home */}
            <Link href={`/team/${match.homeTeam.slug}`} className="flex flex-col sm:flex-row items-center gap-2 hover:opacity-80 transition-opacity flex-1 min-w-0">
              {match.homeTeam.logo && (
                <Image src={match.homeTeam.logo} alt={match.homeTeam.name} width={40} height={40} className="object-contain shrink-0" />
              )}
              <span className="font-bold text-white text-sm sm:text-lg text-center sm:text-left truncate">{match.homeTeam.name}</span>
            </Link>

            {/* VS */}
            <div className="text-xl sm:text-2xl font-black text-gray-500 shrink-0 px-2">VS</div>

            {/* Away */}
            <Link href={`/team/${match.awayTeam.slug}`} className="flex flex-col sm:flex-row-reverse items-center gap-2 hover:opacity-80 transition-opacity flex-1 min-w-0">
              {match.awayTeam.logo && (
                <Image src={match.awayTeam.logo} alt={match.awayTeam.name} width={40} height={40} className="object-contain shrink-0" />
              )}
              <span className="font-bold text-white text-sm sm:text-lg text-center sm:text-right truncate">{match.awayTeam.name}</span>
            </Link>
          </div>
        </div>

        {/* Player + sidebar */}
        <div className="grid lg:grid-cols-[1fr,380px] gap-6">
          <div>
            <LiveGoaliPlayer
              streams={match.streams.map((s) => ({
                id: s.id,
                url: s.url,
                type: s.type,
                quality: s.quality,
                isPrimary: s.isPrimary,
                isActive: s.isActive,
                priority: s.priority,
                label: s.label,
              }))}
              matchTitle={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
              homeTeam={match.homeTeam.shortName || match.homeTeam.name}
              awayTeam={match.awayTeam.shortName || match.awayTeam.name}
              homeScore={match.homeScore ?? 0}
              awayScore={match.awayScore ?? 0}
              isLive={isLive}
              matchMinute={match.matchMinute}
            />

            {/* Stats */}
            {match.statistics && (
              <div className="mt-4 p-4 rounded-xl glass border border-white/8">
                <h3 className="text-sm font-bold text-white mb-4">Match Statistics</h3>
                <div className="space-y-3">
                  {[
                    { label: "Possession", home: match.statistics.homePossession ?? 50, away: match.statistics.awayPossession ?? 50, unit: "%" },
                    { label: "Shots", home: match.statistics.homeShots ?? 0, away: match.statistics.awayShots ?? 0 },
                    { label: "Shots on Target", home: match.statistics.homeShotsOnTarget ?? 0, away: match.statistics.awayShotsOnTarget ?? 0 },
                    { label: "Corners", home: match.statistics.homeCorners ?? 0, away: match.statistics.awayCorners ?? 0 },
                    { label: "Yellow Cards", home: match.statistics.homeYellowCards ?? 0, away: match.statistics.awayYellowCards ?? 0 },
                    { label: "Fouls", home: match.statistics.homeFouls ?? 0, away: match.statistics.awayFouls ?? 0 },
                  ].map((stat) => (
                    <StatRow key={stat.label} {...stat} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <LiveMatchSidebar
            matchId={match.id}
            enableChat={match.enableChat}
            enableComments={match.enableComments}
            events={match.events.map((e) => ({
              id: e.id,
              type: e.type,
              minute: e.minute,
              playerName: e.playerName,
              teamId: e.teamId,
              description: e.description,
            }))}
            prediction={match.prediction ? {
              homeWinProb: match.prediction.homeWinProb,
              drawProb: match.prediction.drawProb,
              awayWinProb: match.prediction.awayWinProb,
              confidence: match.prediction.confidence,
              aiExplanation: match.prediction.aiExplanation,
              expectedHomeGoals: match.prediction.expectedHomeGoals,
              expectedAwayGoals: match.prediction.expectedAwayGoals,
            } : null}
            homeTeam={match.homeTeam.name}
            awayTeam={match.awayTeam.name}
          />
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, home, away, unit = "" }: { label: string; home: number; away: number; unit?: string }) {
  const homeWidth = (home / (home + away || 1)) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span className="font-semibold text-white">{home}{unit}</span>
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-white">{away}{unit}</span>
      </div>
      <div className="flex h-1.5 gap-0.5 rounded-full overflow-hidden">
        <div className="bg-[#00FF84] rounded-l-full transition-all" style={{ width: `${homeWidth}%` }} />
        <div className="bg-blue-400 rounded-r-full transition-all flex-1" />
      </div>
    </div>
  );
}
