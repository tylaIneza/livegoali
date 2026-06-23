export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Play, Radio, Clock, Calendar, ChevronRight } from "lucide-react";
import { LiveBadge } from "@/components/match/LiveBadge";
import { Button } from "@/components/ui/button";
import { AdBanner } from "@/components/AdBanner";
import { HomeRefresher } from "@/components/HomeRefresher";
import { format, isToday, isTomorrow } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LiveGoali — Watch Football Live. Anytime. Anywhere.",
  description: "Watch live football matches streaming now on LiveGoali.",
};

export default async function HomePage() {
  const now = new Date();
  const in48h = new Date(now);
  in48h.setHours(in48h.getHours() + 48);

  const [liveMatches, upcomingMatches, recentFinished] = await Promise.all([
    prisma.match.findMany({
      where: { status: { in: ["LIVE", "HALFTIME"] } },
      include: {
        homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
        streams: { where: { isActive: true }, select: { id: true }, take: 1 },
      },
      orderBy: [{ isFeatured: "desc" }, { scheduledAt: "asc" }],
    }),
    prisma.match.findMany({
      where: { status: "SCHEDULED", scheduledAt: { gte: now, lte: in48h } },
      include: {
        homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 30,
    }),
    prisma.match.findMany({
      where: { status: "FINISHED" },
      include: {
        homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
        league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
      },
      orderBy: { scheduledAt: "desc" },
      take: 8,
    }),
  ]).catch(() => [[], [], []] as [never[], never[], never[]]);

  // Group upcoming by day label
  type UpcomingMatch = (typeof upcomingMatches)[number];
  const dayGroups: Record<string, UpcomingMatch[]> = {};
  for (const m of upcomingMatches) {
    const d = new Date(m.scheduledAt);
    const key = isToday(d) ? "Today" : isTomorrow(d) ? "Tomorrow" : format(d, "EEE, d MMM");
    if (!dayGroups[key]) dayGroups[key] = [];
    dayGroups[key].push(m);
  }

  // Group a day's matches by league
  function byLeague(matches: UpcomingMatch[]) {
    const g: Record<string, UpcomingMatch[]> = {};
    for (const m of matches) {
      if (!g[m.league.id]) g[m.league.id] = [];
      g[m.league.id].push(m);
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

          {/* ── LIVE MATCHES ── */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Live Now</h2>
                  <p className="text-white/70 text-sm">
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
              <div className="rounded-2xl border border-white/8 bg-[#121821] p-12 text-center">
                <Radio className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-white font-bold text-lg mb-1">No live matches right now</p>
                <p className="text-white/70 text-sm">See upcoming matches below</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {liveMatches.map((match) => (
                  <div key={match.id} className="relative rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/5 to-[#121821] overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                        <div className="flex items-center gap-2 min-w-0">
                          {match.league.logo && (
                            <Image src={match.league.logo} alt={match.league.name} width={18} height={18} className="object-contain shrink-0" />
                          )}
                          <span className="text-xs text-white/75 font-medium truncate">{match.league.name}</span>
                          <LiveBadge minute={match.matchMinute} status={match.status} size="sm" />
                        </div>
                        <span className="text-xs text-white/70 shrink-0">
                          {match.streams.length > 0 ? `${match.streams.length} stream available` : "Stream pending"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {match.homeTeam.logo && (
                            <Image src={match.homeTeam.logo} alt={match.homeTeam.name} width={44} height={44} className="object-contain shrink-0" />
                          )}
                          <span className="font-black text-white text-lg sm:text-xl truncate">{match.homeTeam.name}</span>
                        </div>
                        <div className="text-2xl font-black text-[#00FF84] shrink-0 px-3">VS</div>
                        <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
                          <span className="font-black text-white text-lg sm:text-xl truncate text-right">{match.awayTeam.name}</span>
                          {match.awayTeam.logo && (
                            <Image src={match.awayTeam.logo} alt={match.awayTeam.name} width={44} height={44} className="object-contain shrink-0" />
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <Button asChild className="flex-1">
                          <Link href={`/live/${match.id}`}>
                            <Play className="w-4 h-4" />
                            Watch Live
                          </Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href={`/match/${match.slug}`}>Stats</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── UPCOMING MATCHES ── */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Upcoming Matches</h2>
                  <p className="text-white/70 text-sm">Next 48 hours</p>
                </div>
              </div>
              <Link href="/fixtures" className="flex items-center gap-1 text-xs text-white/70 hover:text-[#00FF84] transition-colors font-medium">
                All fixtures <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingMatches.length === 0 ? (
              <div className="rounded-2xl border border-white/8 bg-[#121821] p-12 text-center">
                <Clock className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-white font-bold text-lg mb-1">No upcoming matches in the next 48 hours</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/fixtures"><Calendar className="w-4 h-4" />Full Schedule</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(dayGroups).map(([day, dayMatches]) => (
                  <div key={day}>
                    {/* Day divider */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-bold text-white">{day}</span>
                      <div className="flex-1 h-px bg-white/6" />
                      <span className="text-xs text-white/60">{dayMatches.length} match{dayMatches.length !== 1 ? "es" : ""}</span>
                    </div>

                    {/* League groups */}
                    <div className="space-y-3">
                      {byLeague(dayMatches).map((leagueMatches) => {
                        const league = leagueMatches[0].league;
                        return (
                          <div key={league.id} className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
                            {/* League header */}
                            <Link href={`/league/${league.slug}`} className="block">
                              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/6 bg-[#0D1117] hover:bg-[#0F1420] transition-colors">
                                {league.logo && (
                                  <Image src={league.logo} alt={league.name} width={18} height={18} className="object-contain shrink-0" />
                                )}
                                <span className="text-sm font-bold text-white">{league.name}</span>
                                <span className="text-xs text-white/60">· {league.country}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-700 ml-auto" />
                              </div>
                            </Link>

                            {/* Match rows */}
                            <div className="divide-y divide-white/4">
                              {leagueMatches.map((match) => (
                                <Link key={match.id} href={`/match/${match.slug}`} className="block group">
                                  <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors cursor-pointer">
                                    {/* Time */}
                                    <div className="w-12 shrink-0 text-center">
                                      <span className="text-sm font-bold text-white/75 group-hover:text-white transition-colors">
                                        {format(new Date(match.scheduledAt), "HH:mm")}
                                      </span>
                                    </div>

                                    {/* Home team */}
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
                                      <span className="text-sm font-semibold text-gray-100 truncate text-right group-hover:text-white transition-colors">
                                        {match.homeTeam.shortName || match.homeTeam.name}
                                      </span>
                                      {match.homeTeam.logo && (
                                        <Image src={match.homeTeam.logo} alt={match.homeTeam.name} width={26} height={26} className="object-contain shrink-0" />
                                      )}
                                    </div>

                                    {/* VS */}
                                    <span className="text-xs font-black text-white/60 shrink-0 w-8 text-center">VS</span>

                                    {/* Away team */}
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                      {match.awayTeam.logo && (
                                        <Image src={match.awayTeam.logo} alt={match.awayTeam.name} width={26} height={26} className="object-contain shrink-0" />
                                      )}
                                      <span className="text-sm font-semibold text-gray-100 truncate group-hover:text-white transition-colors">
                                        {match.awayTeam.shortName || match.awayTeam.name}
                                      </span>
                                    </div>

                                    <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-white/75 transition-colors shrink-0" />
                                  </div>
                                </Link>
                              ))}
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
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gray-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white/75" />
                </div>
                <h2 className="text-xl font-black text-white">Recent Results</h2>
              </div>
              <div className="space-y-2">
                {recentFinished.map((match) => (
                  <Link key={match.id} href={`/match/${match.slug}`} className="block group">
                    <div className="flex items-center gap-4 p-3.5 rounded-xl border border-white/6 bg-[#121821] hover:border-white/12 transition-colors">
                      <div className="flex items-center gap-2 text-xs text-white/70 w-28 shrink-0">
                        {match.league.logo && (
                          <Image src={match.league.logo} alt={match.league.name} width={14} height={14} className="object-contain" />
                        )}
                        <span className="truncate">{match.league.name}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-1 min-w-0 justify-between">
                        <span className="text-sm font-semibold text-gray-300 truncate group-hover:text-white transition-colors">
                          {match.homeTeam.name}
                        </span>
                        <span className="text-sm font-black text-white shrink-0">
                          {match.homeScore ?? 0} – {match.awayScore ?? 0}
                        </span>
                        <span className="text-sm font-semibold text-gray-300 truncate text-right group-hover:text-white transition-colors">
                          {match.awayTeam.name}
                        </span>
                      </div>
                      <span className="text-xs text-white/60 bg-white/5 px-2 py-0.5 rounded-full shrink-0">FT</span>
                    </div>
                  </Link>
                ))}
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
