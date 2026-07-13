export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Trophy, ArrowRight, Globe } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Football Leagues & Competitions",
  description: "Browse all football leagues and competitions on LiveGoali.",
};

const LEAGUE_COLORS: Record<string, string> = {
  "premier-league": "#3D195B",
  "la-liga": "#EE2523",
  "bundesliga": "#D3010C",
  "serie-a": "#024494",
  "ligue-1": "#1A3150",
  "champions-league": "#0B2265",
  "europa-league": "#F47B20",
  "caf-champions-league": "#009A44",
  "rwanda-premier-league": "#20603D",
};

const LEAGUE_FLAGS: Record<string, string> = {
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Spain: "🇪🇸", Germany: "🇩🇪", Italy: "🇮🇹",
  France: "🇫🇷", Europe: "🏆", Africa: "🌍", Rwanda: "🇷🇼",
};

export default async function LeaguesPage() {
  const leagues = await prisma.league.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { matches: true, teams: true },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
  }).catch(() => []);

  const featured = leagues.filter((l) => l.isFeatured);
  const others = leagues.filter((l) => !l.isFeatured);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Leagues & Competitions</h1>
          <p className="text-white text-sm">{leagues.length} competitions available</p>
        </div>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-3">Top Competitions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {featured.map((league) => {
              const accentColor = LEAGUE_COLORS[league.slug] ?? "#1F2937";
              const flag = LEAGUE_FLAGS[league.country] ?? "⚽";
              return (
                <Link key={league.id} href={`/league/${league.slug}`}>
                  <div className="relative rounded-2xl border border-white/8 bg-card p-5 overflow-hidden hover:border-primary/30 hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
                    <div
                      className="absolute inset-0 opacity-15"
                      style={{ background: `linear-gradient(135deg, ${accentColor} 0%, transparent 60%)` }}
                    />
                    <div className="relative flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                        {league.logo
                          ? <Image src={league.logo} alt={league.name} width={44} height={44} className="object-contain" />
                          : <span className="text-2xl">{flag}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white group-hover:text-primary transition-colors leading-tight truncate">
                          {league.name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Globe className="w-3 h-3 text-white/60" />
                          <span className="text-xs text-white/70">{league.country}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-white/60">{league.season}</span>
                          <span className="text-[11px] text-white/60">{league._count.matches} matches</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Others */}
      {others.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-3">All Competitions</h2>
          <div className="rounded-2xl border border-white/8 bg-card overflow-hidden divide-y divide-white/5">
            {others.map((league) => {
              const flag = LEAGUE_FLAGS[league.country] ?? "⚽";
              return (
                <Link key={league.id} href={`/league/${league.slug}`}>
                  <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors group">
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      {league.logo
                        ? <Image src={league.logo} alt={league.name} width={28} height={28} className="object-contain" />
                        : <span className="text-lg">{flag}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors truncate">{league.name}</p>
                      <p className="text-xs text-white/70">{league.country} · {league.season}</p>
                    </div>
                    <div className="text-xs text-white/60 shrink-0">{league._count.teams} teams</div>
                    <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {leagues.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-card p-16 text-center">
          <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-white font-bold mb-1">No leagues yet</p>
          <p className="text-white/70 text-sm">Leagues will appear here once added in the admin panel</p>
        </div>
      )}
    </div>
  );
}
