export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Brain, Target, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMatchDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Football Predictions",
  description: "AI-powered match predictions with expected goals, win probabilities, and expert analysis.",
};

export default async function PredictionsPage() {
  const matches = await prisma.match.findMany({
    where: {
      status: { in: ["SCHEDULED", "LIVE", "HALFTIME"] },
      prediction: { isNot: null },
    },
    include: {
      homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
      awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
      league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
      prediction: true,
    },
    orderBy: { scheduledAt: "asc" },
    take: 30,
  }).catch(() => []);

  const highConfidence = matches.filter((m) => (m.prediction?.confidence ?? 0) >= 70);
  const regular = matches.filter((m) => (m.prediction?.confidence ?? 0) < 70);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-sm font-bold text-[#00FF84] bg-[#00FF84]/10 border border-[#00FF84]/30 px-4 py-2 rounded-full mb-4">
          <Brain className="w-4 h-4" />
          AI-POWERED PREDICTIONS
        </div>
        <h1 className="text-4xl font-black text-white mb-3">Match Predictions</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Our AI analyzes team form, head-to-head records, home advantage, and 20+ statistical indicators to generate accurate predictions.
        </p>
      </div>

      {/* High Confidence */}
      {highConfidence.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[#00FF84]" />
            <h2 className="text-xl font-black text-white">High Confidence Picks</h2>
            <Badge variant="default">70%+ Confidence</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {highConfidence.map((match) => (
              <PredictionCard key={match.id} match={match as Parameters<typeof PredictionCard>[0]["match"]} featured />
            ))}
          </div>
        </section>
      )}

      {/* All predictions */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-black text-white">All Predictions</h2>
          <span className="text-gray-500 text-sm">{matches.length} matches</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(regular.length > 0 ? regular : matches).map((match) => (
            <PredictionCard key={match.id} match={match as Parameters<typeof PredictionCard>[0]["match"]} />
          ))}
        </div>
      </section>

      {matches.length === 0 && (
        <div className="text-center py-20">
          <Brain className="w-16 h-16 mx-auto mb-4 text-gray-700" />
          <p className="text-gray-500">No predictions available yet. Check back when matches are scheduled.</p>
        </div>
      )}
    </div>
  );
}

interface PredMatch {
  id: string;
  slug: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  matchMinute: number | null;
  scheduledAt: Date;
  homeTeam: { name: string; logo: string | null; shortName: string | null };
  awayTeam: { name: string; logo: string | null; shortName: string | null };
  league: { name: string; logo: string | null };
  prediction: {
    homeWinProb: number;
    drawProb: number;
    awayWinProb: number;
    expectedHomeGoals: number | null;
    expectedAwayGoals: number | null;
    confidence: number;
    aiExplanation: string | null;
    recommendation: string | null;
  } | null;
}

function PredictionCard({ match, featured = false }: { match: PredMatch; featured?: boolean }) {
  const pred = match.prediction!;
  const maxProb = Math.max(pred.homeWinProb, pred.drawProb, pred.awayWinProb);
  const isLive = match.status === "LIVE" || match.status === "HALFTIME";

  return (
    <Link href={`/match/${match.slug}`}>
      <div className={`rounded-2xl border p-5 hover:border-[#00FF84]/30 transition-all duration-200 group cursor-pointer ${
        featured
          ? "border-[#00FF84]/20 bg-gradient-to-b from-[#00FF84]/5 to-[#121821]"
          : "border-white/8 bg-[#121821]"
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {match.league.logo && (
              <Image src={match.league.logo} alt={match.league.name} width={16} height={16} className="object-contain" />
            )}
            <span className="text-xs text-gray-500">{match.league.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {isLive && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">LIVE</span>}
            <span className="text-xs text-gray-600">{formatMatchDate(match.scheduledAt)}</span>
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            {match.homeTeam.logo && (
              <Image src={match.homeTeam.logo} alt={match.homeTeam.name} width={32} height={32} className="object-contain" />
            )}
            <span className="font-bold text-white text-sm">{match.homeTeam.name}</span>
          </div>
          <div className="text-center">
            {isLive ? (
              <span className="text-lg font-black text-[#00FF84]">{match.homeScore} - {match.awayScore}</span>
            ) : (
              <span className="text-sm text-gray-600 font-bold">VS</span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-white text-sm">{match.awayTeam.name}</span>
            {match.awayTeam.logo && (
              <Image src={match.awayTeam.logo} alt={match.awayTeam.name} width={32} height={32} className="object-contain" />
            )}
          </div>
        </div>

        {/* Probability bars */}
        <div className="space-y-2 mb-4">
          {[
            { label: match.homeTeam.shortName || match.homeTeam.name, value: pred.homeWinProb, color: "bg-[#00FF84]", textColor: "text-[#00FF84]" },
            { label: "Draw", value: pred.drawProb, color: "bg-yellow-400", textColor: "text-yellow-400" },
            { label: match.awayTeam.shortName || match.awayTeam.name, value: pred.awayWinProb, color: "bg-blue-400", textColor: "text-blue-400" },
          ].map((bar) => (
            <div key={bar.label} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-16 truncate">{bar.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${bar.value}%` }} />
              </div>
              <span className={`text-xs font-bold w-10 text-right ${bar.value === maxProb ? bar.textColor : "text-gray-400"}`}>
                {bar.value.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/6">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#00FF84]" />
            <span className="text-xs text-gray-400">
              Tip: <span className="font-bold text-white">
                {pred.recommendation === "HOME_WIN" ? match.homeTeam.name
                  : pred.recommendation === "AWAY_WIN" ? match.awayTeam.name
                  : "Draw"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              pred.confidence >= 70 ? "bg-[#00FF84]/10 text-[#00FF84]" : "bg-white/5 text-gray-400"
            }`}>
              {pred.confidence.toFixed(0)}% confident
            </span>
          </div>
        </div>

        {pred.expectedHomeGoals !== null && (
          <div className="mt-2 text-center text-xs text-gray-600">
            xG: {pred.expectedHomeGoals.toFixed(1)} - {pred.expectedAwayGoals?.toFixed(1)}
          </div>
        )}
      </div>
    </Link>
  );
}
