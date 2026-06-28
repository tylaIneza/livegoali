export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { BarChart3, Users, MessageSquare, Timer, Eye, Trophy } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const [
    totalUsers, newUsersToday, liveMatches, totalMatches,
    totalComments, watchtimeSetting, totalNews, totalViews,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
    prisma.match.count({ where: { status: { in: ["LIVE","HALFTIME"] } } }),
    prisma.match.count(),
    prisma.comment.count({ where: { isDeleted: false } }),
    prisma.settings.findUnique({ where: { key: "total_watch_seconds" } }).catch(() => null),
    prisma.news.count({ where: { isPublished: true } }),
    prisma.news.aggregate({ _sum: { views: true } }),
  ]);

  function formatWatchHours(hours: number): string {
    if (hours >= 1_000_000) return `${+(hours / 1_000_000).toFixed(1)}M`;
    if (hours >= 1_000) return `${+(hours / 1_000).toFixed(1)}k`;
    return String(hours);
  }

  const totalWatchSeconds = watchtimeSetting ? parseInt(watchtimeSetting.value, 10) || 0 : 0;
  const watchHours = Math.floor(totalWatchSeconds / 3600);
  const watchFormatted = formatWatchHours(watchHours);

  const stats = [
    { label: "Total Users", value: totalUsers, sub: `+${newUsersToday} today`, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Live Matches", value: liveMatches, sub: `${totalMatches} total`, icon: Trophy, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Comments", value: totalComments, sub: "All time", icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Watchtime", value: `${watchFormatted}h`, sub: "Combined hours", icon: Timer, color: "text-[#00FF84]", bg: "bg-[#00FF84]/10" },
    { label: "Articles", value: totalNews, sub: "Published", icon: BarChart3, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Article Views", value: totalViews._sum.views ?? 0, sub: "Total reads", icon: Eye, color: "text-pink-400", bg: "bg-pink-500/10" },
  ];

  // Recent match activity
  const recentMatches = await prisma.match.findMany({
    include: {
      homeTeam: { select: { name: true, shortName: true } },
      awayTeam: { select: { name: true, shortName: true } },
      league: { select: { name: true } },
      _count: { select: { comments: true, chatMessages: true, predictionEntries: true } },
    },
    orderBy: { scheduledAt: "desc" },
    take: 8,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Analytics</h1>
        <p className="text-white/70 text-sm mt-1">Platform overview and engagement metrics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/8 bg-[#121821] p-4">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className={`text-2xl font-black ${s.color}`}>
              {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
            </div>
            <div className="text-xs text-white/70 mt-0.5">{s.label}</div>
            <div className="text-[10px] text-gray-700 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Match engagement */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Match Engagement</h2>
        <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-white/70 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Match</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Comments</th>
                  <th className="px-4 py-3 text-right">Chat</th>
                  <th className="px-4 py-3 text-right">Predictions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentMatches.map((m) => (
                  <tr key={m.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">
                        {m.homeTeam?.shortName || m.homeTeam?.name} vs {m.awayTeam?.shortName || m.awayTeam?.name}
                      </p>
                      <p className="text-xs text-white/60">{m.league?.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${
                        m.status === "LIVE" || m.status === "HALFTIME" ? "text-red-400" :
                        m.status === "FINISHED" ? "text-white/75" : "text-blue-400"
                      }`}>{m.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-300">{m._count.comments}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-300">{m._count.chatMessages}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-300">{m._count.predictionEntries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
