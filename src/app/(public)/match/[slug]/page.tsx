export const dynamic = "force-dynamic";
import { cache } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveBadge } from "@/components/match/LiveBadge";
import { Button } from "@/components/ui/button";
import { Play, TrendingUp } from "lucide-react";
import { LocalTime } from "@/components/LocalTime";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

// cache() dedupes this across generateMetadata and the page body within the
// same request — without it, every page view ran the same deep query twice.
const getMatch = cache(async (slug: string) => {
  return prisma.match.findUnique({
    where: { slug },
    include: {
      homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
      awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
      league: { select: { id: true, name: true, slug: true, logo: true, country: true, season: true } },
      sport: { select: { id: true, name: true, icon: true, slug: true } },
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
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const match = await getMatch(slug);
  if (!match) return { title: "Match Not Found" };
  const p1 = match.homeTeam?.name ?? match.participant1 ?? "TBA";
  const p2 = match.awayTeam?.name ?? match.participant2 ?? "TBA";
  return {
    title: match.title ?? `${p1} vs ${p2}`,
    description: `${p1} vs ${p2}${match.league?.name ? ` - ${match.league.name}` : ""}`,
  };
}

export default async function MatchPage({ params }: Props) {
  const { slug } = await params;

  const match = await getMatch(slug);

  if (!match) notFound();

  if (!match.isPublished) {
    const session = await auth();
    const role = session?.user?.role;
    if (!role || !["ADMIN", "SUPER_ADMIN", "EDITOR"].includes(role)) notFound();
  }

  const isLive = match.status === "LIVE" || match.status === "HALFTIME";
  const isScheduled = match.status === "SCHEDULED";
  const sportSlug = match.sport?.slug ?? null;
  const isFootball = sportSlug === "football" || !!match.homeTeamId;
  // isFootball answers "does this match have real Team rows to render logos
  // for" (true for any team-based sport, including basketball/volleyball
  // once they have Team rows). The Overview grid below needs a narrower
  // signal: "does this match actually have league/competition data to show"
  // — a PPV import (any sport, football included) has no league, so it falls
  // back to the Sport-name field instead of blank Competition/Round/Season.
  const isRealFootball = sportSlug === "football" && !!match.league;
  const SOLO_SPORTS = ["formula1"];
  const hasScore = sportSlug === "football" || (!sportSlug && !!match.homeTeamId);
  const isSoloEvent = SOLO_SPORTS.includes(sportSlug ?? "");
  const hasTwoSides = isFootball || (!isSoloEvent && !!match.participant1 && !!match.participant2);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Match Header */}
      <div className="rounded-2xl border border-white/8 bg-card overflow-hidden mb-6">
        {/* Competition */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/8 bg-background/50">
          <div className="flex items-center gap-2">
            {match.league?.logo && (
              <Image src={match.league.logo} alt={match.league.name} width={20} height={20} className="object-contain" />
            )}
            {match.league?.slug ? (
              <Link href={`/league/${match.league.slug}`} className="text-sm text-white/75 hover:text-primary transition-colors">
                {match.league.name}
              </Link>
            ) : (
              <span className="text-sm text-white/75">{match.title ?? "Event"}</span>
            )}
            {match.round && <span className="text-white/60 text-sm">· {match.round}</span>}
          </div>
          {isLive ? (
            <LiveBadge minute={match.matchMinute} status={match.status} />
          ) : (
            <span className="text-sm text-white/70"><LocalTime iso={String(match.scheduledAt)} format="full" /></span>
          )}
        </div>

        {/* Event header */}
        <div className="p-8">
          {isFootball ? (
            /* ── Football: team logos with score ── */
            <div className="flex items-center justify-around">
              {match.homeTeam?.slug ? (
                <Link href={`/team/${match.homeTeam.slug}`} className="flex flex-col items-center gap-3 group">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-background border border-white/8 group-hover:border-accent/30 transition-all">
                    {match.homeTeam.logo ? (
                      <Image src={match.homeTeam.logo} alt={match.homeTeam.name} width={60} height={60} className="object-contain" />
                    ) : (
                      <span className="text-3xl font-black text-accent">{match.homeTeam.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="font-bold text-white text-center group-hover:text-accent transition-colors">{match.homeTeam.name}</span>
                </Link>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-background border border-white/8">
                    <span className="text-3xl font-black text-accent">{(match.participant1 ?? "?").charAt(0)}</span>
                  </div>
                  <span className="font-bold text-white text-center">{match.participant1 ?? "—"}</span>
                </div>
              )}
              <div className="text-center">
                {(isLive || match.status === "FINISHED") && hasScore ? (
                  <div className="text-4xl font-black text-white tabular-nums leading-none mb-2">{match.homeScore ?? 0} – {match.awayScore ?? 0}</div>
                ) : (
                  <div className="text-5xl font-black text-white/60 mb-2">VS</div>
                )}
                <div className="text-sm text-white/70"><LocalTime iso={String(match.scheduledAt)} format="full" /></div>
              </div>
              {match.awayTeam?.slug ? (
                <Link href={`/team/${match.awayTeam.slug}`} className="flex flex-col items-center gap-3 group">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-background border border-white/8 group-hover:border-primary/30 transition-all">
                    {match.awayTeam.logo ? (
                      <Image src={match.awayTeam.logo} alt={match.awayTeam.name} width={60} height={60} className="object-contain" />
                    ) : (
                      <span className="text-3xl font-black text-primary">{match.awayTeam.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="font-bold text-white text-center group-hover:text-primary transition-colors">{match.awayTeam.name}</span>
                </Link>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-background border border-white/8">
                    <span className="text-3xl font-black text-primary">{(match.participant2 ?? "?").charAt(0)}</span>
                  </div>
                  <span className="font-bold text-white text-center">{match.participant2 ?? "—"}</span>
                </div>
              )}
            </div>
          ) : hasTwoSides ? (
            /* ── Head-to-head: UFC, Boxing, Cricket, etc. ── */
            <div className="flex items-center justify-around gap-4">
              <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
                <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent/25 flex items-center justify-center">
                  <span className="text-3xl font-black text-accent">{(match.participant1 ?? "?").charAt(0).toUpperCase()}</span>
                </div>
                <span className="font-bold text-white text-center text-sm sm:text-base leading-tight">{match.participant1 ?? "—"}</span>
              </div>
              <div className="flex flex-col items-center gap-2 shrink-0">
                {match.sport?.icon && <span className="text-4xl leading-none">{match.sport.icon}</span>}
                <div className="text-3xl font-black text-white/50">VS</div>
                <div className="text-xs text-white/50"><LocalTime iso={String(match.scheduledAt)} format="full" /></div>
              </div>
              <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
                <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/25 flex items-center justify-center">
                  <span className="text-3xl font-black text-primary">{(match.participant2 ?? "?").charAt(0).toUpperCase()}</span>
                </div>
                <span className="font-bold text-white text-center text-sm sm:text-base leading-tight">{match.participant2 ?? "—"}</span>
              </div>
            </div>
          ) : (
            /* ── Solo event: F1 race, etc. ── */
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              {match.sport?.icon && <span className="text-6xl leading-none">{match.sport.icon}</span>}
              <div>
                <div className="text-2xl font-black text-white leading-tight">
                  {match.title ?? match.participant1 ?? "Live Event"}
                </div>
                {match.sport?.name && <div className="text-sm text-white/50 mt-1">{match.sport.name}</div>}
              </div>
              <div className="text-sm text-white/60"><LocalTime iso={String(match.scheduledAt)} format="full" /></div>
            </div>
          )}


          {/* Match Events (goals) — football only */}
          {isFootball && match.events.filter((e) => e.type === "GOAL").length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/8 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                {match.events.filter((e) => e.type === "GOAL" && e.teamId === match.homeTeamId).map((e) => (
                  <div key={e.id} className="text-sm text-white/75">
                    ⚽ {e.playerName} <span className="text-accent font-bold">{e.minute}&apos;</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-right">
                {match.events.filter((e) => e.type === "GOAL" && e.teamId === match.awayTeamId).map((e) => (
                  <div key={e.id} className="text-sm text-white/75">
                    <span className="text-accent font-bold">{e.minute}&apos;</span> {e.playerName} ⚽
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3 justify-center">
          {isLive && (match.streams.length > 0 || !!match.streamUrl) && (
            <Button asChild>
              <Link href={`/live/${match.slug}`}>
                <Play className="w-4 h-4" />
                {sportSlug === "formula1" ? "Watch Race"
                  : (sportSlug === "ufc" || sportSlug === "boxing") ? "Watch Fight"
                  : "Watch Live"}
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
          {isFootball && match.statistics && <TabsTrigger value="stats">Statistics</TabsTrigger>}
          {isFootball && match.lineups.length > 0 && <TabsTrigger value="lineups">Lineups</TabsTrigger>}
          {isFootball && match.events.length > 0 && <TabsTrigger value="commentary">Commentary</TabsTrigger>}
          {isFootball && match.prediction && <TabsTrigger value="prediction">Prediction</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview">
          <div className="p-4 rounded-xl border border-white/8 bg-card">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {(isRealFootball ? [
                { label: "Venue", value: match.venue || "TBA" },
                { label: "Competition", value: match.league?.name || "—" },
                { label: "Round", value: match.round || "—" },
                { label: "Season", value: match.league?.season || match.season || "—" },
              ] : [
                { label: "Venue", value: match.venue || "TBA" },
                { label: "Sport", value: match.sport ? `${match.sport.icon} ${match.sport.name}` : "—" },
                { label: "Round / Stage", value: match.round || "—" },
                { label: "Season", value: match.season || "—" },
              ]).map((item) => (
                <div key={item.label}>
                  <div className="text-sm font-semibold text-white">{item.value}</div>
                  <div className="text-xs text-white/70 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {isFootball && match.statistics && (
          <TabsContent value="stats">
            <div className="p-5 rounded-xl border border-white/8 bg-card space-y-4">
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

        {isFootball && match.prediction && (
          <TabsContent value="prediction">
            <div className="p-5 rounded-xl border border-white/8 bg-card space-y-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-background border border-white/8">
                  <div className="text-3xl font-black text-accent">{match.prediction.homeWinProb.toFixed(0)}%</div>
                  <div className="text-xs text-white/70 mt-1">Home Win</div>
                </div>
                <div className="p-4 rounded-xl bg-background border border-white/8">
                  <div className="text-3xl font-black text-warning">{match.prediction.drawProb.toFixed(0)}%</div>
                  <div className="text-xs text-white/70 mt-1">Draw</div>
                </div>
                <div className="p-4 rounded-xl bg-background border border-white/8">
                  <div className="text-3xl font-black text-primary">{match.prediction.awayWinProb.toFixed(0)}%</div>
                  <div className="text-xs text-white/70 mt-1">Away Win</div>
                </div>
              </div>

              <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                <div className="h-full bg-accent rounded-l-full" style={{ width: `${match.prediction.homeWinProb}%` }} />
                <div className="h-full bg-warning" style={{ width: `${match.prediction.drawProb}%` }} />
                <div className="h-full bg-primary rounded-r-full" style={{ width: `${match.prediction.awayWinProb}%` }} />
              </div>

              {match.prediction.expectedHomeGoals !== null && (
                <div className="flex items-center justify-between py-2 border-t border-white/8">
                  <span className="text-white/75 text-sm">Expected Goals</span>
                  <span className="font-bold text-white">
                    {match.prediction.expectedHomeGoals.toFixed(1)} - {match.prediction.expectedAwayGoals?.toFixed(1)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-t border-white/8">
                <span className="text-white/75 text-sm">Confidence</span>
                <span className="font-bold text-primary">{match.prediction.confidence.toFixed(0)}%</span>
              </div>

              {match.prediction.aiExplanation && (
                <div className="p-4 rounded-xl bg-background/50 border border-white/8">
                  <p className="text-sm text-white/75 leading-relaxed">{match.prediction.aiExplanation}</p>
                </div>
              )}

              {match.prediction.expertAnalysis && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-xs font-bold text-primary mb-1">EXPERT ANALYSIS</p>
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
        <span className="text-white/70 text-xs">{label}</span>
        <span className="font-bold text-white">{fmt(away)}{unit}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        <div className="h-full bg-accent rounded-l-full transition-all" style={{ width: `${homeW}%` }} />
        <div className="h-full bg-primary rounded-r-full flex-1" />
      </div>
    </div>
  );
}
