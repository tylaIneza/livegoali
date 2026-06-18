"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import { MatchCard } from "@/components/match/MatchCard";
import { Button } from "@/components/ui/button";
import type { MatchWithTeams } from "@/types";

interface Props {
  matches: MatchWithTeams[];
}

export function LiveMatchesSection({ matches }: Props) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Live Now</h2>
            <p className="text-sm text-gray-500">{matches.length} matches in progress</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 live-pulse" />
            {matches.length} LIVE
          </span>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/live">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match, i) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <MatchCard match={match} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
