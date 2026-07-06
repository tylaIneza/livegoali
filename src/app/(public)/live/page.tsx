export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/redis";
import Link from "next/link";
import Image from "next/image";
import { Play, Radio, Calendar, ChevronRight, Wifi, Star, Zap, Users } from "lucide-react";
import { LiveBadge } from "@/components/match/LiveBadge";
import { CountdownTimer } from "@/components/match/CountdownTimer";
import { HomeRefresher } from "@/components/HomeRefresher";
import { LocalTime } from "@/components/LocalTime";
import { isToday, isTomorrow } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Matches — Watch Now | LiveGoali",
  description: "Watch all live football and sports matches streaming now on LiveGoali.",
};

function isValidImageUrl(url: string | null): url is string {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
}

function TeamLogo({ logo, name, size }: { logo: string | null; name: string; size: number }) {
  if (isValidImageUrl(logo)) {
    return (
      <Image
        src={logo}
        alt={name}
        width={size}
        height={size}
        className="object-contain drop-shadow-md"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-white/8 flex items-center justify-center font-black text-[#00FF84]"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {name.charAt(0)}
    </div>
  );
}

interface MatchListItem {
  id: string; slug: string; title: string | null; status: string;
  scheduledAt: Date | string; startedAt: Date | string | null;
  homeScore: number | null; awayScore: number | null;
  matchMinute: number | null; round: string | null;
  participant1: string | null; participant2: string | null;
  isFeatured: boolean; streamUrl: string | null; homeTeamId: string | null;
  streams: { id: string }[];
  homeTeam: { id: string; name: string; slug: string; logo: string | null; shortName: string | null } | null;
  awayTeam: { id: string; name: string; slug: string; logo: string | null; shortName: string | null } | null;
  league: { id: string; name: string; slug: string; logo: string | null; country: string | null } | null;
  sport: { slug: string; name: string; icon: string | null } | null;
}

export default async function LivePage() {
  const now = new Date();

  const [liveMatches, upcomingToday] = (await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cacheGet<any>("home:live").then((c: any) => c ?? prisma.match.findMany({
      where: { status: { in: ["LIVE", "HALFTIME"] } },
      include: {
        homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
        sport: { select: { slug: true, name: true, icon: true } },
        streams: { where: { isActive: true }, select: { id: true }, take: 1 },
      },
      orderBy: [{ isFeatured: "desc" }, { scheduledAt: "asc" }],
    }).then((d) => { cacheSet("home:live", d, 15); return d; })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cacheGet<any>("live:upcoming-today").then((c: any) => c ?? prisma.match.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          gte: now,
          lte: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
        sport: { select: { slug: true, name: true, icon: true } },
        streams: { where: { isActive: true }, select: { id: true }, take: 1 },
      },
      orderBy: [{ isFeatured: "desc" }, { scheduledAt: "asc" }],
      take: 20,
    }).then((d) => { cacheSet("live:upcoming-today", d, 30); return d; })),
  ]).catch(() => [[], []])) as [MatchListItem[], MatchListItem[]];

  return (
    <>
      <HomeRefresher />
      {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden border-b border-white/6"
          style={{ background: "linear-gradient(135deg, #110808 0%, #0B0F14 40%, #06040f 100%)" }}>
          {/* Ambient glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/3 w-96 h-48 rounded-full opacity-20 blur-3xl"
              style={{ background: "radial-gradient(circle, #EF4444, transparent)" }} />
            <div className="absolute bottom-0 right-1/4 w-64 h-32 rounded-full opacity-10 blur-3xl"
              style={{ background: "radial-gradient(circle, #00FF84, transparent)" }} />
          </div>
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Pulsing radio icon */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center"
                  style={{ boxShadow: "0 0 40px rgba(239,68,68,0.25)" }}>
                  <Radio className="w-8 h-8 text-red-400" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 live-pulse" />
              </div>

              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-black text-red-400 bg-red-500/12 border border-red-500/25 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
                    LIVE NOW
                  </span>
                  {liveMatches.length > 0 && (
                    <span className="text-xs font-bold text-white/50 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                      {liveMatches.length} match{liveMatches.length !== 1 ? "es" : ""}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Watch Live Sports
                </h1>
                <p className="text-white/50 mt-1.5 text-sm sm:text-base">
                  Stream live football, UFC, boxing, F1 and more — free, no account needed
                </p>
              </div>

              <div className="sm:ml-auto flex flex-col items-center gap-2 shrink-0">
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold">Thousands watching</span>
                </div>
                <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-[#00FF84]/80 hover:text-[#00FF84] transition-colors">
                  <Calendar className="w-3.5 h-3.5" /> All Fixtures
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

          {/* ── LIVE MATCHES GRID ── */}
          <section>
            {liveMatches.length === 0 ? (
              <div className="rounded-2xl border border-white/6 bg-[#121821]/80 p-16 text-center">
                <div className="w-20 h-20 rounded-full bg-red-500/8 border border-red-500/12 flex items-center justify-center mx-auto mb-5">
                  <Radio className="w-9 h-9 text-red-500/40" />
                </div>
                <p className="text-white font-black text-xl mb-2">No matches live right now</p>
                <p className="text-white/50 text-sm mb-5">Check back soon or browse upcoming matches below</p>
                <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#00FF84] font-semibold hover:underline">
                  <Calendar className="w-4 h-4" /> Browse All Fixtures
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {liveMatches.map((match) => {
                  const sportSlug = match.sport?.slug ?? null;
                  const SOLO = ["formula1"];
                  const isFootball = sportSlug === "football" || (!sportSlug && !!match.homeTeamId);
                  const isSolo = SOLO.includes(sportSlug ?? "");
                  const hasTeams = !!match.homeTeam;
                  const hasTwoSidesCard = !isSolo && (hasTeams || (!!match.participant1 && !!match.participant2));
                  const hasScore = isFootball;
                  const homeScore = match.homeScore ?? 0;
                  const awayScore = match.awayScore ?? 0;
                  const homeWinning = hasScore && homeScore > awayScore;
                  const awayWinning = hasScore && awayScore > homeScore;
                  const watchLabel = sportSlug === "formula1" ? "Watch Race"
                    : (sportSlug === "ufc" || sportSlug === "boxing") ? "Watch Fight"
                    : "Watch Live";
                  const logoSize = match.isFeatured ? 38 : 32;
                  const boxSize = match.isFeatured ? 58 : 48;

                  return (
                    <div
                      key={match.id}
                      className={`relative rounded-2xl overflow-hidden border bg-[#0D1117] group transition-all duration-300 ${
                        match.isFeatured
                          ? "md:col-span-2 border-yellow-500/30 hover:border-yellow-500/50"
                          : "border-red-500/25 hover:border-red-500/40"
                      }`}
                      style={match.isFeatured
                        ? { boxShadow: "0 0 60px rgba(234,179,8,0.12)" }
                        : { boxShadow: "0 0 40px rgba(239,68,68,0.08)" }}
                    >
                      {/* Top accent */}
                      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent to-transparent ${match.isFeatured ? "via-yellow-400/80" : "via-red-500/80"}`} />

                      {/* Subtle bg glow */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                        <div className={`absolute -top-8 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl opacity-8 ${match.isFeatured ? "bg-yellow-500" : "bg-red-500"}`} />
                      </div>

                      <div className={`relative p-4 sm:p-5 ${match.isFeatured ? "lg:p-6" : ""}`}>
                        {/* Header row */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {match.isFeatured && (
                              <span className="flex items-center gap-1 text-[10px] font-black text-yellow-400 bg-yellow-500/12 border border-yellow-500/25 px-2 py-0.5 rounded-full shrink-0">
                                <Star className="w-2.5 h-2.5 fill-yellow-400" /> FEATURED
                              </span>
                            )}
                            {match.league?.logo ? (
                              <Image src={match.league.logo} alt={match.league.name} width={16} height={16} className="object-contain shrink-0" />
                            ) : match.sport?.icon ? (
                              <span className="text-sm leading-none shrink-0">{match.sport.icon}</span>
                            ) : null}
                            <span className="text-xs text-white/70 font-semibold truncate">
                              {match.league?.name ?? match.sport?.name ?? "Live Event"}
                            </span>
                            {match.round && <span className="text-xs text-white/35 shrink-0">· {match.round}</span>}
                          </div>
                          <LiveBadge startedAt={match.startedAt} minute={match.matchMinute} status={match.status} size="sm" />
                        </div>

                        {hasTeams ? (
                          <div className="flex items-center gap-3 sm:gap-4">
                            {/* Home */}
                            <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
                              <div
                                className={`rounded-xl p-2 border transition-all flex items-center justify-center ${homeWinning ? "border-[#00FF84]/30 bg-[#00FF84]/8" : "border-white/8 bg-white/4"}`}
                                style={{
                                  width: boxSize, height: boxSize,
                                  boxShadow: homeWinning ? "0 0 20px rgba(0,255,132,0.15)" : undefined,
                                }}
                              >
                                <TeamLogo logo={match.homeTeam?.logo ?? null} name={match.homeTeam?.name ?? match.participant1 ?? ""} size={logoSize} />
                              </div>
                              <span className={`text-xs sm:text-sm font-bold text-center leading-tight truncate w-full ${homeWinning ? "text-[#00FF84]" : "text-white"}`}>
                                {match.homeTeam?.shortName ?? match.homeTeam?.name ?? match.participant1 ?? "TBA"}
                              </span>
                            </div>

                            {/* Score */}
                            <div className="flex flex-col items-center shrink-0 gap-1">
                              {hasScore ? (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`font-black tabular-nums leading-none ${homeWinning ? "text-[#00FF84]" : "text-white"} ${match.isFeatured ? "text-3xl" : "text-2xl"}`}>{homeScore}</span>
                                    <span className={`text-white/25 font-black ${match.isFeatured ? "text-lg" : "text-base"}`}>—</span>
                                    <span className={`font-black tabular-nums leading-none ${awayWinning ? "text-blue-400" : "text-white"} ${match.isFeatured ? "text-3xl" : "text-2xl"}`}>{awayScore}</span>
                                  </div>
                                  {match.status === "HALFTIME" && (
                                    <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">HT</span>
                                  )}
                                </>
                              ) : (
                                <span className="text-xl font-black text-white/40">VS</span>
                              )}
                              {(match.streams.length > 0 || !!match.streamUrl) && (
                                <span className="flex items-center gap-1 text-[10px] text-[#00FF84]/70 mt-0.5">
                                  <Wifi className="w-2.5 h-2.5" /> Streaming
                                </span>
                              )}
                            </div>

                            {/* Away */}
                            <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
                              <div
                                className={`rounded-xl p-2 border transition-all flex items-center justify-center ${awayWinning ? "border-blue-500/30 bg-blue-500/8" : "border-white/8 bg-white/4"}`}
                                style={{
                                  width: boxSize, height: boxSize,
                                  boxShadow: awayWinning ? "0 0 20px rgba(59,130,246,0.15)" : undefined,
                                }}
                              >
                                <TeamLogo logo={match.awayTeam?.logo ?? null} name={match.awayTeam?.name ?? match.participant2 ?? ""} size={logoSize} />
                              </div>
                              <span className={`text-xs sm:text-sm font-bold text-center leading-tight truncate w-full ${awayWinning ? "text-blue-400" : "text-white"}`}>
                                {match.awayTeam?.shortName ?? match.awayTeam?.name ?? match.participant2 ?? "TBA"}
                              </span>
                            </div>
                          </div>
                        ) : hasTwoSidesCard ? (
                          <div className="flex items-center gap-4 py-1">
                            <div className="flex-1 flex flex-col items-center gap-2.5 min-w-0">
                              <div className="w-14 h-14 rounded-full bg-[#00FF84]/10 border-2 border-[#00FF84]/25 flex items-center justify-center"
                                style={{ boxShadow: "0 0 16px rgba(0,255,132,0.12)" }}>
                                <span className="text-xl font-black text-[#00FF84]">{(match.participant1 ?? "?").charAt(0).toUpperCase()}</span>
                              </div>
                              <span className="text-sm font-bold text-white text-center leading-tight line-clamp-2">{match.participant1 ?? "TBA"}</span>
                            </div>
                            <div className="flex flex-col items-center shrink-0 gap-1">
                              {match.sport?.icon && <span className="text-2xl leading-none">{match.sport.icon}</span>}
                              <span className="text-base font-black text-white/40">VS</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center gap-2.5 min-w-0">
                              <div className="w-14 h-14 rounded-full bg-blue-500/10 border-2 border-blue-500/25 flex items-center justify-center"
                                style={{ boxShadow: "0 0 16px rgba(59,130,246,0.12)" }}>
                                <span className="text-xl font-black text-blue-400">{(match.participant2 ?? "?").charAt(0).toUpperCase()}</span>
                              </div>
                              <span className="text-sm font-bold text-white text-center leading-tight line-clamp-2">{match.participant2 ?? "TBA"}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2.5 py-3 text-center">
                            {match.sport?.icon && <span className="text-5xl leading-none">{match.sport.icon}</span>}
                            <span className="text-lg font-black text-white leading-tight">
                              {match.title ?? match.participant1 ?? "Live Event"}
                            </span>
                          </div>
                        )}

                        <Link
                          href={`/live/${match.id}`}
                          className={`mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-black text-sm transition-all active:scale-[0.98] ${
                            match.isFeatured
                              ? "bg-yellow-400 text-black hover:bg-yellow-300"
                              : "bg-[#00FF84] text-black hover:bg-[#00FF84]/85"
                          }`}
                          style={match.isFeatured
                            ? { boxShadow: "0 0 20px rgba(234,179,8,0.35)" }
                            : { boxShadow: "0 0 16px rgba(0,255,132,0.25)" }}
                        >
                          <Play className="w-4 h-4 fill-black" />
                          {watchLabel}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── UP NEXT TODAY ── */}
          {upcomingToday.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Up Next Today</h2>
                    <p className="text-sm text-white/50">{upcomingToday.length} match{upcomingToday.length !== 1 ? "es" : ""} in the next 24 hours</p>
                  </div>
                </div>
                <Link href="/" className="flex items-center gap-1 text-xs text-white/50 hover:text-[#00FF84] transition-colors font-semibold">
                  Full Schedule <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="rounded-2xl border border-white/7 bg-[#0D1117]/80 overflow-hidden divide-y divide-white/4">
                {upcomingToday.map((match) => {
                  const mSportSlug = match.sport?.slug ?? null;
                  const mIsFootball = mSportSlug === "football" || !!match.homeTeamId;
                  const mIsSolo = ["formula1"].includes(mSportSlug ?? "");
                  const mHasTwoSides = !mIsSolo && (mIsFootball || (!!match.participant1 && !!match.participant2));
                  const isoScheduled = String(match.scheduledAt);
                  const kickoffDay = isToday(new Date(match.scheduledAt)) ? "Today"
                    : isTomorrow(new Date(match.scheduledAt)) ? "Tomorrow"
                    : null;

                  return (
                    <Link key={match.id} href={`/match/${match.slug}`} className="block group/match">
                      <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors">
                        {/* Time */}
                        <div className="w-14 shrink-0 text-center">
                          <LocalTime iso={isoScheduled} format="time" className="text-sm font-black text-white/80 group-hover/match:text-white transition-colors tabular-nums" />
                          {kickoffDay && <div className="text-[9px] text-white/35 font-semibold mt-0.5">{kickoffDay}</div>}
                          {!kickoffDay && <LocalTime iso={isoScheduled} format="date" className="text-[9px] text-white/35 font-semibold mt-0.5" />}
                        </div>

                        {/* League icon */}
                        <div className="shrink-0 w-5 flex items-center justify-center">
                          {match.league?.logo ? (
                            <Image src={match.league.logo} alt={match.league.name} width={18} height={18} className="object-contain" />
                          ) : match.sport?.icon ? (
                            <span className="text-base leading-none">{match.sport.icon}</span>
                          ) : (
                            <div className="w-4 h-4 rounded-sm bg-white/8" />
                          )}
                        </div>

                        {mHasTwoSides ? (
                          <>
                            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                              {match.isFeatured && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />}
                              <span className="text-sm font-semibold text-gray-200 truncate text-right group-hover/match:text-white transition-colors">
                                {match.homeTeam?.shortName ?? match.homeTeam?.name ?? match.participant1 ?? "TBA"}
                              </span>
                              {!!match.homeTeam && (
                                <TeamLogo logo={match.homeTeam?.logo ?? null} name={match.homeTeam?.name ?? ""} size={24} />
                              )}
                            </div>
                            <div className="shrink-0 w-8 text-center">
                              <span className="text-[10px] font-black text-white/25">VS</span>
                            </div>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {!!match.awayTeam && (
                                <TeamLogo logo={match.awayTeam?.logo ?? null} name={match.awayTeam?.name ?? ""} size={24} />
                              )}
                              <span className="text-sm font-semibold text-gray-200 truncate group-hover/match:text-white transition-colors">
                                {match.awayTeam?.shortName ?? match.awayTeam?.name ?? match.participant2 ?? "TBA"}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-sm font-semibold text-gray-200 truncate group-hover/match:text-white transition-colors">
                              {match.title ?? match.participant1 ?? "Event"}
                            </span>
                          </div>
                        )}

                        {/* Countdown */}
                        <div className="shrink-0">
                          <CountdownTimer
                            scheduledAt={match.scheduledAt}
                            className="text-[10px] font-bold text-blue-400/80 bg-blue-500/8 border border-blue-500/15 px-2 py-0.5 rounded-full whitespace-nowrap tabular-nums"
                          />
                        </div>

                        <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover/match:text-white/50 shrink-0 transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Nothing at all */}
          {liveMatches.length === 0 && upcomingToday.length === 0 && (
            <div className="text-center py-8">
              <p className="text-white/40 text-sm mb-4">Nothing live or scheduled for today</p>
              <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00FF84] text-black font-bold text-sm hover:bg-[#00FF84]/85 transition-all">
                <Calendar className="w-4 h-4" /> Browse All Fixtures
              </Link>
            </div>
          )}

        </div>
    </>
  );
}
