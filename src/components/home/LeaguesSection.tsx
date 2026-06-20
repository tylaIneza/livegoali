"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Trophy, ArrowRight } from "lucide-react";

const featuredLeagues = [
  { name: "Premier League", slug: "premier-league", country: "England", color: "#3D195B", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "La Liga", slug: "la-liga", country: "Spain", color: "#EE2523", emoji: "🇪🇸" },
  { name: "Bundesliga", slug: "bundesliga", country: "Germany", color: "#D3010C", emoji: "🇩🇪" },
  { name: "Serie A", slug: "serie-a", country: "Italy", color: "#024494", emoji: "🇮🇹" },
  { name: "Ligue 1", slug: "ligue-1", country: "France", color: "#1A3150", emoji: "🇫🇷" },
  { name: "Champions League", slug: "champions-league", country: "Europe", color: "#0B2265", emoji: "🏆" },
  { name: "Europa League", slug: "europa-league", country: "Europe", color: "#F47B20", emoji: "🏅" },
  { name: "CAF Champions League", slug: "caf-champions-league", country: "Africa", color: "#009A44", emoji: "🌍" },
  { name: "Rwanda Premier League", slug: "rwanda-premier-league", country: "Rwanda", color: "#20603D", emoji: "🇷🇼" },
];

interface Props {
  leagues?: Array<{ id: string; name: string; slug: string; country: string; season?: string; logo: string | null }>;
}

export function LeaguesSection({ leagues }: Props) {
  const displayLeagues = leagues && leagues.length > 0 ? leagues : featuredLeagues;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Leagues & Competitions</h2>
            <p className="text-sm text-gray-500">Top football competitions worldwide</p>
          </div>
        </div>
        <Link href="/leagues" className="text-sm text-[#00FF84] hover:underline flex items-center gap-1">
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {displayLeagues.map((league, i) => {
          const fl = "emoji" in league ? league : null;
          return (
            <motion.div
              key={league.slug}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
            >
              <Link href={`/league/${league.slug}`}>
                <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#121821] p-5 hover:border-[#00FF84]/30 hover:bg-[#1a2235] transition-all duration-200 group cursor-pointer">
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{ background: `linear-gradient(135deg, ${"color" in league ? (league as {color: string}).color : "#1F2937"} 0%, transparent 60%)` }}
                  />
                  <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/5">
                      {"logo" in league && league.logo ? (
                        <Image src={league.logo} alt={league.name} width={40} height={40} className="object-contain" />
                      ) : (
                        <span>{fl?.emoji || "⚽"}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm leading-tight group-hover:text-[#00FF84] transition-colors">
                        {league.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {league.country}{"season" in league && league.season ? ` · ${league.season}` : ""}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-[#00FF84] transition-colors shrink-0" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
