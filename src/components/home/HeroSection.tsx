"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Clock, ArrowRight, Zap, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveBadge } from "@/components/match/LiveBadge";
import { formatMatchDate } from "@/lib/utils";
import { prefetchStreamForMatch } from "@/lib/prefetchStream";

interface Match {
  id: string;
  slug: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  matchMinute: number | null;
  scheduledAt: Date;
  homeTeam: { name: string; shortName: string | null; logo: string | null };
  awayTeam: { name: string; shortName: string | null; logo: string | null };
  league: { name: string; logo: string | null };
}

interface HeroProps {
  liveMatches: Match[];
  upcomingMatches: Match[];
}

export function HeroSection({ liveMatches, upcomingMatches }: HeroProps) {
  const hasLive = liveMatches.length > 0;
  const hasUpcoming = upcomingMatches.length > 0;

  // Nothing at all → full-width placeholder hero
  if (!hasLive && !hasUpcoming) {
    return <PlaceholderHero />;
  }

  const featuredLive = liveMatches[0];
  const otherLive = liveMatches.slice(1, 5);
  const upcoming = upcomingMatches.slice(0, 4);

  // Only upcoming, no live → featured upcoming + upcoming sidebar
  const featuredMain = featuredLive ?? upcomingMatches[0];
  const isMainLive = !!featuredLive;
  const sideItems = isMainLive
    ? [...otherLive, ...upcoming].slice(0, 4)
    : upcoming.slice(1, 5);

  return (
    <section className="relative overflow-hidden bg-[#0B0F14] stadium-bg">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-0 left-1/4 w-[500px] h-[300px] rounded-full blur-[80px] ${isMainLive ? "bg-red-500/6" : "bg-[#00FF84]/5"}`} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[200px] bg-blue-500/4 rounded-full blur-[80px]" />
      </div>
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {hasLive ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
                {liveMatches.length} LIVE NOW
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
                <Calendar className="w-3 h-3" />
                UPCOMING MATCHES
              </span>
            )}
          </div>
          <Link href={hasLive ? "/live" : "/fixtures"} className="flex items-center gap-1 text-xs text-white/70 hover:text-[#00FF84] transition-colors font-medium">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-4">
          {/* Main featured card */}
          {isMainLive ? (
            <FeaturedLiveCard match={featuredMain} />
          ) : (
            <FeaturedUpcomingCard match={featuredMain} />
          )}

          {/* Side list */}
          <div className="flex flex-col gap-3">
            {sideItems.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 + i * 0.07 }}
              >
                <SideMatchCard match={m} isLive={m.status === "LIVE" || m.status === "HALFTIME"} />
              </motion.div>
            ))}

            {/* Fill empty slots */}
            {sideItems.length === 0 && (
              <div className="flex-1 rounded-2xl border border-white/6 bg-[#121821]/60 p-5 flex flex-col items-center justify-center gap-2 min-h-[160px]">
                <Calendar className="w-7 h-7 text-gray-700" />
                <p className="text-white/60 text-sm text-center">More fixtures coming soon</p>
              </div>
            )}

            <Link
              href="/fixtures"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/8 bg-[#121821] text-sm text-white/75 hover:text-[#00FF84] hover:border-[#00FF84]/30 transition-all font-medium"
            >
              <Calendar className="w-4 h-4" />
              All Fixtures
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   Full-width placeholder when DB is empty
───────────────────────────────────────── */
function PlaceholderHero() {
  return (
    <section className="relative overflow-hidden bg-[#0B0F14] stadium-bg min-h-[440px] flex items-center">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,255,132,0.07),transparent_60%)]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-blue-500/4 rounded-full blur-[80px]" />
      </div>
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-6">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#00FF84] bg-[#00FF84]/10 border border-[#00FF84]/30 px-3 py-1.5 rounded-full">
                <Zap className="w-3 h-3" />
                LiveGoali
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
              The Home of
              <br />
              <span className="text-gradient">Live Football</span>
            </h1>
            <p className="text-white/75 text-base mb-8 max-w-md leading-relaxed">
              Stream live matches and follow real-time scores — all in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/fixtures">
                  <Calendar className="w-4 h-4" />
                  View Fixtures
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Right: stat tiles */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            {[
              { label: "Live Streams", value: "HD", icon: Play, color: "text-[#00FF84]", bg: "bg-[#00FF84]/10" },
              { label: "Leagues Covered", value: "9+", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-400/10" },
              { label: "Live Updates", value: "Real-time", icon: Clock, color: "text-purple-400", bg: "bg-purple-400/10" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/8 bg-[#121821] p-5 flex flex-col gap-3">
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                  <div className="text-xs text-white/70 mt-0.5 font-medium">{item.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────
   Featured live match card (left/main)
───────────────────────────────────── */
function FeaturedLiveCard({ match }: { match: Match }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative rounded-2xl overflow-hidden border border-red-500/20 bg-gradient-to-b from-red-500/6 via-[#121821] to-[#121821] flex flex-col min-h-[280px]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.09),transparent_55%)]" />
      <div className="relative p-6 flex flex-col h-full gap-5">
        {/* League + badge */}
        <div className="flex items-center justify-between">
          <LeaguePill league={match.league} />
          <LiveBadge minute={match.matchMinute} status={match.status} size="md" />
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-4 flex-1">
          <TeamBlock team={match.homeTeam} align="left" />
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="text-4xl sm:text-5xl font-black text-white/70">VS</div>
            {match.status === "HALFTIME" && (
              <span className="text-[11px] text-yellow-400 font-bold bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-0.5 rounded-full">HALF TIME</span>
            )}
          </div>
          <TeamBlock team={match.awayTeam} align="right" />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button size="lg" className="flex-1" asChild>
            <Link
              href={`/live/${match.slug}`}
              onMouseEnter={() => prefetchStreamForMatch(match.id)}
              onTouchStart={() => prefetchStreamForMatch(match.id)}
            ><Play className="w-4 h-4" />Watch Live</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href={`/match/${match.slug}`}>Stats</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ───────────────────────────────────────────
   Featured upcoming card (left/main, no live)
─────────────────────────────────────────── */
function FeaturedUpcomingCard({ match }: { match: Match }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative rounded-2xl overflow-hidden border border-white/8 bg-gradient-to-b from-[#00FF84]/5 via-[#121821] to-[#121821] flex flex-col min-h-[280px]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,132,0.07),transparent_55%)]" />
      <div className="relative p-6 flex flex-col h-full gap-5">
        {/* League + badge */}
        <div className="flex items-center justify-between">
          <LeaguePill league={match.league} />
          <span className="flex items-center gap-1.5 text-[11px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold">
            <Clock className="w-3 h-3" />UPCOMING
          </span>
        </div>

        {/* Teams + time */}
        <div className="flex items-center justify-between gap-4 flex-1">
          <TeamBlock team={match.homeTeam} align="left" />
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="text-3xl font-black text-white/60 leading-none">VS</div>
            <div className="text-center">
              <div className="text-sm font-bold text-white">{formatMatchDate(match.scheduledAt).split(",")[1]?.trim()}</div>
              <div className="text-xs text-white/70">{formatMatchDate(match.scheduledAt).split(",")[0]}</div>
            </div>
          </div>
          <TeamBlock team={match.awayTeam} align="right" />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" size="lg" className="flex-1" asChild>
            <Link href={`/match/${match.slug}`}><Clock className="w-4 h-4" />Match Details</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────
   Compact side card (right col)
──────────────────────────────── */
function SideMatchCard({ match, isLive }: { match: Match; isLive: boolean }) {
  const href = isLive ? `/live/${match.slug}` : `/match/${match.slug}`;
  return (
    <Link
      href={href}
      onMouseEnter={isLive ? () => prefetchStreamForMatch(match.id) : undefined}
      onTouchStart={isLive ? () => prefetchStreamForMatch(match.id) : undefined}
    >
      <div className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer group ${
        isLive
          ? "border-red-500/20 bg-red-500/5 hover:border-red-500/35 hover:bg-red-500/8"
          : "border-white/8 bg-[#121821] hover:border-[#00FF84]/25 hover:bg-[#181f2e]"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <LeaguePill league={match.league} tiny />
          {isLive
            ? <LiveBadge minute={match.matchMinute} status={match.status} size="sm" />
            : <span className="text-[10px] text-white/70 font-medium">{formatMatchDate(match.scheduledAt).split(",")[1]?.trim()}</span>
          }
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <TeamLogo logo={match.homeTeam.logo} name={match.homeTeam.name} size={24} />
            <span className="text-sm font-bold text-white truncate">{match.homeTeam.shortName || match.homeTeam.name}</span>
          </div>
          <div className={`text-sm font-black tabular-nums shrink-0 ${isLive ? "text-[#00FF84]" : "text-white/60"}`}>
            {isLive ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}` : "vs"}
          </div>
          <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
            <span className="text-sm font-bold text-white truncate text-right">{match.awayTeam.shortName || match.awayTeam.name}</span>
            <TeamLogo logo={match.awayTeam.logo} name={match.awayTeam.name} size={24} />
          </div>
        </div>
        {isLive && (
          <div className="mt-2.5 flex items-center gap-1 text-[11px] text-red-400 font-semibold">
            <Play className="w-3 h-3" />Watch Now
          </div>
        )}
      </div>
    </Link>
  );
}

