import Link from "next/link";
import { Play, Calendar, Monitor, Apple, Smartphone, Globe } from "lucide-react";
import { FeaturedMatchCard } from "@/components/home/FeaturedMatchCard";
import type { HomeMatchItem } from "@/types";

export function Hero({ featuredMatch, isLive }: { featuredMatch: HomeMatchItem | null; isLive: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 min-h-[260px] flex items-center">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/livegoali1.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-600/10" />

      <div className="relative w-full px-5 sm:px-7 py-6 sm:py-8 flex flex-col lg:flex-row items-center gap-5 lg:gap-6">
        {/* Left */}
        <div className="flex-1 min-w-0 text-center lg:text-left">
          {isLive && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-danger bg-danger/15 border border-danger/30 px-2.5 py-1 rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-danger live-pulse" /> LIVE
            </span>
          )}
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5">
            Live Sports, Anytime
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-[1.15] mb-4 max-w-xl mx-auto lg:mx-0">
            Watch Live Football <span className="text-gradient">Anywhere</span>
          </h1>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mb-4">
            <Link
              href="/live"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Watch Live Matches
            </Link>
            <Link
              href="/fixtures"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 text-white font-semibold text-sm hover:bg-white/5 transition-all"
            >
              <Calendar className="w-3.5 h-3.5" /> Today&apos;s Schedule
            </Link>
          </div>
          <div className="flex items-center justify-center lg:justify-start gap-3 text-white/40">
            <span className="text-xs">Available on:</span>
            <Monitor className="w-3.5 h-3.5" />
            <Apple className="w-3.5 h-3.5" />
            <Smartphone className="w-3.5 h-3.5" />
            <Globe className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Right — Featured Match */}
        <div className="shrink-0 w-full lg:w-auto flex justify-center">
          <FeaturedMatchCard match={featuredMatch} />
        </div>
      </div>
    </div>
  );
}
