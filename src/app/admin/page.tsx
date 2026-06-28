export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Users, Radio, Timer, MessageSquare, Eye, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveViewersWidget } from "@/components/admin/LiveViewersWidget";
import { ActiveMatchesWidget } from "@/components/admin/ActiveMatchesWidget";
import { TopCountriesWidget } from "@/components/admin/TopCountriesWidget";

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

  // Top countries
  const countryRows = await prisma.settings.findMany({
    where: { key: { startsWith: "country_visits_" } },
  });
  const topCountries = countryRows
    .map((r) => ({ code: r.key.replace("country_visits_", ""), count: parseInt(r.value) || 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Also fetch live matches for active matches section
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

export default async function AdminDashboard() {
  const [session, stats] = await Promise.all([auth(), getAdminStats()]);


  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Live Events", value: stats.liveMatches, icon: Radio, color: "text-red-400", bg: "bg-red-400/10", highlight: true },
    { label: "Site Visits", value: stats.siteVisitsTotal, sub: `+${stats.siteVisitsToday} today`, icon: Globe, color: "text-[#00FF84]", bg: "bg-[#00FF84]/10" },
    { label: "Match Views", value: stats.totalMatchViews, icon: Eye, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Watchtime", value: stats.watchHoursFormatted, icon: Timer, color: "text-orange-400", bg: "bg-orange-400/10", sub: "hours watched" },
    { label: "Comments", value: stats.totalComments, icon: MessageSquare, color: "text-pink-400", bg: "bg-pink-400/10" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white">Dashboard</h1>
        <p className="text-white/70 mt-1">Welcome back, {session?.user.name || "Admin"}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className={`relative overflow-hidden ${stat.highlight ? "border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : ""}`}>
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-black ${stat.highlight ? "text-red-400" : "text-white"}`}>
                {stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-white/70 mt-1">{stat.label}</p>
              {"sub" in stat && <p className="text-[10px] text-[#00FF84] mt-0.5">{stat.sub}</p>}
              {stat.highlight && stat.value > 0 && (
                <div className="absolute top-3 right-3">
                  <span className="flex items-center gap-1 text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
                    LIVE
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live viewers */}
      <LiveViewersWidget />

      {/* Active Matches + Recent Users + Top Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActiveMatchesWidget />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-blue-400" /> Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0B0F14] border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-[#1F2937] flex items-center justify-center text-sm font-bold text-[#00FF84] shrink-0">
                    {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name || "Unknown"}</p>
                    <p className="text-xs text-white/70 truncate">{user.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.role === "ADMIN" || user.role === "SUPER_ADMIN"
                      ? "bg-[#00FF84]/10 text-[#00FF84]"
                      : "bg-white/5 text-white/75"
                  }`}>{user.role}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <TopCountriesWidget countries={stats.topCountries} />
      </div>
    </div>
  );
}