/* ── Shared sub-components ── */

function LeaguePill({ league, tiny = false }: { league: { name: string; logo: string | null }; tiny?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {league.logo && (
        <Image src={league.logo} alt={league.name} width={tiny ? 13 : 16} height={tiny ? 13 : 16} className="object-contain" />
      )}
      <span className={`font-medium text-white/75 truncate max-w-[160px] ${tiny ? "text-[10px]" : "text-xs"}`}>
        {league.name}
      </span>
    </div>
  );
}

function TeamBlock({ team, align }: { team: { name: string; shortName: string | null; logo: string | null }; align: "left" | "right" }) {
  return (
    <div className={`flex flex-col items-center gap-2.5 flex-1 min-w-0`}>
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
        {team.logo
          ? <Image src={team.logo} alt={team.name} width={56} height={56} className="object-contain" />
          : <span className="text-2xl font-black text-[#00FF84]">{team.name.charAt(0)}</span>
        }
      </div>
      <span className="font-black text-white text-sm sm:text-base text-center leading-tight max-w-[110px]">
        {team.shortName || team.name}
      </span>
    </div>
  );
}

function TeamLogo({ logo, name, size }: { logo: string | null; name: string; size: number }) {
  return logo
    ? <Image src={logo} alt={name} width={size} height={size} className="object-contain shrink-0" style={{ width: size, height: size }} />
    : <div className="rounded-full bg-[#1F2937] flex items-center justify-center text-[10px] font-bold text-[#00FF84] shrink-0" style={{ width: size, height: size }}>{name.charAt(0)}</div>;
}
