export const dynamic = "force-dynamic";

import { getSyncStatus } from "@/lib/sync-football";
import { prisma } from "@/lib/prisma";
import { SyncControls } from "./SyncControls";
import { Database, Radio, Calendar, Users, Trophy } from "lucide-react";

export default async function SyncPage() {
  const [status, matchCount, teamCount, leagueCount] = await Promise.all([
    getSyncStatus(),
    prisma.match.count(),
    prisma.team.count(),
    prisma.league.count(),
  ]);

  const liveCount = await prisma.match.count({
    where: { status: { in: ["LIVE", "HALFTIME"] } },
  });

  const fmt = (iso: string | null) => {
    if (!iso) return "Never";
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Football Data Sync</h1>
        <p className="text-gray-500 mt-1">Powered by Sportmonks API — auto-syncs leagues, teams, fixtures and live scores</p>
      </div>

      {/* DB Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Leagues", value: leagueCount, icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-400/10" },
          { label: "Teams", value: teamCount, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Matches", value: matchCount, icon: Calendar, color: "text-purple-400", bg: "bg-purple-400/10" },
          { label: "Live Now", value: liveCount, icon: Radio, color: "text-red-400", bg: "bg-red-400/10" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/8 bg-[#121821] p-5">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-black text-white">{s.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label} in DB</p>
          </div>
        ))}
      </div>

      {/* Sync Status */}
      <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Database className="w-4 h-4 text-[#00FF84]" />
          <h2 className="text-sm font-semibold text-white">Sync Status</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#0B0F14] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">Live Sync</span>
              <span className="text-[10px] text-gray-600 ml-auto">every 90 seconds</span>
            </div>
            <p className="text-sm text-gray-400">Last run: <span className="text-white">{fmt(status.live.time)}</span></p>
            <p className="text-sm text-gray-400">Fixtures updated: <span className="text-[#00FF84] font-bold">{status.live.count}</span></p>
          </div>
          <div className="bg-[#0B0F14] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">Daily Sync</span>
              <span className="text-[10px] text-gray-600 ml-auto">every 6 hours</span>
            </div>
            <p className="text-sm text-gray-400">Last run: <span className="text-white">{fmt(status.daily.time)}</span></p>
            <p className="text-sm text-gray-400">Fixtures synced: <span className="text-[#00FF84] font-bold">{status.daily.count}</span></p>
          </div>
        </div>
      </div>

      {/* Manual Controls */}
      <SyncControls />

      {/* Info */}
      <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
        <h2 className="text-sm font-semibold text-white mb-3">How It Works</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2"><span className="text-[#00FF84] shrink-0">→</span> <span><span className="text-white font-medium">Live Sync</span> — runs every 90s, fetches all inplay matches from Sportmonks and updates scores, status, and match minute in real time</span></li>
          <li className="flex items-start gap-2"><span className="text-[#00FF84] shrink-0">→</span> <span><span className="text-white font-medium">Daily Sync</span> — runs every 6h, fetches fixtures for yesterday + next 7 days and creates/updates matches, teams, and leagues</span></li>
          <li className="flex items-start gap-2"><span className="text-[#00FF84] shrink-0">→</span> <span>Teams and leagues are created automatically — no manual entry needed</span></li>
          <li className="flex items-start gap-2"><span className="text-[#00FF84] shrink-0">→</span> <span>Team logos and league logos are pulled directly from Sportmonks CDN</span></li>
        </ul>
      </div>
    </div>
  );
}
