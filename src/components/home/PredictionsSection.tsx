"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { TrendingUp, ArrowRight, Brain, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatMatchDate } from "@/lib/utils";
import type { MatchWithTeams } from "@/types";

interface Props {
  matches: MatchWithTeams[];
}

export function PredictionsSection({ matches }: Props) {
  const predictedMatches = matches.filter((m) => m.prediction);
  if (!predictedMatches.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00FF84]/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-[#00FF84]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Today&apos;s Top Predictions</h2>
            <p className="text-sm text-white/70">AI-powered match analysis</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/predictions">
            All Predictions <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {predictedMatches.slice(0, 4).map((match, i) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <PredictionCard match={match} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function PredictionCard({ match }: { match: MatchWithTeams }) {
  const pred = match.prediction!;
  const maxProb = Math.max(pred.homeWinProb, pred.drawProb, pred.awayWinProb);
  const recommendation =
    pred.homeWinProb === maxProb
      ? match.homeTeam?.name ?? match.participant1 ?? "Home"
      : pred.awayWinProb === maxProb
      ? match.awayTeam?.name ?? match.participant2 ?? "Away"
      : "Draw";

  return (
    <Link href={`/match/${match.slug}`}>
      <div className="p-5 rounded-2xl border border-white/8 bg-[#121821] hover:border-[#00FF84]/30 transition-all duration-200 cursor-pointer group">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {match.league?.logo && (
              <Image src={match.league.logo} alt={match.league.name} width={16} height={16} className="object-contain" />
            )}
            <span className="text-xs text-white/70 font-medium">{match.league?.name ?? "Event"}</span>
          </div>
          <span className="text-xs text-white/70">{formatMatchDate(match.scheduledAt)}</span>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {match.homeTeam?.logo && (
              <Image src={match.homeTeam.logo} alt={match.homeTeam.name} width={28} height={28} className="object-contain" />
            )}
            <span className="font-bold text-white text-sm">{match.homeTeam?.name ?? match.participant1 ?? "TBA"}</span>
          </div>
          <span className="text-white/60 text-sm font-bold">VS</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">{match.awayTeam?.name ?? match.participant2 ?? "TBA"}</span>
            {match.awayTeam?.logo && (
              <Image src={match.awayTeam.logo} alt={match.awayTeam.name} width={28} height={28} className="object-contain" />
            )}
          </div>
        </div>

        {/* Prediction Bars */}
        <div className="space-y-2.5 mb-4">
          <PredBar label={match.homeTeam?.shortName || match.homeTeam?.name || match.participant1 || "Home"} value={pred.homeWinProb} color="bg-[#00FF84]" />
          <PredBar label="Draw" value={pred.drawProb} color="bg-yellow-400" />
          <PredBar label={match.awayTeam?.shortName || match.awayTeam?.name || match.participant2 || "Away"} value={pred.awayWinProb} color="bg-blue-400" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/6">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#00FF84]" />
            <span className="text-xs text-white/75">
              Prediction: <span className="text-[#00FF84] font-bold">{recommendation}</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-white/70" />
            <span className="text-xs text-white/70">{pred.confidence.toFixed(0)}% confident</span>
          </div>
        </div>

        {pred.expectedHomeGoals !== null && pred.expectedAwayGoals !== null && (
          <div className="mt-2 text-center">
            <span className="text-xs text-white/60">
              xG: {pred.expectedHomeGoals.toFixed(1)} - {pred.expectedAwayGoals.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function PredBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/70 w-20 truncate">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-bold text-white w-10 text-right">{value.toFixed(0)}%</span>
    </div>
  );
}
