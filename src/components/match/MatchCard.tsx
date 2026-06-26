"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, TrendingUp, Clock } from "lucide-react";
import { LiveBadge } from "./LiveBadge";
import { Button } from "@/components/ui/button";
import { formatMatchDate } from "@/lib/utils";
import type { MatchWithTeams } from "@/types";

interface MatchCardProps {
  match: MatchWithTeams;
  variant?: "default" | "compact" | "featured";
}

export function MatchCard({ match, variant = "default" }: MatchCardProps) {
  const isLive = match.status === "LIVE" || match.status === "HALFTIME";
  const isFinished = match.status === "FINISHED";
  const isScheduled = match.status === "SCHEDULED";

  if (variant === "compact") {
    return (
      <Link href={isLive ? `/live/${match.id}` : `/match/${match.slug}`}>
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex items-center gap-4 p-3 rounded-xl border border-white/8 bg-[#121821]/60 backdrop-blur-md hover:border-[#00FF84]/30 hover:bg-[#1a2235]/70 transition-all duration-200 cursor-pointer"
        >
          <div className="w-20 text-center">
            {isLive ? (
              <LiveBadge startedAt={match.startedAt} minute={match.matchMinute} status={match.status} size="sm" />
            ) : (
              <span className="text-xs text-white/75">
                {isFinished ? "FT" : formatMatchDate(match.scheduledAt).split(",")[1]?.trim() || ""}
              </span>
            )}
          </div>
          <div className="flex-1 flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <TeamLogo logo={match.homeTeam.logo} name={match.homeTeam.name} size={24} />
              <span className="text-sm font-medium text-white truncate">
                {match.homeTeam.shortName || match.homeTeam.name}
              </span>
            </div>
            <div className="flex items-center gap-2 font-bold text-lg">
              {isFinished ? (
                <>
                  <span className="text-white">{match.homeScore ?? 0}</span>
                  <span className="text-white/60">-</span>
                  <span className="text-white">{match.awayScore ?? 0}</span>
                </>
              ) : (
                <span className="text-white/75 text-sm font-normal">vs</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="text-sm font-medium text-white truncate text-right">
                {match.awayTeam.shortName || match.awayTeam.name}
              </span>
              <TeamLogo logo={match.awayTeam.logo} name={match.awayTeam.name} size={24} />
            </div>
          </div>
          {isLive && <Play className="w-4 h-4 text-[#00FF84] shrink-0" />}
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      className={`relative rounded-2xl border overflow-hidden transition-all duration-200 ${
        isLive
          ? "border-[#00FF84]/20 bg-gradient-to-b from-[#00FF84]/10 to-[#121821]/60 backdrop-blur-md shadow-[0_0_30px_rgba(0,255,132,0.08)]"
          : "border-white/8 bg-[#121821]/60 backdrop-blur-md"
      }`}
    >
      {/* League Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/6">
        <div className="flex items-center gap-2">
          {match.league.logo && (
            <Image
              src={match.league.logo}
              alt={match.league.name}
              width={20}
              height={20}
              className="rounded-sm object-contain"
            />
          )}
          <span className="text-xs text-white/75 font-medium">{match.league.name}</span>
          {match.round && (
            <span className="text-xs text-white/60">• {match.round}</span>
          )}
        </div>
        {isLive ? (
          <LiveBadge startedAt={match.startedAt} minute={match.matchMinute} status={match.status} size="sm" />
        ) : (
          <div className="flex items-center gap-1 text-xs text-white/70">
            <Clock className="w-3 h-3" />
            {isFinished ? "Full Time" : formatMatchDate(match.scheduledAt)}
          </div>
        )}
      </div>

      {/* Match Content */}
      <div className="p-5">
        <div className="flex items-center gap-4">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <TeamLogo logo={match.homeTeam.logo} name={match.homeTeam.name} size={48} />
            <span className="text-sm font-bold text-white text-center leading-tight">
              {match.homeTeam.name}
            </span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            {isFinished ? (
              <>
                <div className="text-3xl font-black tabular-nums text-white">
                  {match.homeScore ?? 0} - {match.awayScore ?? 0}
                </div>
                <span className="text-[10px] text-white/70 font-medium bg-[#1F2937] px-2 py-0.5 rounded-full">
                  FULL TIME
                </span>
              </>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-black text-white/70">VS</div>
                {isScheduled && (
                  <div className="text-xs text-white/70 mt-1">
                    {formatMatchDate(match.scheduledAt)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <TeamLogo logo={match.awayTeam.logo} name={match.awayTeam.name} size={48} />
            <span className="text-sm font-bold text-white text-center leading-tight">
              {match.awayTeam.name}
            </span>
          </div>
        </div>

        {/* Prediction Bar */}
        {match.prediction && (
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-[10px] text-white/70">
              <span>{match.prediction.homeWinProb.toFixed(0)}% H</span>
              <span>{match.prediction.drawProb.toFixed(0)}% D</span>
              <span>{match.prediction.awayWinProb.toFixed(0)}% A</span>
            </div>
            <div className="flex h-1 rounded-full overflow-hidden gap-0.5">
              <div
                className="h-full bg-[#00FF84] rounded-l-full transition-all"
                style={{ width: `${match.prediction.homeWinProb}%` }}
              />
              <div
                className="h-full bg-yellow-400 transition-all"
                style={{ width: `${match.prediction.drawProb}%` }}
              />
              <div
                className="h-full bg-blue-400 rounded-r-full transition-all"
                style={{ width: `${match.prediction.awayWinProb}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {isLive ? (
            <Button size="sm" className="flex-1 text-xs" asChild>
              <Link href={`/live/${match.id}`}>
                <Play className="w-3 h-3" />
                Watch Live
              </Link>
            </Button>
          ) : (
            <Button variant="secondary" size="sm" className="flex-1 text-xs" asChild>
              <Link href={`/match/${match.slug}`}>Match Details</Link>
            </Button>
          )}
          <Button variant="outline" size="sm" className="text-xs" asChild>
            <Link href={`/predictions`}>
              <TrendingUp className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
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
        className="object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-[#1F2937] flex items-center justify-center text-xs font-bold text-[#00FF84]"
      style={{ width: size, height: size }}
    >
      {name.charAt(0)}
    </div>
  );
}
