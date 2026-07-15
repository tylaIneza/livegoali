import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Info } from "lucide-react";
import { LiveBadge } from "@/components/match/LiveBadge";
import { LocalTime } from "@/components/LocalTime";
import { TeamLogo } from "@/components/match/TeamLogo";
import type { HomeMatchItem } from "@/types";

interface ScheduleTableProps {
  matches: HomeMatchItem[];
  dateStr: string;
  activeStatus?: string;
}

const STATUS_TABS = [
  { key: undefined, label: "All Matches" },
  { key: "live", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "finished", label: "Finished" },
] as const;

function buildHref(dateStr: string, status: string | undefined) {
  const sp = new URLSearchParams();
  sp.set("date", dateStr);
  if (status) sp.set("status", status);
  return `/?${sp.toString()}`;
}

export function ScheduleTable({ matches, dateStr, activeStatus }: ScheduleTableProps) {
  const byLeague = matches.reduce<Record<string, HomeMatchItem[]>>((acc, m) => {
    const key = m.league?.id ?? "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.key;
          const isLiveTab = tab.key === "live";
          return (
            <Link
              key={tab.label}
              href={buildHref(dateStr, tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all shrink-0 ${
                isActive
                  ? isLiveTab
                    ? "border-danger/40 bg-danger/10 text-danger"
                    : "border-primary/40 bg-primary/10 text-primary"
                  : "border-transparent bg-card text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-white/6 bg-card/80 p-12 text-center">
          <p className="text-white font-bold text-base mb-1">No matches for this filter</p>
          <p className="text-white/50 text-sm">Try a different date or filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.values(byLeague).map((leagueMatches) => {
            const league = leagueMatches[0].league ?? null;
            return (
              <div key={league?.id ?? "other"} className="rounded-2xl border border-white/7 bg-card overflow-hidden">
                {league?.slug ? (
                  <Link href={`/league/${league.slug}`} className="block group/league">
                    <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-white/5 bg-card/60 hover:bg-white/5 transition-colors">
                      {league.logo ? (
                        <Image src={league.logo} alt={league.name} width={18} height={18} className="object-contain shrink-0" style={{ width: 18, height: 18 }} />
                      ) : (
                        <div className="w-4.5 h-4.5 rounded-sm bg-white/10 shrink-0" />
                      )}
                      <span className="text-sm font-bold text-white group-hover/league:text-primary transition-colors">{league.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover/league:text-primary/60 transition-colors ml-auto" />
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-white/5 bg-card/60">
                    <div className="w-4.5 h-4.5 rounded-sm bg-white/10 shrink-0" />
                    <span className="text-sm font-bold text-white">Other Events</span>
                  </div>
                )}

                <div className="divide-y divide-white/4">
                  {leagueMatches.map((match) => {
                    const isLive = match.status === "LIVE" || match.status === "HALFTIME";
                    const isFinished = match.status === "FINISHED";
                    const sportSlug = match.sport?.slug ?? null;
                    const isFootball = sportSlug === "football" || !!match.homeTeamId;
                    const hasScore = isFootball;
                    const detailHref = isLive ? `/live/${match.slug}` : `/match/${match.slug}`;

                    return (
                      <div key={match.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors group/match">
                        <div className="w-14 shrink-0 text-center">
                          {isLive ? (
                            <LiveBadge startedAt={match.startedAt} minute={match.matchMinute} status={match.status} size="sm" />
                          ) : isFinished ? (
                            <span className="text-xs text-white/50 font-bold">FT</span>
                          ) : (
                            <LocalTime iso={String(match.scheduledAt)} format="time" className="text-sm font-black text-white/70 tabular-nums" />
                          )}
                        </div>

                        <Link href={detailHref} className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className="text-sm font-semibold truncate text-right text-gray-200 group-hover/match:text-white transition-colors">
                            {match.homeTeam?.shortName ?? match.homeTeam?.name ?? match.participant1 ?? "TBA"}
                          </span>
                          <TeamLogo logo={match.homeTeam?.logo ?? null} name={match.homeTeam?.name ?? match.participant1 ?? ""} size={26} />
                        </Link>

                        <Link href={detailHref} className="text-sm font-black tabular-nums w-14 text-center shrink-0 text-white">
                          {hasScore && (isLive || isFinished)
                            ? `${match.homeScore ?? 0} – ${match.awayScore ?? 0}`
                            : "vs"}
                        </Link>

                        <Link href={detailHref} className="flex items-center gap-2 flex-1 min-w-0">
                          <TeamLogo logo={match.awayTeam?.logo ?? null} name={match.awayTeam?.name ?? match.participant2 ?? ""} size={26} />
                          <span className="text-sm font-semibold truncate text-gray-200 group-hover/match:text-white transition-colors">
                            {match.awayTeam?.shortName ?? match.awayTeam?.name ?? match.participant2 ?? "TBA"}
                          </span>
                        </Link>

                        <div className="shrink-0 flex items-center gap-1">
                          {isLive ? (
                            <Link
                              href={`/live/${match.slug}`}
                              className="px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all"
                            >
                              Watch
                            </Link>
                          ) : (
                            <Link
                              href={`/match/${match.slug}`}
                              aria-label="Match details"
                              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                            >
                              <Info className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      </div>
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
