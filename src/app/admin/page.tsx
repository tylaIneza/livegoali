export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  Users, Radio, Timer, MessageSquare, Eye, Globe,
  TrendingUp, Trophy, ArrowUpRight, Zap,
} from "lucide-react";
import { LiveViewersWidget } from "@/components/admin/LiveViewersWidget";
import { ActiveMatchesWidget } from "@/components/admin/ActiveMatchesWidget";
import { TopCountriesWidget } from "@/components/admin/TopCountriesWidget";
import Link from "next/link";

async function getAdminStats() {
  const today = new Date().toISOString().slice(0, 10);

  const [
    totalUsers, liveMatches, totalMatches, totalNews,
    watchtimeSetting, totalComments,
    siteVisitsTotal, siteVisitsToday,
    recentUsers,
    totalViewsAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.match.count({ where: { status: { in: ["LIVE", "HALFTIME"] } } }),
    prisma.match.count(),
    prisma.news.count(),
    prisma.settings.findUnique({ where: { key: "total_watch_seconds" } }).catch(() => null),
    prisma.comment.count({ where: { isDeleted: false } }),
    prisma.settings.findUnique({ where: { key: "site_visits_total" } }),
    prisma.settings.findUnique({ where: { key: `site_visits_${today}` } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, image: true, role: true, createdAt: true },
    }),
    prisma.match.aggregate({ _sum: { views: true } }),
  ]);

  const countryRows = await prisma.settings.findMany({
    where: { key: { startsWith: "country_visits_" } },
  });
  const topCountries = countryRows
    .map((r) => ({ code: r.key.replace("country_visits_", ""), count: parseInt(r.value) || 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const activeMatches = await prisma.match.findMany({
    where: { status: { in: ["LIVE", "HALFTIME", "SCHEDULED"] } },
    include: {
      homeTeam: { select: { name: true, shortName: true } },
      awayTeam: { select: { name: true, shortName: true } },
      league: { select: { name: true } },
      sport: { select: { name: true, icon: true } },
      streams: { where: { isActive: true }, select: { id: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: 8,
  });

  const totalWatchSeconds = parseInt(watchtimeSetting?.value ?? "0") || 0;
  const watchHours = Math.floor(totalWatchSeconds / 3600);
  function fmtHours(h: number) {
    if (h >= 1_000_000) return `${+(h / 1_000_000).toFixed(1)}M`;
    if (h >= 1_000) return `${+(h / 1_000).toFixed(1)}k`;
    return String(h);
  }

  return {
    totalUsers, liveMatches, totalMatches, totalNews, totalComments,
    watchHoursFormatted: fmtHours(watchHours),
    siteVisitsTotal: parseInt(siteVisitsTotal?.value ?? "0"),
    siteVisitsToday: parseInt(siteVisitsToday?.value ?? "0"),
    activeMatches, recentUsers,
    totalMatchViews: totalViewsAgg._sum.views ?? 0,
    topCountries,
  };
}

function fmt(n: number | string) {
  if (typeof n === "string") return n;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default async function AdminDashboard() {
  const [session, stats] = await Promise.all([auth(), getAdminStats()]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const statCards = [
    {
      label: "Total Users",
      value: fmt(stats.totalUsers),
      sub: "registered accounts",
      icon: Users,
      href: "/admin/users",
      accent: "#3B82F6",
      gradFrom: "rgba(59,130,246,0.18)",
      gradTo: "rgba(59,130,246,0.03)",
      border: "rgba(59,130,246,0.25)",
      glow: "rgba(59,130,246,0.10)",
      iconBg: "rgba(59,130,246,0.15)",
    },
    {
      label: "Live Right Now",
      value: fmt(stats.liveMatches),
      sub: "matches broadcasting",
      icon: Radio,
      href: "/admin/matches",
      accent: "#EF4444",
      gradFrom: "rgba(239,68,68,0.22)",
      gradTo: "rgba(239,68,68,0.04)",
      border: "rgba(239,68,68,0.30)",
      glow: "rgba(239,68,68,0.14)",
      iconBg: "rgba(239,68,68,0.15)",
      live: true,
    },
    {
      label: "Site Visits",
      value: fmt(stats.siteVisitsTotal),
      sub: `+${fmt(stats.siteVisitsToday)} today`,
      icon: Globe,
      href: "/admin/analytics",
      accent: "#00FF84",
      gradFrom: "rgba(0,255,132,0.15)",
      gradTo: "rgba(0,255,132,0.02)",
      border: "rgba(0,255,132,0.25)",
      glow: "rgba(0,255,132,0.08)",
      iconBg: "rgba(0,255,132,0.12)",
    },
    {
      label: "Match Views",
      value: fmt(stats.totalMatchViews),
      sub: "total video plays",
      icon: Eye,
      href: "/admin/matches",
      accent: "#A855F7",
      gradFrom: "rgba(168,85,247,0.18)",
      gradTo: "rgba(168,85,247,0.03)",
      border: "rgba(168,85,247,0.25)",
      glow: "rgba(168,85,247,0.10)",
      iconBg: "rgba(168,85,247,0.15)",
    },
    {
      label: "Watch Time",
      value: stats.watchHoursFormatted,
      sub: "hours watched total",
      icon: Timer,
      href: "/admin/analytics",
      accent: "#F97316",
      gradFrom: "rgba(249,115,22,0.18)",
      gradTo: "rgba(249,115,22,0.03)",
      border: "rgba(249,115,22,0.25)",
      glow: "rgba(249,115,22,0.10)",
      iconBg: "rgba(249,115,22,0.15)",
    },
    {
      label: "Comments",
      value: fmt(stats.totalComments),
      sub: "fan interactions",
      icon: MessageSquare,
      href: "/admin/matches",
      accent: "#EC4899",
      gradFrom: "rgba(236,72,153,0.18)",
      gradTo: "rgba(236,72,153,0.03)",
      border: "rgba(236,72,153,0.25)",
      glow: "rgba(236,72,153,0.10)",
      iconBg: "rgba(236,72,153,0.15)",
    },
  ];

  const quickLinks = [
    { label: "New Match", href: "/admin/matches", icon: Trophy, color: "#00FF84" },
    { label: "Add Stream", href: "/admin/streams", icon: Radio, color: "#EF4444" },
    { label: "Analytics", href: "/admin/analytics", icon: TrendingUp, color: "#A855F7" },
    { label: "New Ad", href: "/admin/ads", icon: Zap, color: "#F97316" },
  ];

  return (
    <div className="space-y-8 pb-10">

      {/* ── Header ── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-gradient-to-br from-[#121821] to-[#0D1117] p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,255,132,0.07),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/50 font-medium mb-1">{greeting} 👋</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {session?.user.name?.split(" ")[0] || "Admin"}<span className="text-[#00FF84]">.</span>
            </h1>
            <p className="text-white/50 text-sm mt-2">
              {stats.liveMatches > 0
                ? <span className="flex items-center gap-2"><span className="inline-flex w-2 h-2 rounded-full bg-red-500 live-pulse" /><span className="text-red-400 font-semibold">{stats.liveMatches} match{stats.liveMatches !== 1 ? "es" : ""} live now</span></span>
                : "No matches broadcasting right now"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((ql) => (
              <Link
                key={ql.label}
                href={ql.href}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 hover:border-white/15 transition-all text-sm font-semibold text-white"
              >
                <ql.icon className="w-4 h-4" style={{ color: ql.color }} />
                {ql.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group relative rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5"
            style={{
              borderColor: s.border,
              background: `linear-gradient(135deg, ${s.gradFrom} 0%, ${s.gradTo} 100%)`,
              boxShadow: `0 4px 24px ${s.glow}`,
            }}
          >
            {/* Top accent line */}
            <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)` }} />

            <div className="p-5">
              {/* Icon + live badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: s.iconBg }}>
                  <s.icon className="w-5 h-5" style={{ color: s.accent }} />
                </div>
                {s.live && stats.liveMatches > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/25 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" /> LIVE
                  </span>
                )}
                {!s.live && (
                  <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                )}
              </div>

              {/* Value */}
              <div className="text-3xl font-black tracking-tight" style={{ color: s.accent }}>
                {s.value}
              </div>
              <p className="text-sm font-bold text-white mt-1">{s.label}</p>
              <p className="text-xs mt-0.5" style={{ color: `${s.accent}99` }}>{s.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Live Viewers ── */}
      <LiveViewersWidget />

      {/* ── Bottom grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Active Matches */}
        <ActiveMatchesWidget />

        {/* Recent Users */}
        <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/12 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <span className="font-bold text-white text-sm">Recent Users</span>
            </div>
            <Link href="/admin/users" className="text-xs text-white/40 hover:text-[#00FF84] transition-colors font-semibold flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4 space-y-2">
            {stats.recentUsers.map((user, i) => {
              const initials = (user.name?.charAt(0) || user.email?.charAt(0) || "U").toUpperCase();
              const colors = ["bg-blue-500/20 text-blue-300", "bg-purple-500/20 text-purple-300", "bg-green-500/20 text-green-300", "bg-orange-500/20 text-orange-300", "bg-pink-500/20 text-pink-300"];
              return (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/6 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${colors[i % colors.length]}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.name || "Unknown"}</p>
                    <p className="text-xs text-white/40 truncate">{user.email}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                    user.role === "ADMIN" || user.role === "SUPER_ADMIN"
                      ? "bg-[#00FF84]/10 text-[#00FF84] border-[#00FF84]/20"
                      : "bg-white/5 text-white/50 border-white/8"
                  }`}>{user.role}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Countries */}
        <TopCountriesWidget countries={stats.topCountries} />
      </div>

      {/* ── Site summary strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Matches", value: fmt(stats.totalMatches), color: "#00FF84", icon: Trophy },
          { label: "Total News", value: fmt(stats.totalNews), color: "#3B82F6", icon: MessageSquare },
          { label: "Countries", value: stats.topCountries.length, color: "#A855F7", icon: Globe },
          { label: "Today Visits", value: fmt(stats.siteVisitsToday), color: "#F97316", icon: TrendingUp },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/6 bg-[#121821]/80 p-4 flex items-center gap-3">
            <item.icon className="w-4 h-4 shrink-0" style={{ color: item.color }} />
            <div>
              <div className="text-lg font-black text-white">{item.value}</div>
              <div className="text-xs text-white/40">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
