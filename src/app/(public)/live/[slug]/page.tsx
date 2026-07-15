export const dynamic = "force-dynamic";

import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cacheGet, cacheSet, acquireLock, releaseLock } from "@/lib/redis";
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
import { Trophy, Wifi } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

async function fetchMatchFromDb(slug: string) {
  return prisma.match.findUnique({
    where: { slug },
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

// cache() dedupes this across generateMetadata and the page body within the
// same request. The lock below also protects across *different* visitors:
// when the 10s cache expires, a burst of concurrent viewers would otherwise
// all miss at once and hammer the DB simultaneously (a cache stampede).
const getMatchData = cache(async (slug: string): Promise<MatchData | null> => {
  try {
    const cached = await cacheGet<MatchData>(`match:live:${slug}`);
    if (cached) return cached;
  } catch {}

  const lockKey = `lock:match:live:${slug}`;
  const gotLock = await acquireLock(lockKey, 5);
  if (!gotLock) {
    // Another request is already refreshing this match — briefly wait for
    // its result instead of piling another DB query on top of it.
    await new Promise((r) => setTimeout(r, 150));
    try {
      const cached = await cacheGet<MatchData>(`match:live:${slug}`);
      if (cached) return cached;
    } catch {}
  }

  try {
    const match = await fetchMatchFromDb(slug);
    if (match) {
      try { await cacheSet(`match:live:${slug}`, match, 10); } catch {}
    }
    return match;
  } finally {
    if (gotLock) await releaseLock(lockKey);
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const match = await getMatchData(slug);
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
  const { slug } = await params;

  let match: MatchData | null;
  try {
    match = await getMatchData(slug);
  } catch (err) {
    console.error("[LiveMatchPage] DB error:", err);
    return notFound();
  }

  if (!match) notFound();

  // Unpublished imports (e.g. pending PPV approval) are only visible to staff previewing them.
  if (!match.isPublished) {
    const session = await auth();
    const role = session?.user?.role;
    if (!role || !["ADMIN", "SUPER_ADMIN", "EDITOR"].includes(role)) notFound();
  }

  const isLive = match.status === "LIVE" || match.status === "HALFTIME";
  const isFinished = match.status === "FINISHED";
  const sportSlug = match.sport?.slug ?? null;
  const isFootball = sportSlug === "football" || !!match.homeTeamId;
  const SOLO_SPORTS = ["formula1"];
  const hasScore = sportSlug === "football" || (!sportSlug && !!match.homeTeamId);
  const isSoloEvent = SOLO_SPORTS.includes(sportSlug ?? "");
  const hasTwoSides = isFootball || (!isSoloEvent && !!match.participant1 && !!match.participant2);

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

  const homeScore = match.homeScore ?? 0;
  const awayScore = match.awayScore ?? 0;
  const homeWinning = hasScore && homeScore > awayScore;
  const awayWinning = hasScore && awayScore > homeScore;

  return (
    <div className="min-h-screen bg-background">
      <MatchWatcher matchId={match.id} />
      <ViewTracker type="match" matchId={match.id} />
      <LiveViewerTracker matchId={match.id} />

      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">

        {/* ── MATCH HEADER ── */}
        <div className="relative rounded-2xl overflow-hidden border border-white/8"
          style={{ background: "linear-gradient(135deg, #0f1923 0%, #0F172A 60%, #0f1923 100%)" }}>
          {/* Ambient glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-32 rounded-full opacity-20 blur-3xl"
              style={{ background: "radial-gradient(circle, var(--accent), transparent)" }} />
            <div className="absolute top-0 right-1/4 w-64 h-32 rounded-full opacity-15 blur-3xl"
              style={{ background: "radial-gradient(circle, var(--primary), transparent)" }} />
          </div>
          {/* Top accent line */}
          <div className={`absolute inset-x-0 top-0 h-0.5 ${isLive ? "bg-gradient-to-r from-transparent via-danger to-transparent" : "bg-gradient-to-r from-transparent via-primary/60 to-transparent"}`} />

          <div className="relative p-3 sm:p-4">
            {/* League row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                {match.league?.logo ? (
                  <Image src={match.league.logo} alt={match.league.name} width={20} height={20} className="object-contain shrink-0" style={{ width: 20, height: 20 }} />
                ) : match.sport?.icon ? (
                  <span className="text-lg leading-none">{match.sport.icon}</span>
                ) : (
                  <Trophy className="w-4 h-4 text-white/40" />
                )}
                {match.league?.slug ? (
                  <Link href={`/league/${match.league.slug}`} className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
                    {match.league.name}
                    {match.league.country && <span className="text-white/40 ml-1.5 text-xs">· {match.league.country}</span>}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-white/70">{match.sport?.name ?? "Live Event"}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isLive && (
                  <span className="flex items-center gap-1.5 text-xs font-black text-white/40">
                    <Wifi className="w-3.5 h-3.5" /> Streaming
                  </span>
                )}
                <LiveBadge minute={match.matchMinute} status={match.status} size="md" />
                {isFinished && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/8 text-white/50 border border-white/10">
                    FINISHED
                  </span>
                )}
              </div>
            </div>

            {/* Teams / Score */}
            {isFootball ? (
              <div className="flex items-center gap-1.5 sm:gap-3">
                {/* Home team */}
                <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-2 min-w-0">
                  {match.homeTeam?.logo ? (
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 p-1 border ${homeWinning ? "border-accent/30 bg-accent/8 shadow-[0_0_20px_rgba(16,185,129,0.15)]" : "border-white/8 bg-white/4"}`}>
                      <Image src={match.homeTeam.logo} alt={match.homeTeam.name} width={26} height={26} className="object-contain" style={{ width: 26, height: 26 }} />
                    </div>
                  ) : (
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 border text-sm font-black ${homeWinning ? "border-accent/30 bg-accent/10 text-accent" : "border-white/8 bg-white/5 text-white"}`}>
                      {(match.homeTeam?.name ?? match.participant1 ?? "H").charAt(0)}
                    </div>
                  )}
                  {match.homeTeam?.slug ? (
                    <Link href={`/team/${match.homeTeam.slug}`} className="text-center sm:text-left hover:opacity-80 transition-opacity min-w-0">
                      <p className={`font-black text-xs sm:text-sm leading-tight truncate ${homeWinning ? "text-accent" : "text-white"}`}>
                        {match.homeTeam.name}
                      </p>
                    </Link>
                  ) : (
                    <p className={`font-black text-xs sm:text-sm text-center sm:text-left truncate ${homeWinning ? "text-accent" : "text-white"}`}>
                      {match.participant1 ?? "Home"}
                    </p>
                  )}
                </div>

                {/* Score / VS */}
                <div className="text-center shrink-0 flex flex-col items-center gap-0.5">
                  {(isLive || isFinished) && hasScore ? (
                    <>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span className={`text-xl sm:text-2xl font-black tabular-nums leading-none ${homeWinning ? "text-accent" : "text-white"}`}>{homeScore}</span>
                        <span className="text-sm sm:text-base text-white/25 font-black">—</span>
                        <span className={`text-xl sm:text-2xl font-black tabular-nums leading-none ${awayWinning ? "text-primary" : "text-white"}`}>{awayScore}</span>
                      </div>
                      {match.status === "HALFTIME" && (
                        <span className="text-xs font-bold text-warning bg-warning/12 border border-warning/20 px-2.5 py-0.5 rounded-full mt-1">Half Time</span>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-base sm:text-lg font-black text-white/30">VS</span>
                    </div>
                  )}
                </div>

                {/* Away team */}
                <div className="flex-1 flex flex-col sm:flex-row-reverse items-center sm:items-center gap-1 sm:gap-2 min-w-0">
                  {match.awayTeam?.logo ? (
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 p-1 border ${awayWinning ? "border-primary/30 bg-primary/8 shadow-[0_0_20px_rgba(37,99,235,0.15)]" : "border-white/8 bg-white/4"}`}>
                      <Image src={match.awayTeam.logo} alt={match.awayTeam.name} width={26} height={26} className="object-contain" style={{ width: 26, height: 26 }} />
                    </div>
                  ) : (
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 border text-sm font-black ${awayWinning ? "border-primary/30 bg-primary/10 text-primary" : "border-white/8 bg-white/5 text-white"}`}>
                      {(match.awayTeam?.name ?? match.participant2 ?? "A").charAt(0)}
                    </div>
                  )}
                  {match.awayTeam?.slug ? (
                    <Link href={`/team/${match.awayTeam.slug}`} className="text-center sm:text-right hover:opacity-80 transition-opacity min-w-0">
                      <p className={`font-black text-xs sm:text-sm leading-tight truncate ${awayWinning ? "text-primary" : "text-white"}`}>
                        {match.awayTeam.name}
                      </p>
                    </Link>
                  ) : (
                    <p className={`font-black text-xs sm:text-sm text-center sm:text-right truncate ${awayWinning ? "text-primary" : "text-white"}`}>
                      {match.participant2 ?? "Away"}
                    </p>
                  )}
                </div>
              </div>
            ) : hasTwoSides ? (
              /* ── Head-to-head: UFC, Boxing, Cricket, etc. ── */
              <div className="flex items-center gap-4 sm:gap-8">
                <div className="flex-1 flex flex-col items-center gap-3 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 border-2 border-accent/25 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.12)]">
                    <span className="text-2xl font-black text-accent">{(match.participant1 ?? "?").charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="font-black text-white text-base sm:text-lg leading-tight">{match.participant1}</span>
                </div>
                <div className="flex flex-col items-center gap-2 shrink-0">
                  {match.sport?.icon && <span className="text-3xl leading-none">{match.sport.icon}</span>}
                  <span className="text-lg sm:text-2xl font-black text-white/30">VS</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-3 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/25 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.12)]">
                    <span className="text-2xl font-black text-primary">{(match.participant2 ?? "?").charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="font-black text-white text-base sm:text-lg leading-tight">{match.participant2}</span>
                </div>
              </div>
            ) : (
              /* ── Solo event ── */
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                {match.sport?.icon && <span className="text-5xl leading-none">{match.sport.icon}</span>}
                <div className="font-black text-white text-xl sm:text-3xl leading-tight">
                  {match.title ?? match.participant1 ?? "Live Event"}
                </div>
                {match.sport?.name && <div className="text-sm text-white/40">{match.sport.name}</div>}
              </div>
            )}
          </div>
        </div>

        {/* ── PLAYER + SIDEBAR ── */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-4">
          {/* Left column */}
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-white/6 shadow-2xl xl:max-w-4xl 2xl:max-w-5xl xl:mx-auto">
              <LiveGoaliPlayer
                streams={playerStreams}
                matchTitle={match.title ?? `${match.homeTeam?.name ?? match.participant1 ?? ""} vs ${match.awayTeam?.name ?? match.participant2 ?? ""}`}
                homeTeam={match.homeTeam?.shortName ?? match.homeTeam?.name ?? match.participant1 ?? undefined}
                awayTeam={match.awayTeam?.shortName ?? match.awayTeam?.name ?? match.participant2 ?? undefined}
                homeScore={hasScore ? homeScore : undefined}
                awayScore={hasScore ? awayScore : undefined}
                isLive={isLive}
                matchMinute={isFootball ? match.matchMinute : undefined}
              />
            </div>

            {/* Match Statistics */}
            {isFootball && match.statistics && (
              <div className="rounded-2xl border border-white/8 bg-card overflow-hidden">
                <div className="px-5 py-4 border-b border-white/6 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-sm">📊</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">Match Statistics</h3>
                </div>
                <div className="p-5 space-y-4">
                  {[
                    { label: "Possession", home: match.statistics.homePossession ?? 50, away: match.statistics.awayPossession ?? 50, unit: "%", homeColor: "var(--accent)", awayColor: "var(--primary)" },
                    { label: "Shots", home: match.statistics.homeShots ?? 0, away: match.statistics.awayShots ?? 0, homeColor: "var(--accent)", awayColor: "var(--primary)" },
                    { label: "Shots on Target", home: match.statistics.homeShotsOnTarget ?? 0, away: match.statistics.awayShotsOnTarget ?? 0, homeColor: "var(--accent)", awayColor: "var(--primary)" },
                    { label: "Corners", home: match.statistics.homeCorners ?? 0, away: match.statistics.awayCorners ?? 0, homeColor: "var(--accent)", awayColor: "var(--primary)" },
                    { label: "Yellow Cards", home: match.statistics.homeYellowCards ?? 0, away: match.statistics.awayYellowCards ?? 0, homeColor: "var(--warning)", awayColor: "var(--warning)" },
                    { label: "Fouls", home: match.statistics.homeFouls ?? 0, away: match.statistics.awayFouls ?? 0, homeColor: "var(--danger)", awayColor: "var(--danger)" },
                  ].map((stat) => (
                    <StatRow key={stat.label} {...stat} />
                  ))}
                </div>
              </div>
            )}

            {/* Ad below player */}
            <AdBanner placement="FOOTER" className="h-16 sm:h-20 rounded-xl" />
          </div>

          {/* Right column — sidebar */}
          <div className="space-y-4">
            <AdBanner placement="SIDEBAR" className="h-20 sm:h-24 rounded-xl" />
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

function StatRow({
  label, home, away, unit = "", homeColor, awayColor,
}: {
  label: string; home: number; away: number; unit?: string; homeColor: string; awayColor: string;
}) {
  const total = home + away || 1;
  const homeWidth = Math.round((home / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-black tabular-nums" style={{ color: homeColor }}>{home}{unit}</span>
        <span className="text-xs text-white/50 font-medium">{label}</span>
        <span className="font-black tabular-nums" style={{ color: awayColor }}>{away}{unit}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5">
        <div className="rounded-l-full transition-all duration-500" style={{ width: `${homeWidth}%`, background: homeColor }} />
        <div className="rounded-r-full transition-all duration-500 flex-1" style={{ background: awayColor, opacity: 0.5 }} />
      </div>
    </div>
  );
}
