export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/redis";
import { LiveGoaliPlayer } from "@/components/player/LiveGoaliPlayer";
import { ViewTracker } from "@/components/ViewTracker";
import { LiveViewerTracker } from "@/components/LiveViewerTracker";
import { LiveMatchSidebar } from "@/components/match/LiveMatchSidebar";
import { LiveBadge } from "@/components/match/LiveBadge";
import { MatchWatcher } from "@/components/match/MatchWatcher";
import { AdBanner } from "@/components/AdBanner";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

interface Props {
  params: Promise<{ matchId: string }>;
}

// Raw DB fetch — all fields needed by both generateMetadata and the page body.
async function fetchMatchFromDb(matchId: string) {
  return prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
      awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
      league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
      sport: { select: { id: true, name: true, icon: true, slug: true } },
      streams: { where: { isActive: true }, orderBy: { priority: "asc" } },
      statistics: true,
      events: { orderBy: { minute: "desc" }, take: 20 },
      prediction: true,
    },
  });
}

type MatchData = NonNullable<Awaited<ReturnType<typeof fetchMatchFromDb>>>;

// Redis-cached — 10s TTL lets generateMetadata and the page body share one DB
// query, eliminating the double-fetch that caused 150k queries at 75k viewers.
async function getMatchData(matchId: string): Promise<MatchData | null> {
  try {
    const cached = await cacheGet<MatchData>(`match:live:${matchId}`);
    if (cached) return cached;
  } catch {}
  const match = await fetchMatchFromDb(matchId);
  if (match) {
    try { await cacheSet(`match:live:${matchId}`, match, 10); } catch {}
  }
  return match;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { matchId } = await params;
    const match = await getMatchData(matchId);
    if (!match) return { title: "Match Not Found" };
    const p1 = match.homeTeam?.name ?? match.participant1 ?? "TBA";
    const p2 = match.awayTeam?.name ?? match.participant2 ?? "TBA";
    const eventTitle = match.title ?? `${p1} vs ${p2}`;
    const competition = match.league?.name ?? "";
    return {
      title: `${eventTitle} — Live`,
      description: competition
        ? `Watch ${eventTitle} live on LiveGoali — ${competition}.`
        : `Watch ${eventTitle} live on LiveGoali.`,
    };
  } catch {
    return { title: "Live Match | LiveGoali" };
  }
}

