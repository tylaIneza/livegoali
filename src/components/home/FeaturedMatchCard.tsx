"use client";

import Link from "next/link";
import { Play, MapPin } from "lucide-react";
import { TeamLogo } from "@/components/match/TeamLogo";
import { LocalTime } from "@/components/LocalTime";
import { prefetchStreamForMatch } from "@/lib/prefetchStream";
import type { HomeMatchItem } from "@/types";

export function FeaturedMatchCard({ match }: { match: HomeMatchItem | null }) {
  if (!match) {
    return (
      <div className="glass rounded-2xl p-3 w-full max-w-[240px] text-center">
        <p className="text-white/60 text-xs mb-2">No featured match right now</p>
        <Link href="/fixtures" className="text-primary text-xs font-semibold hover:underline">
          Browse Fixtures
        </Link>
      </div>
    );
  }

  const isLive = match.status === "LIVE" || match.status === "HALFTIME";
  const hasTeams = !!match.homeTeam;
  const homeLabel = match.homeTeam?.shortName ?? match.homeTeam?.name ?? match.participant1 ?? "TBA";
  const awayLabel = match.awayTeam?.shortName ?? match.awayTeam?.name ?? match.participant2 ?? "TBA";
  const href = isLive ? `/live/${match.slug}` : `/match/${match.slug}`;

  return (
    <div className="glass rounded-2xl p-3 w-full max-w-[240px] shadow-2xl">
      <div className="mb-2">
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-danger bg-danger/15 border border-danger/30 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-danger live-pulse" /> LIVE
          </span>
        ) : (
          <span className="inline-flex items-center text-[9px] font-black text-primary bg-primary/15 border border-primary/30 px-2 py-0.5 rounded-full">
            FEATURED MATCH
          </span>
        )}
      </div>
      <p className="text-[11px] text-white/60 font-medium mb-2 truncate">
        {match.league?.name ?? match.sport?.name ?? "Live Event"}
      </p>

      {hasTeams ? (
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <TeamLogo logo={match.homeTeam?.logo ?? null} name={homeLabel} size={32} />
            <span className="text-[11px] font-bold text-white text-center truncate w-full">{homeLabel}</span>
          </div>
          <span className="text-sm font-black text-white shrink-0">
            {isLive ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}` : "VS"}
          </span>
          <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <TeamLogo logo={match.awayTeam?.logo ?? null} name={awayLabel} size={32} />
            <span className="text-[11px] font-bold text-white text-center truncate w-full">{awayLabel}</span>
          </div>
        </div>
      ) : (
        <div className="text-center mb-2 py-1">
          <span className="text-sm font-black text-white">{match.title ?? homeLabel}</span>
        </div>
      )}

      {!isLive && (
        <div className="text-center mb-1">
          <LocalTime iso={String(match.scheduledAt)} format="full" className="text-[11px] text-white/80 font-semibold" />
        </div>
      )}
      {match.venue && (
        <div className="flex items-center justify-center gap-1 text-[10px] text-white/50 mb-2">
          <MapPin className="w-3 h-3" /> {match.venue}
        </div>
      )}
      {!match.venue && <div className="mb-2" />}

      <Link
        href={href}
        onMouseEnter={isLive ? () => prefetchStreamForMatch(match.id) : undefined}
        onTouchStart={isLive ? () => prefetchStreamForMatch(match.id) : undefined}
        className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl gradient-primary text-primary-foreground font-bold text-xs hover:opacity-90 active:scale-[0.98] transition-all"
      >
        <Play className="w-3 h-3 fill-white" />
        Watch Now
      </Link>
    </div>
  );
}
