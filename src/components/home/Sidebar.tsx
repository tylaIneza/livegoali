"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Trophy, ChevronRight } from "lucide-react";
import { NotificationCard } from "@/components/home/NotificationCard";

interface LeagueItem {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

interface SportItem {
  slug: string;
  name: string;
  icon: string;
}

interface SidebarProps {
  leagues: LeagueItem[];
  sports: SportItem[];
}

export function Sidebar({ leagues, sports }: SidebarProps) {
  const searchParams = useSearchParams();
  const activeSport = searchParams.get("sport");

  return (
    <aside className="hidden lg:flex flex-col gap-6 sticky top-20 self-start">
      {/* Top Leagues */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/40">Top Leagues</h3>
        </div>
        <div className="space-y-0.5">
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/league/${league.slug}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-150 group"
            >
              <span className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                {league.logo ? (
                  <Image src={league.logo} alt={league.name} width={18} height={18} className="object-contain" style={{ width: 18, height: 18 }} />
                ) : (
                  <Trophy className="w-3.5 h-3.5 text-white/40" />
                )}
              </span>
              <span className="truncate">{league.name}</span>
            </Link>
          ))}
          {/* NBA — static link, no real League row for non-football sports */}
          <Link
            href="/fixtures?sport=basketball"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-150"
          >
            <span className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center shrink-0 text-sm">🏀</span>
            <span className="truncate">NBA</span>
          </Link>
          <Link
            href="/leagues"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-primary hover:bg-primary/10 transition-all duration-150"
          >
            View All
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Sports */}
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-3 px-1">Sports</h3>
        <div className="space-y-0.5">
          {sports.map((sport) => {
            const isActive = activeSport === sport.slug;
            return (
              <Link
                key={sport.slug}
                href={`/fixtures?sport=${sport.slug}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive ? "bg-primary/10 text-primary" : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-base leading-none w-6 text-center shrink-0">{sport.icon}</span>
                <span className="truncate">{sport.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <NotificationCard />
    </aside>
  );
}