export default async function LiveMatchPage({ params }: Props) {
  const { matchId } = await params;

  let match: MatchData | null;
  try {
    match = await getMatchData(matchId);
  } catch (err) {
    console.error("[LiveMatchPage] DB error:", err);
    return notFound();
  }

  if (!match) notFound();

  const isLive = match.status === "LIVE" || match.status === "HALFTIME";
  const sportSlug = match.sport?.slug ?? null;
  const isFootball = sportSlug === "football" || !!match.homeTeamId;
  const SOLO_SPORTS = ["formula1"]; // races — no direct opponent
  const hasScore = sportSlug === "football" || (!sportSlug && !!match.homeTeamId);
  const isSoloEvent = SOLO_SPORTS.includes(sportSlug ?? "");
  const hasTwoSides = isFootball || (!isSoloEvent && !!match.participant1 && !!match.participant2);

  // If the stored value is a full <iframe> tag, extract just the src URL.
  function extractStreamUrl(raw: string): string {
    if (raw.trimStart().startsWith("<")) {
      const m = raw.match(/src="([^"]+)"/);
      return m?.[1] ?? raw;
    }
    return raw;
  }

  const playerStreams = match.streams.length > 0
    ? match.streams.map((s) => ({
        id: s.id,
        url: extractStreamUrl(s.url),
        type: s.type,
        quality: s.quality,
        isPrimary: s.isPrimary,
        isActive: s.isActive,
        priority: s.priority,
        label: s.label,
      }))
    : match.streamUrl
      ? [{
          id: "global",
          url: extractStreamUrl(match.streamUrl),
          type: (match.streamType ?? "IFRAME") as import("@prisma/client").StreamType,
          quality: match.streamQuality ?? "HD",
          isPrimary: true,
          isActive: true,
          priority: 0,
          label: "Global Stream",
        }]
      : [];

  return (
    <div className="bg-[#0B0F14]">
      <MatchWatcher matchId={match.id} />
      <ViewTracker type="match" matchId={match.id} />
      <LiveViewerTracker matchId={match.id} />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Match header */}
        <div className="mb-6 p-4 rounded-2xl glass border border-white/8">
          {/* Top row: league/sport + live badge */}
          <div className="flex items-center justify-between mb-4">
            {match.league?.slug ? (
              <Link href={`/league/${match.league.slug}`} className="flex items-center gap-2 min-w-0">
                {match.league.logo && (
                  <Image src={match.league.logo} alt={match.league.name} width={18} height={18} className="object-contain shrink-0" />
                )}
                <span className="text-xs text-white/75 truncate">{match.league.name}</span>
              </Link>
            ) : (
              <span className="text-xs text-white/75 truncate">{match.title ?? "Live Event"}</span>
            )}
            {isLive && <LiveBadge minute={match.matchMinute} status={match.status} />}
          </div>

          {/* Teams / Event — sport conditional */}
          {isFootball ? (
            /* ── Football: team logos + score ── */
            <div className="flex items-center justify-between gap-2">
              {match.homeTeam?.slug ? (
                <Link href={`/team/${match.homeTeam.slug}`} className="flex flex-col sm:flex-row items-center gap-2 hover:opacity-80 transition-opacity flex-1 min-w-0">
                  {match.homeTeam.logo && (
                    <Image src={match.homeTeam.logo} alt={match.homeTeam.name} width={40} height={40} className="object-contain shrink-0" />
                  )}
                  <span className="font-bold text-white text-sm sm:text-lg text-center sm:text-left truncate">{match.homeTeam.name}</span>
                </Link>
              ) : (
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-white text-sm sm:text-lg truncate">{match.participant1 ?? "—"}</span>
                </div>
              )}
              <div className="text-center shrink-0 px-3">
                {(match.status === "LIVE" || match.status === "HALFTIME" || match.status === "FINISHED") && hasScore ? (
                  <div className="text-2xl sm:text-3xl font-black text-[#00FF84] tabular-nums leading-none">
                    {match.homeScore ?? 0} – {match.awayScore ?? 0}
                  </div>
                ) : (
                  <div className="text-xl sm:text-2xl font-black text-white/60">VS</div>
                )}
              </div>
              {match.awayTeam?.slug ? (
                <Link href={`/team/${match.awayTeam.slug}`} className="flex flex-col sm:flex-row-reverse items-center gap-2 hover:opacity-80 transition-opacity flex-1 min-w-0">
                  {match.awayTeam.logo && (
                    <Image src={match.awayTeam.logo} alt={match.awayTeam.name} width={40} height={40} className="object-contain shrink-0" />
                  )}
                  <span className="font-bold text-white text-sm sm:text-lg text-center sm:text-right truncate">{match.awayTeam.name}</span>
                </Link>
              ) : (
                <div className="flex-1 min-w-0 text-right">
                  <span className="font-bold text-white text-sm sm:text-lg truncate">{match.participant2 ?? "—"}</span>
                </div>
              )}
            </div>
          ) : hasTwoSides ? (
            /* ── Head-to-head: UFC, Boxing, Cricket, etc. ── */
            <div className="flex items-center gap-4">
              <div className="flex-1 flex flex-col items-center gap-2 text-center min-w-0">
                <div className="w-14 h-14 rounded-full bg-[#00FF84]/10 border-2 border-[#00FF84]/25 flex items-center justify-center shrink-0">
                  <span className="text-xl font-black text-[#00FF84]">{(match.participant1 ?? "?").charAt(0).toUpperCase()}</span>
                </div>
                <span className="font-bold text-white text-sm sm:text-base leading-tight w-full">{match.participant1}</span>
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                {match.sport?.icon && <span className="text-2xl leading-none">{match.sport.icon}</span>}
                <span className="text-base sm:text-lg font-black text-white/50">VS</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 text-center min-w-0">
                <div className="w-14 h-14 rounded-full bg-blue-500/10 border-2 border-blue-500/25 flex items-center justify-center shrink-0">
                  <span className="text-xl font-black text-blue-400">{(match.participant2 ?? "?").charAt(0).toUpperCase()}</span>
                </div>
                <span className="font-bold text-white text-sm sm:text-base leading-tight w-full">{match.participant2}</span>
              </div>
            </div>
          ) : (
            /* ── Solo event: F1 race, etc. ── */
            <div className="flex flex-col items-center gap-2 py-1 text-center">
              {match.sport?.icon && <span className="text-4xl leading-none">{match.sport.icon}</span>}
              <div className="font-black text-white text-lg sm:text-2xl leading-tight">
                {match.title ?? match.participant1 ?? "Live Event"}
              </div>
              {match.sport?.name && <div className="text-xs text-white/50 mt-0.5">{match.sport.name}</div>}
            </div>
          )}
        </div>

        {/* Player + sidebar */}
        <div className="grid lg:grid-cols-[1fr,380px] gap-6">
          <div>
            <LiveGoaliPlayer
              streams={playerStreams}
              matchTitle={match.title ?? `${match.homeTeam?.name ?? match.participant1 ?? ""} vs ${match.awayTeam?.name ?? match.participant2 ?? ""}`}
              homeTeam={match.homeTeam?.shortName ?? match.homeTeam?.name ?? match.participant1 ?? undefined}
              awayTeam={match.awayTeam?.shortName ?? match.awayTeam?.name ?? match.participant2 ?? undefined}
              homeScore={hasScore ? (match.homeScore ?? 0) : undefined}
              awayScore={hasScore ? (match.awayScore ?? 0) : undefined}
              isLive={isLive}
              matchMinute={isFootball ? match.matchMinute : undefined}
            />

            {/* Stats — football only */}
            {isFootball && match.statistics && (
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

          <div className="space-y-4">
            <AdBanner placement="SIDEBAR" className="h-24 sm:h-28" />
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
            homeTeam={match.homeTeam?.name ?? match.participant1 ?? ""}
            awayTeam={match.awayTeam?.name ?? match.participant2 ?? ""}
          />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, home, away, unit = "" }: { label: string; home: number; away: number; unit?: string }) {
  const homeWidth = (home / (home + away || 1)) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-white/75">
        <span className="font-semibold text-white">{home}{unit}</span>
        <span className="text-white/70">{label}</span>
        <span className="font-semibold text-white">{away}{unit}</span>
      </div>
      <div className="flex h-1.5 gap-0.5 rounded-full overflow-hidden">
        <div className="bg-[#00FF84] rounded-l-full transition-all" style={{ width: `${homeWidth}%` }} />
        <div className="bg-blue-400 rounded-r-full transition-all flex-1" />
      </div>
    </div>
  );
}
