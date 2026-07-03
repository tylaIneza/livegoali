"use client";

import { useEffect, useState } from "react";
import { Activity, Eye, ArrowUpRight } from "lucide-react";
import { getSocket } from "@/lib/socketClient";
import Link from "next/link";

interface Match {
  id: string;
  status: string;
  title?: string | null;
  participant1?: string | null;
  participant2?: string | null;
  homeTeam?: { name: string; shortName: string | null } | null;
  awayTeam?: { name: string; shortName: string | null } | null;
  league?: { name: string } | null;
  sport?: { name: string; icon: string } | null;
  streams: { id: string }[];
}

interface ViewerData {
  matchId: string;
  total: number;
  users: number;
  guests: number;
}

export function ActiveMatchesWidget() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [viewers, setViewers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    const res = await fetch("/api/matches?status=LIVE&take=8").catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMatches();
    const socket = getSocket();
    const joinGlobal = () => socket.emit("join-global");
    joinGlobal();
    socket.on("connect", joinGlobal);
    socket.on("viewer-update", (d: ViewerData[]) => {
      const map: Record<string, number> = {};
      d.forEach((v) => { map[v.matchId] = v.total; });
      setViewers(map);
    });
    socket.on("match-updated", fetchMatches);
    const interval = setInterval(fetchMatches, 60_000);
    return () => {
      socket.off("connect", joinGlobal);
      socket.off("viewer-update");
      socket.off("match-updated");
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalLiveViewers = Object.values(viewers).reduce((s, n) => s + n, 0);

  return (
    <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00FF84]/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-[#00FF84]" />
          </div>
          <span className="font-bold text-white text-sm">Active Matches</span>
        </div>
        <div className="flex items-center gap-2">
          {totalLiveViewers > 0 && (
            <span className="flex items-center gap-1 text-[10px] bg-white/5 text-white/60 border border-white/8 px-2 py-0.5 rounded-full font-semibold">
              <Eye className="w-3 h-3" /> {totalLiveViewers}
            </span>
          )}
          {matches.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] bg-red-500/12 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
              {matches.length} LIVE
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-[#00FF84]/30 border-t-[#00FF84] animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="py-10 text-center">
            <Activity className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40">No active matches</p>
            <Link href="/admin/matches" className="inline-flex items-center gap-1 mt-3 text-xs text-[#00FF84] font-semibold hover:underline">
              Go to Matches <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((match) => {
              const liveCount = viewers[match.id] ?? 0;
              const title = match.homeTeam
                ? `${match.homeTeam.name} vs ${match.awayTeam?.name ?? ""}`
                : match.participant1 && match.participant2
                  ? `${match.participant1} vs ${match.participant2}`
                  : match.title ?? "Event";
              const isLive = match.status === "LIVE" || match.status === "HALFTIME";
              return (
                <Link
                  key={match.id}
                  href={`/live/${match.id}`}
                  target="_blank"
                  className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/6 hover:border-white/10 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-[#00FF84] transition-colors">{title}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {match.sport ? `${match.sport.icon} ${match.sport.name}` : match.league?.name ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      isLive
                        ? "bg-red-500/12 text-red-400 border-red-500/20"
                        : "bg-blue-500/12 text-blue-400 border-blue-500/20"
                    }`}>{match.status}</span>
                    {liveCount > 0 && (
                      <span className="text-[10px] flex items-center gap-1 text-[#00FF84] font-bold">
                        <Eye className="w-3 h-3" />{liveCount}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-[#00FF84]/60 mt-3 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF84] animate-pulse" />
          Live updates via WebSocket
        </p>
      </div>
    </div>
  );
}
