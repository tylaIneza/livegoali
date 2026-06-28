export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Play, Radio, Clock, Calendar, ChevronRight, Wifi } from "lucide-react";
import { LiveBadge } from "@/components/match/LiveBadge";
import { CountdownTimer } from "@/components/match/CountdownTimer";
import { AdBanner } from "@/components/AdBanner";
import { HomeRefresher } from "@/components/HomeRefresher";
import { format, isToday, isTomorrow } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LiveGoali — Watch Football Live. Anytime. Anywhere.",
  description: "Watch live football matches streaming now on LiveGoali.",
};

function countdown(scheduledAt: Date): string {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return "Soon";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h >= 24) return `in ${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

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

export default async function HomePage() {
  const now = new Date();

  const [liveMatches, upcomingMatches, recentFinished] = await Promise.all([
    prisma.match.findMany({
      where: { status: { in: ["LIVE", "HALFTIME"] } },
      include: {
        homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
        sport: { select: { slug: true, name: true, icon: true } },
        streams: { where: { isActive: true }, select: { id: true }, take: 1 },
      },
      orderBy: [{ isFeatured: "desc" }, { scheduledAt: "asc" }],
    }),
    prisma.match.findMany({
      where: { status: "SCHEDULED", scheduledAt: { gte: now } },
      include: {
        homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
        sport: { select: { slug: true, name: true, icon: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 40,
    }),
    prisma.match.findMany({
      where: { status: "FINISHED" },
      include: {
        homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
        sport: { select: { slug: true, name: true, icon: true } },
      },
      orderBy: { scheduledAt: "desc" },
      take: 8,
    }),
  ]).catch(() => [[], [], []] as [never[], never[], never[]]);

  type UpcomingMatch = (typeof upcomingMatches)[number];

  // Group upcoming by day then by league
  const dayGroups: Record<string, UpcomingMatch[]> = {};
  for (const m of upcomingMatches) {
    const d = new Date(m.scheduledAt);
    const key = isToday(d) ? "Today" : isTomorrow(d) ? "Tomorrow" : format(d, "EEE, d MMM");
    if (!dayGroups[key]) dayGroups[key] = [];
    dayGroups[key].push(m);
  }

  function byLeague(matches: UpcomingMatch[]) {
    const g: Record<string, UpcomingMatch[]> = {};
    for (const m of matches) {
      const lid = m.league?.id ?? "other";
      if (!g[lid]) g[lid] = [];
      g[lid].push(m);
    }
    return Object.values(g);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <HomeRefresher />
      <Navbar />
      <div className="max-w-[1400px] mx-auto w-full px-4 pt-2">
        <AdBanner placement="HEADER" className="h-16 sm:h-20" />
      </div>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

          {/* ── LIVE NOW ── */}
          <section>
            {/* Section header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-red-500/15 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-red-400" />
                  </div>
                  {liveMatches.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 live-pulse" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Live Now</h2>
                  <p className="text-sm text-white/60">
                    {liveMatches.length > 0
                      ? `${liveMatches.length} match${liveMatches.length !== 1 ? "es" : ""} in progress`
                      : "No matches live right now"}
                  </p>
                </div>
              </div>
              {liveMatches.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
                  {liveMatches.length} LIVE
                </span>
              )}
            </div>

            {liveMatches.length === 0 ? (
              <div className="rounded-2xl border border-white/6 bg-[#121821]/80 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/8 flex items-center justify-center mx-auto mb-4">
                  <Radio className="w-7 h-7 text-red-500/40" />
                </div>
                <p className="text-white font-bold text-base mb-1">No live matches right now</p>
                <p className="text-white/50 text-sm">Check upcoming matches below or view the full schedule</p>
                <Link href="/fixtures" className="inline-flex items-center gap-1.5 mt-4 text-xs text-[#00FF84] font-semibold hover:underline">
                  <Calendar className="w-3.5 h-3.5" /> View Full Schedule
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveMatches.map((match) => {
                  const sportSlug = match.sport?.slug ?? null;
                  const SOLO = ["formula1"];
                  const isFootball = sportSlug === "football" || (!sportSlug && !!match.homeTeamId);
                  const isSolo = SOLO.includes(sportSlug ?? "");
                  const hasTeams = !!match.homeTeam;
                  const hasTwoSidesCard = hasTeams || (!isSolo && !!match.participant1 && !!match.participant2);
                  const watchLabel = sportSlug === "formula1" ? "Watch Race"
                    : (sportSlug === "ufc" || sportSlug === "boxing") ? "Watch Fight"
                    : "Watch Live";
                  return (
                    <div
                      key={match.id}
                      className="relative rounded-2xl overflow-hidden border border-red-500/20 bg-[#0D1117] shadow-[0_0_40px_rgba(239,68,68,0.07)] group hover:border-red-500/35 hover:shadow-[0_0_50px_rgba(239,68,68,0.12)] transition-all duration-300"
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />
                      <div className="p-5">
                        {/* League / sport row */}
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-2 min-w-0">
                            {match.league?.logo ? (
                              <Image src={match.league.logo} alt={match.league.name} width={16} height={16} className="object-contain shrink-0" />
                            ) : match.sport?.icon ? (
                              <span className="text-sm leading-none shrink-0">{match.sport.icon}</span>
                            ) : null}
                            <span className="text-xs text-white/70 font-medium truncate">
                              {match.league?.name ?? match.sport?.name ?? "Live Event"}
                            </span>
                            {match.round && <span className="text-xs text-white/40 shrink-0">· {match.round}</span>}
                          </div>
                          <LiveBadge startedAt={match.startedAt} minute={match.matchMinute} status={match.status} size="sm" />
                        </div>

                        {hasTeams ? (
                          /* ── Team-based: logos + score (football only) ── */
                          <div className="flex items-center gap-3">
                            <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                              <TeamLogo logo={match.homeTeam?.logo ?? null} name={match.homeTeam?.name ?? match.participant1 ?? ""} size={56} />
                              <span className="text-sm font-bold text-white text-center leading-tight line-clamp-2 w-full">
                                {match.homeTeam?.shortName ?? match.homeTeam?.name ?? match.participant1 ?? "TBA"}
                              </span>
                            </div>
                            <div className="flex flex-col items-center shrink-0 gap-1.5">
                              {isFootball ? (
                                <div className="text-3xl font-black text-white tabular-nums leading-none">
                                  {match.homeScore ?? 0}
                                  <span className="text-white/30 mx-1.5">–</span>
                                  {match.awayScore ?? 0}
                                </div>
                              ) : (
                                <div className="text-2xl font-black text-white/50">VS</div>
                              )}
                              {(match.streams.length > 0 || !!match.streamUrl) && (
                                <span className="flex items-center gap-1 text-[10px] text-[#00FF84]/80">
                                  <Wifi className="w-2.5 h-2.5" /> Stream available
                                </span>
                              )}
                            </div>
                            <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                              <TeamLogo logo={match.awayTeam?.logo ?? null} name={match.awayTeam?.name ?? match.participant2 ?? ""} size={56} />
                              <span className="text-sm font-bold text-white text-center leading-tight line-clamp-2 w-full">
                                {match.awayTeam?.shortName ?? match.awayTeam?.name ?? match.participant2 ?? "TBA"}
                              </span>
                            </div>
                          </div>
                        ) : hasTwoSidesCard ? (
                          /* ── Head-to-head: UFC, Boxing, etc. — participants + VS ── */
                          <div className="flex items-center gap-3 py-1">
                            <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                              <div className="w-14 h-14 rounded-full bg-[#00FF84]/10 border-2 border-[#00FF84]/25 flex items-center justify-center shrink-0">
                                <span className="text-xl font-black text-[#00FF84]">{(match.participant1 ?? "?").charAt(0).toUpperCase()}</span>
                              </div>
                              <span className="text-sm font-bold text-white text-center leading-tight line-clamp-2 w-full">
                                {match.participant1 ?? "TBA"}
                              </span>
                            </div>
                            <div className="flex flex-col items-center shrink-0 gap-1">
                              {match.sport?.icon && <span className="text-xl leading-none">{match.sport.icon}</span>}
                              <span className="text-base font-black text-white/50">VS</span>
                              {(match.streams.length > 0 || !!match.streamUrl) && (
                                <span className="flex items-center gap-1 text-[10px] text-[#00FF84]/80 mt-0.5">
                                  <Wifi className="w-2.5 h-2.5" /> Stream
                                </span>
                              )}
                            </div>
                            <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                              <div className="w-14 h-14 rounded-full bg-blue-500/10 border-2 border-blue-500/25 flex items-center justify-center shrink-0">
                                <span className="text-xl font-black text-blue-400">{(match.participant2 ?? "?").charAt(0).toUpperCase()}</span>
                              </div>
                              <span className="text-sm font-bold text-white text-center leading-tight line-clamp-2 w-full">
                                {match.participant2 ?? "TBA"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* ── Solo event: F1 race, etc. ── */
                          <div className="flex flex-col items-center gap-2 py-3 text-center">
                            {match.sport?.icon && <span className="text-4xl leading-none">{match.sport.icon}</span>}
                            <span className="text-base font-black text-white leading-tight">
                              {match.title ?? match.participant1 ?? "Live Event"}
                            </span>
                            {(match.streams.length > 0 || !!match.streamUrl) && (
                              <span className="flex items-center gap-1 text-[10px] text-[#00FF84]/80 mt-1">
                                <Wifi className="w-2.5 h-2.5" /> Stream available
                              </span>
                            )}
                          </div>
                        )}

                        <Link
                          href={`/live/${match.id}`}
                          className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#00FF84] text-black font-bold text-sm hover:bg-[#00FF84]/85 active:scale-[0.98] transition-all"
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

          {/* ── UPCOMING MATCHES ── */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Upcoming Matches</h2>
                  <p className="text-sm text-white/60">
                    {upcomingMatches.length > 0
                      ? `${upcomingMatches.length} match${upcomingMatches.length !== 1 ? "es" : ""} scheduled`
                      : "No upcoming matches scheduled"}
                  </p>
                </div>
              </div>
              <Link
                href="/fixtures"
                className="flex items-center gap-1 text-xs text-white/60 hover:text-[#00FF84] transition-colors font-semibold"
              >
                Full Schedule <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingMatches.length === 0 ? (
              <div className="rounded-2xl border border-white/6 bg-[#121821]/80 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/8 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-blue-500/40" />
                </div>
                <p className="text-white font-bold text-base mb-1">No upcoming matches scheduled</p>
                <Link href="/fixtures" className="inline-flex items-center gap-1.5 mt-4 text-xs text-[#00FF84] font-semibold hover:underline">
                  <Calendar className="w-3.5 h-3.5" /> View Full Schedule
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(dayGroups).map(([day, dayMatches]) => (
                  <div key={day}>
                    {/* Day header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 rounded-full bg-[#00FF84]" />
                        <span className="text-base font-black text-white">{day}</span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                      <span className="text-xs text-white/50 font-medium">
                        {dayMatches.length} match{dayMatches.length !== 1 ? "es" : ""}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {byLeague(dayMatches).map((leagueMatches) => {
                        const league = leagueMatches[0].league ?? null;
                        return (
                          <div key={league?.id ?? "other"} className="rounded-2xl border border-white/7 bg-[#0D1117]/80 overflow-hidden">
                            {/* League / event header */}
                            {league?.slug ? (
                              <Link href={`/league/${league.slug}`} className="block group/league">
                                <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-white/5 bg-[#121821]/60 hover:bg-[#1a2235]/60 transition-colors">
                                  {league.logo ? (
                                    <Image src={league.logo} alt={league.name} width={18} height={18} className="object-contain shrink-0" />
                                  ) : (
                                    <div className="w-4.5 h-4.5 rounded-sm bg-white/10 shrink-0" />
                                  )}
                                  <span className="text-xs font-bold text-white group-hover/league:text-[#00FF84] transition-colors">{league.name}</span>
                                  <span className="text-[10px] text-white/40">· {league.country}</span>
                                  <ChevronRight className="w-3 h-3 text-white/20 group-hover/league:text-[#00FF84]/60 transition-colors ml-auto" />
                                </div>
                              </Link>
                            ) : (
                              <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-white/5 bg-[#121821]/60">
                                <div className="w-4.5 h-4.5 rounded-sm bg-white/10 shrink-0" />
                                <span className="text-xs font-bold text-white">Other Events</span>
                              </div>
                            )}

                            {/* Match rows */}
                            <div className="divide-y divide-white/4">
                              {leagueMatches.map((match) => {
                                const mSportSlug = match.sport?.slug ?? null;
                                const SOLO_U = ["formula1"];
                                const mIsFootball = mSportSlug === "football" || !!match.homeTeamId;
                                const mIsSolo = SOLO_U.includes(mSportSlug ?? "");
                                const mHasTwoSides = mIsFootball ||
                                  (!mIsSolo && !!match.participant1 && !!match.participant2);
                                return (
                                  <Link key={match.id} href={`/match/${match.slug}`} className="block group/match">
                                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                                      {/* Time */}
                                      <div className="w-11 shrink-0 text-center">
                                        <span className="text-sm font-black text-white/70 group-hover/match:text-white transition-colors tabular-nums">
                                          {format(new Date(match.scheduledAt), "HH:mm")}
                                        </span>
                                      </div>

                                      {mHasTwoSides ? (
                                        /* Two-sided match: two-column with VS, logos for any sport with teams */
                                        <>
                                          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                            <span className="text-sm font-semibold text-gray-200 truncate text-right group-hover/match:text-white transition-colors">
                                              {match.homeTeam?.shortName ?? match.homeTeam?.name ?? match.participant1 ?? "TBA"}
                                            </span>
                                            {!!match.homeTeam && <TeamLogo logo={match.homeTeam?.logo ?? null} name={match.homeTeam?.name ?? ""} size={26} />}
                                          </div>
                                          <div className="shrink-0 w-8 text-center">
                                            <span className="text-[10px] font-black text-white/30">VS</span>
                                          </div>
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {!!match.awayTeam && <TeamLogo logo={match.awayTeam?.logo ?? null} name={match.awayTeam?.name ?? ""} size={26} />}
                                            <span className="text-sm font-semibold text-gray-200 truncate group-hover/match:text-white transition-colors">
                                              {match.awayTeam?.shortName ?? match.awayTeam?.name ?? match.participant2 ?? "TBA"}
                                            </span>
                                          </div>
                                        </>
                                      ) : (
                                        /* Solo event: F1 — show sport icon + title */
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          {match.sport?.icon && <span className="text-base leading-none shrink-0">{match.sport.icon}</span>}
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
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── RECENT RESULTS ── */}
          {recentFinished.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white/50" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Recent Results</h2>
                  <p className="text-sm text-white/60">Latest finished matches</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/7 bg-[#0D1117]/80 overflow-hidden divide-y divide-white/4">
                {recentFinished.map((match) => {
                  const rSportSlug = match.sport?.slug ?? null;
                  const rIsFootball = rSportSlug === "football" || (!rSportSlug && !!match.homeTeamId);
                  return (
                    <Link key={match.id} href={`/match/${match.slug}`} className="block group">
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                        {/* League / sport */}
                        <div className="flex items-center gap-1.5 w-24 shrink-0 min-w-0">
                          {match.league?.logo ? (
                            <Image src={match.league.logo} alt={match.league.name} width={14} height={14} className="object-contain shrink-0" />
                          ) : match.sport?.icon ? (
                            <span className="text-xs leading-none shrink-0">{match.sport.icon}</span>
                          ) : null}
                          <span className="text-[11px] text-white/50 truncate">
                            {match.league?.name ?? match.sport?.name}
                          </span>
                        </div>

                        {!!match.homeTeam ? (
                          /* Team-based: show teams, score only for football */
                          <>
                            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                              <span className="text-sm font-semibold text-gray-300 truncate text-right group-hover:text-white transition-colors">
                                {match.homeTeam?.shortName ?? match.homeTeam?.name ?? match.participant1 ?? "TBA"}
                              </span>
                              <TeamLogo logo={match.homeTeam?.logo ?? null} name={match.homeTeam?.name ?? match.participant1 ?? ""} size={22} />
                            </div>
                            <div className="shrink-0 px-3 text-center">
                              {rIsFootball ? (
                                <>
                                  <span className="text-base font-black text-white tabular-nums">
                                    {match.homeScore ?? 0} – {match.awayScore ?? 0}
                                  </span>
                                  <div className="text-[9px] text-white/40 font-bold text-center mt-0.5">FT</div>
                                </>
                              ) : (
                                <span className="text-sm font-black text-white/40">vs</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <TeamLogo logo={match.awayTeam?.logo ?? null} name={match.awayTeam?.name ?? match.participant2 ?? ""} size={22} />
                              <span className="text-sm font-semibold text-gray-300 truncate group-hover:text-white transition-colors">
                                {match.awayTeam?.shortName ?? match.awayTeam?.name ?? match.participant2 ?? "TBA"}
                              </span>
                            </div>
                          </>
                        ) : (
                          /* No-score event: show event title */
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-sm font-semibold text-gray-300 truncate group-hover:text-white transition-colors">
                              {match.title ?? match.participant1 ?? "Event"}
                            </span>
                            <span className="text-[10px] text-white/40 font-bold shrink-0">FT</span>
                          </div>
                        )}

                        <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 shrink-0 transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

        </div>
      </main>

      <div className="max-w-[1400px] mx-auto w-full px-4 pb-2">
        <AdBanner placement="FOOTER" className="h-16 sm:h-20" />
      </div>
      <Footer />
    </div>
  );
}
