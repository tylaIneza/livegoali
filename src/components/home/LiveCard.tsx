"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Star, Wifi } from "lucide-react";
import { LiveBadge } from "@/components/match/LiveBadge";
import { TeamLogo } from "@/components/match/TeamLogo";
import type { HomeMatchItem } from "@/types";

export function LiveCard({ match }: { match: HomeMatchItem }) {
  const sportSlug = match.sport?.slug ?? null;
  const SOLO = ["formula1"];
  const isFootball = sportSlug === "football" || (!sportSlug && !!match.homeTeamId);
  const isSolo = SOLO.includes(sportSlug ?? "");
  const hasTeams = !!match.homeTeam;
  const hasTwoSidesCard = !isSolo && (hasTeams || (!!match.participant1 && !!match.participant2));
  const watchLabel = sportSlug === "formula1" ? "Watch Race"
    : (sportSlug === "ufc" || sportSlug === "boxing") ? "Watch Fight"
    : "Watch Live";

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border bg-card group transition-all duration-300 ${
        match.isFeatured ? "border-warning/30 shadow-[0_0_60px_rgba(245,158,11,0.12)] hover:border-warning/50" : "border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.07)] hover:border-red-500/35"
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${match.isFeatured ? "via-warning/70" : "via-red-500/70"}`} />
      <div className={`p-5 ${match.isFeatured ? "sm:p-6" : ""}`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 min-w-0">
            {match.isFeatured && (
              <span className="flex items-center gap-1 text-[10px] font-black text-warning bg-warning/12 border border-warning/25 px-2 py-0.5 rounded-full shrink-0">
                <Star className="w-2.5 h-2.5 fill-warning" /> FEATURED
              </span>
            )}
            {match.league?.logo ? (
              <Image src={match.league.logo} alt={match.league.name} width={16} height={16} className="object-contain shrink-0" style={{ width: 16, height: 16 }} />
            ) : match.sport?.icon ? (
              <span className="text-sm leading-none shrink-0">{match.sport.icon}</span>
            ) : null}
            <span className="text-xs text-white/70 font-medium truncate">
              {match.league?.name ?? match.sport?.name ?? "Live Event"}
            </span>
          </div>
          <LiveBadge startedAt={match.startedAt} minute={match.matchMinute} status={match.status} size="sm" />
        </div>

        {hasTeams ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <TeamLogo logo={match.homeTeam?.logo ?? null} name={match.homeTeam?.name ?? match.participant1 ?? ""} size={48} />
              <span className="text-xs font-bold text-white text-center leading-tight line-clamp-2 w-full">
                {match.homeTeam?.shortName ?? match.homeTeam?.name ?? match.participant1 ?? "TBA"}
              </span>
            </div>
            <div className="flex flex-col items-center shrink-0 gap-1.5">
              {isFootball ? (
                <div className="text-2xl font-black text-white tabular-nums leading-none">
                  {match.homeScore ?? 0}
                  <span className="text-white/30 mx-1">–</span>
                  {match.awayScore ?? 0}
                </div>
              ) : (
                <div className="text-xl font-black text-white/50">VS</div>
              )}
              {(match.streams.length > 0 || !!match.streamUrl) && (
                <span className="flex items-center gap-1 text-[10px] text-accent/80">
                  <Wifi className="w-2.5 h-2.5" /> Live
                </span>
              )}
            </div>
            <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <TeamLogo logo={match.awayTeam?.logo ?? null} name={match.awayTeam?.name ?? match.participant2 ?? ""} size={48} />
              <span className="text-xs font-bold text-white text-center leading-tight line-clamp-2 w-full">
                {match.awayTeam?.shortName ?? match.awayTeam?.name ?? match.participant2 ?? "TBA"}
              </span>
            </div>
          </div>
        ) : hasTwoSidesCard ? (
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <div className="w-12 h-12 rounded-full bg-accent/10 border-2 border-accent/25 flex items-center justify-center shrink-0">
                <span className="text-lg font-black text-accent">{(match.participant1 ?? "?").charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-xs font-bold text-white text-center leading-tight line-clamp-2 w-full">
                {match.participant1 ?? "TBA"}
              </span>
            </div>
            <div className="flex flex-col items-center shrink-0 gap-1">
              {match.sport?.icon && <span className="text-lg leading-none">{match.sport.icon}</span>}
              <span className="text-sm font-black text-white/50">VS</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/25 flex items-center justify-center shrink-0">
                <span className="text-lg font-black text-primary">{(match.participant2 ?? "?").charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-xs font-bold text-white text-center leading-tight line-clamp-2 w-full">
                {match.participant2 ?? "TBA"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            {match.sport?.icon && <span className="text-3xl leading-none">{match.sport.icon}</span>}
            <span className="text-sm font-black text-white leading-tight">
              {match.title ?? match.participant1 ?? "Live Event"}
            </span>
          </div>
        )}

        <Link
          href={`/live/${match.slug}`}
          className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Play className="w-4 h-4 fill-white" />
          {watchLabel}
        </Link>
      </div>
    </div>
  );
}
