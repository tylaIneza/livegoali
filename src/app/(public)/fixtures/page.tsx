export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { LiveBadge } from "@/components/match/LiveBadge";
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from "date-fns";
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

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const dateStr = params.date;
  const activeDate = dateStr ? new Date(dateStr) : new Date();
  activeDate.setHours(0, 0, 0, 0);

  const dayStart = new Date(activeDate);
  const dayEnd = new Date(activeDate);
  dayEnd.setHours(23, 59, 59, 999);

  const prevDate = subDays(activeDate, 1);
  const nextDate = addDays(activeDate, 1);

  const matches = await prisma.match.findMany({
    where: { scheduledAt: { gte: dayStart, lte: dayEnd } },
    include: {
      homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
      awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
      league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
      streams: { where: { isActive: true }, select: { id: true }, take: 1 },
    },
    orderBy: { scheduledAt: "asc" },
  }).catch(() => []);

  type MatchItem = (typeof matches)[number];
  // Group by league
  const byLeague = matches.reduce<Record<string, MatchItem[]>>((acc, m) => {
    const key = m.league.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  // Build 7-day pill strip centered on today
  const dayStrip = Array.from({ length: 7 }, (_, i) => addDays(new Date().setHours(0,0,0,0), i - 2));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Fixtures</h1>
          <p className="text-gray-500 text-sm">{dayLabel(activeDate)}</p>
        </div>
      </div>

      {/* Day strip */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <Link
          href={`/fixtures?date=${format(prevDate, "yyyy-MM-dd")}`}
          className="p-2 rounded-lg border border-white/8 bg-[#121821] text-gray-400 hover:text-white hover:border-white/20 transition-all shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>

        {dayStrip.map((d) => {
          const ds = new Date(d);
          const ds_str = format(ds, "yyyy-MM-dd");
          const active_str = format(activeDate, "yyyy-MM-dd");
          const isActive = ds_str === active_str;
          return (
            <Link
              key={ds_str}
              href={`/fixtures?date=${ds_str}`}
              className={`flex flex-col items-center px-3 py-2 rounded-xl border text-center shrink-0 transition-all min-w-[60px] ${
                isActive
                  ? "border-[#00FF84]/40 bg-[#00FF84]/10 text-[#00FF84]"
                  : "border-white/8 bg-[#121821] text-gray-400 hover:border-white/20 hover:text-white"
              }`}
            >
              <span className="text-[10px] font-bold uppercase">{format(ds, "EEE")}</span>
              <span className={`text-lg font-black leading-tight ${isActive ? "text-[#00FF84]" : ""}`}>{format(ds, "d")}</span>
              <span className="text-[10px] text-gray-500">{format(ds, "MMM")}</span>
            </Link>
          );
        })}

        <Link
          href={`/fixtures?date=${format(nextDate, "yyyy-MM-dd")}`}
          className="p-2 rounded-lg border border-white/8 bg-[#121821] text-gray-400 hover:text-white hover:border-white/20 transition-all shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Matches */}
      {matches.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-[#121821] p-16 text-center">
          <Calendar className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-white font-bold mb-1">No matches on {dayLabel(activeDate)}</p>
          <p className="text-gray-500 text-sm">Try a different date</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.values(byLeague).map((leagueMatches) => {
            const league = leagueMatches[0].league;
            return (
              <div key={league.id} className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
                {/* League header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6 bg-[#0B0F14]/50">
                  {league.logo && (
                    <Image src={league.logo} alt={league.name} width={18} height={18} className="object-contain" />
                  )}
                  <Link href={`/league/${league.slug}`} className="text-sm font-bold text-white hover:text-[#00FF84] transition-colors">
                    {league.name}
                  </Link>
                  <span className="text-xs text-gray-500 ml-1">· {league.country}</span>
                </div>

                {/* Match rows */}
                <div className="divide-y divide-white/4">
                  {leagueMatches.map((match) => {
                    const isLive = match.status === "LIVE" || match.status === "HALFTIME";
                    const isFinished = match.status === "FINISHED";
                    const href = isLive ? `/live/${match.id}` : `/match/${match.slug}`;

                    return (
                      <Link key={match.id} href={href}>
                        <div className={`flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors ${isLive ? "bg-red-500/3" : ""}`}>
                          {/* Time / Status */}
                          <div className="w-16 shrink-0 text-center">
                            {isLive ? (
                              <LiveBadge minute={match.matchMinute} status={match.status} size="sm" />
                            ) : isFinished ? (
                              <span className="text-xs text-gray-500 font-bold">FT</span>
                            ) : (
                              <span className="text-xs text-gray-400 font-bold">
                                {format(new Date(match.scheduledAt), "HH:mm")}
                              </span>
                            )}
                          </div>

                          {/* Home team */}
                          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                            <span className={`text-sm font-semibold truncate ${isLive ? "text-white" : "text-gray-200"}`}>
                              {match.homeTeam.shortName || match.homeTeam.name}
                            </span>
                            {match.homeTeam.logo && (
                              <Image src={match.homeTeam.logo} alt={match.homeTeam.name} width={24} height={24} className="object-contain shrink-0" />
                            )}
                          </div>

                          {/* Score */}
                          <div className={`text-sm font-black tabular-nums w-14 text-center shrink-0 ${
                            isLive ? "text-[#00FF84]" : isFinished ? "text-white" : "text-gray-600"
                          }`}>
                            {isFinished || isLive
                              ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`
                              : "vs"}
                          </div>

                          {/* Away team */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {match.awayTeam.logo && (
                              <Image src={match.awayTeam.logo} alt={match.awayTeam.name} width={24} height={24} className="object-contain shrink-0" />
                            )}
                            <span className={`text-sm font-semibold truncate ${isLive ? "text-white" : "text-gray-200"}`}>
                              {match.awayTeam.shortName || match.awayTeam.name}
                            </span>
                          </div>

                          {/* Stream indicator */}
                          <div className="shrink-0 w-6">
                            {isLive && match.streams.length > 0 && (
                              <div className="w-2 h-2 rounded-full bg-[#00FF84] live-pulse" title="Stream available" />
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
