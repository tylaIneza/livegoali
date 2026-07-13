export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ChevronLeft, ChevronRight, Wifi } from "lucide-react";
import { LiveBadge } from "@/components/match/LiveBadge";
import { CountdownTimer } from "@/components/match/CountdownTimer";
import { LocalTime } from "@/components/LocalTime";
import { addDays, subDays, isToday, isTomorrow, isYesterday, format } from "date-fns";
import { statusFilterToWhere, parseDateParam } from "@/lib/matchFilters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fixtures & Schedule",
  description: "Upcoming football fixtures and match schedule on LiveGoali.",
};

function dayLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, d MMM");
}

function countdown(scheduledAt: Date): string {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return "Soon";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function isValidImageUrl(url: string | null): url is string {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
}

function TeamLogo({ logo, name, size }: { logo: string | null; name: string; size: number }) {
  if (isValidImageUrl(logo)) {
    return <Image src={logo} alt={name} width={size} height={size} className="object-contain" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="rounded-full bg-white/8 flex items-center justify-center font-black text-primary"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0)}
    </div>
  );
}

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; status?: string; sport?: string }>;
}) {
  const params = await searchParams;
  const activeDate = parseDateParam(params.date);

  const dayStart = new Date(activeDate);
  const dayEnd = new Date(activeDate);
  dayEnd.setHours(23, 59, 59, 999);

  const prevDate = subDays(activeDate, 1);
  const nextDate = addDays(activeDate, 1);

  const sports = await prisma.sport.findMany({
    where: { enabled: true },
    orderBy: { displayOrder: "asc" },
  }).catch(() => []);
  const activeSport = sports.find((s) => s.slug === params.sport);
  const statusWhere = statusFilterToWhere(params.status);
  const activeStatus = ["live", "upcoming", "finished"].includes(params.status ?? "") ? params.status : undefined;

  const matches = await prisma.match.findMany({
    where: {
      scheduledAt: { gte: dayStart, lte: dayEnd },
      ...(statusWhere ? { status: statusWhere } : {}),
      ...(activeSport ? { sport: { slug: activeSport.slug } } : {}),
    },
    include: {
      homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
      awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
      league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
      sport: { select: { slug: true, name: true, icon: true } },
      streams: { where: { isActive: true }, select: { id: true }, take: 1 },
    },
    orderBy: { scheduledAt: "asc" },
  }).catch(() => []);

  type MatchItem = (typeof matches)[number];

  function buildHref(overrides: Partial<{ date: string; status: string; sport: string }>) {
    const merged = {
      date: format(activeDate, "yyyy-MM-dd"),
      status: activeStatus,
      sport: activeSport?.slug,
      ...overrides,
    };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const qs = sp.toString();
    return `/fixtures${qs ? `?${qs}` : ""}`;
  }

  const byLeague = matches.reduce<Record<string, MatchItem[]>>((acc, m) => {
    const key = m.league?.id ?? "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const liveCount = matches.filter((m) => m.status === "LIVE" || m.status === "HALFTIME").length;

  // 7-day pill strip centered on today
  const dayStrip = Array.from({ length: 7 }, (_, i) => addDays(new Date(new Date().setHours(0, 0, 0, 0)), i - 2));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Fixtures</h1>
            <p className="text-sm text-white/60">{dayLabel(activeDate)}</p>
          </div>
          {liveCount > 0 && (
            <span className="ml-2 flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
              {liveCount} LIVE
            </span>
          )}
        </div>
        {matches.length > 0 && (
          <p className="text-xs text-white/40 ml-13 pl-1">
            {matches.length} match{matches.length !== 1 ? "es" : ""} scheduled
          </p>
        )}
      </div>

      {/* Day strip */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        <Link
          href={buildHref({ date: format(prevDate, "yyyy-MM-dd") })}
          className="p-2.5 rounded-xl border border-white/8 bg-card text-white/50 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>

        {dayStrip.map((d) => {
          const ds = new Date(d);
          const ds_str = format(ds, "yyyy-MM-dd");
          const active_str = format(activeDate, "yyyy-MM-dd");
          const isActive = ds_str === active_str;
          const _isToday = isToday(ds);
          return (
            <Link
              key={ds_str}
              href={buildHref({ date: ds_str })}
              className={`relative flex flex-col items-center px-3.5 py-2.5 rounded-xl border text-center shrink-0 transition-all min-w-[64px] ${
                isActive
                  ? "border-primary/40 bg-primary/10 shadow-[0_0_20px_rgba(37,99,235,0.12)]"
                  : "border-white/7 bg-card text-white/60 hover:border-white/15 hover:text-white hover:bg-white/5"
              }`}
            >
              {_isToday && !isActive && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary/60" />
              )}
              <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? "text-primary/80" : ""}`}>
                {format(ds, "EEE")}
              </span>
              <span className={`text-xl font-black leading-tight ${isActive ? "text-primary" : ""}`}>
                {format(ds, "d")}
              </span>
              <span className={`text-[10px] ${isActive ? "text-primary/70" : "text-white/40"}`}>
                {format(ds, "MMM")}
              </span>
            </Link>
          );
        })}

        <Link
          href={buildHref({ date: format(nextDate, "yyyy-MM-dd") })}
          className="p-2.5 rounded-xl border border-white/8 bg-card text-white/50 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {([
          { key: undefined, label: "All" },
          { key: "live", label: "Live" },
          { key: "upcoming", label: "Upcoming" },
          { key: "finished", label: "Finished" },
        ] as const).map((s) => {
          const isActive = activeStatus === s.key;
          const isLiveChip = s.key === "live";
          return (
            <Link
              key={s.label}
              href={buildHref({ status: s.key })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 ${
                isActive
                  ? isLiveChip
                    ? "border-danger/40 bg-danger/10 text-danger"
                    : "border-primary/40 bg-primary/10 text-primary"
                  : "border-white/7 bg-card text-white/60 hover:border-white/15 hover:text-white hover:bg-white/5"
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      {/* Sport filter chips */}
      {sports.length > 0 && (
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 scrollbar-hide">
          <Link
            href={buildHref({ sport: undefined })}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 ${
              !activeSport
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-white/7 bg-card text-white/60 hover:border-white/15 hover:text-white hover:bg-white/5"
            }`}
          >
            All Sports
          </Link>
          {sports.map((sport) => {
            const isActive = activeSport?.slug === sport.slug;
            return (
              <Link
                key={sport.slug}
                href={buildHref({ sport: sport.slug })}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 ${
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-white/7 bg-card text-white/60 hover:border-white/15 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="leading-none">{sport.icon}</span> {sport.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* Matches */}
      {matches.length === 0 ? (
        <div className="rounded-2xl border border-white/7 bg-card p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/8 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-primary/30" />
          </div>
          <p className="text-white font-bold mb-1">No matches on {dayLabel(activeDate)}</p>
          <p className="text-white/50 text-sm">Try a different date</p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <Link
              href={buildHref({ date: format(prevDate, "yyyy-MM-dd") })}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white border border-white/10 bg-card px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> {format(prevDate, "d MMM")}
            </Link>
            <Link
              href={buildHref({ date: format(nextDate, "yyyy-MM-dd") })}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white border border-white/10 bg-card px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              {format(nextDate, "d MMM")} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.values(byLeague).map((leagueMatches) => {
            const league = leagueMatches[0].league ?? null;
            return (
              <div key={league?.id ?? "other"} className="rounded-2xl border border-white/7 bg-card overflow-hidden">
                {/* League / sport header */}
                {league?.slug ? (
                  <Link href={`/league/${league.slug}`} className="block group/league">
                    <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5 bg-card/50 hover:bg-white/5 transition-colors">
                      {league.logo ? (
                        <Image src={league.logo} alt={league.name} width={18} height={18} className="object-contain shrink-0" />
                      ) : (
                        <div className="w-4.5 h-4.5 rounded-sm bg-white/10 shrink-0" />
                      )}
                      <span className="text-sm font-bold text-white group-hover/league:text-primary transition-colors">
                        {league.name}
                      </span>
                      <span className="text-xs text-white/40">· {league.country}</span>
                      <span className="ml-auto text-[10px] text-white/30 font-medium">
                        {leagueMatches.length} match{leagueMatches.length !== 1 ? "es" : ""}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover/league:text-primary/60 transition-colors" />
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5 bg-card/50">
                    <div className="w-4.5 h-4.5 rounded-sm bg-white/10 shrink-0" />
                    <span className="text-sm font-bold text-white">Other Events</span>
                    <span className="ml-auto text-[10px] text-white/30 font-medium">
                      {leagueMatches.length} event{leagueMatches.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                {/* Match rows */}
                <div className="divide-y divide-white/4">
                  {leagueMatches.map((match) => {
                    const isLive = match.status === "LIVE" || match.status === "HALFTIME";
                    const isFinished = match.status === "FINISHED";
                    const href = isLive ? `/live/${match.id}` : `/match/${match.slug}`;
                    const fSportSlug = match.sport?.slug ?? null;
                    const SOLO_F = ["formula1"];
                    const fIsFootball = fSportSlug === "football" || !!match.homeTeamId;
                    const fHasScore = fSportSlug === "football" || (!fSportSlug && !!match.homeTeamId);
                    const fIsSolo = SOLO_F.includes(fSportSlug ?? "");
                    const fHasTwoSides = !fIsSolo && (fIsFootball || (!!match.participant1 && !!match.participant2));

                    return (
                      <Link key={match.id} href={href} className="block group/match">
                        <div className={`flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors ${isLive ? "bg-red-500/3" : ""}`}>
                          {/* Time / Status */}
                          <div className="w-14 shrink-0 text-center">
                            {isLive ? (
                              <LiveBadge startedAt={match.startedAt} minute={match.matchMinute} status={match.status} size="sm" />
                            ) : isFinished ? (
                              <span className="text-xs text-white/50 font-bold">FT</span>
                            ) : (
                              <LocalTime iso={String(match.scheduledAt)} format="time" className="text-sm font-black text-white/70 group-hover/match:text-white transition-colors tabular-nums" />
                            )}
                          </div>

                          {fIsFootball ? (
                            /* ── Football: team logos + score ── */
                            <>
                              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                <span className={`text-sm font-semibold truncate text-right ${isLive ? "text-white" : "text-gray-200 group-hover/match:text-white"} transition-colors`}>
                                  {match.homeTeam?.shortName ?? match.homeTeam?.name ?? match.participant1 ?? "TBA"}
                                </span>
                                <TeamLogo logo={match.homeTeam?.logo ?? null} name={match.homeTeam?.name ?? match.participant1 ?? ""} size={26} />
                              </div>
                              <div className={`text-sm font-black tabular-nums w-16 text-center shrink-0 ${
                                isLive || isFinished ? "text-white" : "text-white/30"
                              }`}>
                                {(isFinished || isLive) && fHasScore
                                  ? `${match.homeScore ?? 0} – ${match.awayScore ?? 0}`
                                  : "vs"}
                              </div>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <TeamLogo logo={match.awayTeam?.logo ?? null} name={match.awayTeam?.name ?? match.participant2 ?? ""} size={26} />
                                <span className={`text-sm font-semibold truncate ${isLive ? "text-white" : "text-gray-200 group-hover/match:text-white"} transition-colors`}>
                                  {match.awayTeam?.shortName ?? match.awayTeam?.name ?? match.participant2 ?? "TBA"}
                                </span>
                              </div>
                            </>
                          ) : fHasTwoSides ? (
                            /* ── Head-to-head: UFC, Boxing, etc. ── */
                            <>
                              <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
                                <span className={`text-sm font-semibold truncate text-right ${isLive ? "text-white" : "text-gray-200 group-hover/match:text-white"} transition-colors`}>
                                  {match.participant1 ?? "TBA"}
                                </span>
                              </div>
                              <div className="text-xs font-black text-white/30 w-10 text-center shrink-0">
                                {match.sport?.icon ?? "VS"}
                              </div>
                              <div className="flex items-center gap-1 flex-1 min-w-0">
                                <span className={`text-sm font-semibold truncate ${isLive ? "text-white" : "text-gray-200 group-hover/match:text-white"} transition-colors`}>
                                  {match.participant2 ?? "TBA"}
                                </span>
                              </div>
                            </>
                          ) : (
                            /* ── Solo event: F1 race ── */
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {match.sport?.icon && <span className="text-base leading-none shrink-0">{match.sport.icon}</span>}
                              <span className={`text-sm font-semibold truncate ${isLive ? "text-white" : "text-gray-200 group-hover/match:text-white"} transition-colors`}>
                                {match.title ?? match.participant1 ?? "Event"}
                              </span>
                            </div>
                          )}

                          {/* Right indicator */}
                          <div className="shrink-0 w-8 flex justify-end">
                            {isLive && (match.streams.length > 0 || !!match.streamUrl) ? (
                              <Wifi className="w-3.5 h-3.5 text-accent" />
                            ) : !isFinished && !isLive ? (
                              <CountdownTimer
                                scheduledAt={match.scheduledAt}
                                className="text-[9px] font-bold text-primary/70 whitespace-nowrap tabular-nums"
                              />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover/match:text-white/50 transition-colors" />
                            )}
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
      )}
    </div>
  );
}
