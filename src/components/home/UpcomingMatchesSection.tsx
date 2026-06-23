"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";
import { MatchCard } from "@/components/match/MatchCard";
import { Button } from "@/components/ui/button";
import type { MatchWithTeams } from "@/types";

interface Props {
  matches: MatchWithTeams[];
}

export function UpcomingMatchesSection({ matches }: Props) {
  if (!matches.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Upcoming Matches</h2>
            <p className="text-sm text-white/70">Next 48 hours</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/fixtures">
            All Fixtures <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {matches.map((match, i) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
          >
            <MatchCard match={match} variant="compact" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
