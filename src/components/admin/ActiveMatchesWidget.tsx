"use client";

import { useEffect, useState } from "react";
import { Eye, Wifi, Play, Calendar } from "lucide-react";
import { getSocket } from "@/lib/socketClient";
import Link from "next/link";

interface Match {
  id: string;
  slug: string;
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

function TeamBadge({ name, color }: { name: string; color: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 border"
        style={{ background: `${color}18`, borderColor: `${color}30`, color }}
      >
        {initials}
      </div>
      <span className="text-xs font-bold text-white text-center leading-tight line-clamp-1 w-full px-1">{name}</span>
    </div>
  );
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
  const liveCount = matches.filter((m) => m.status === "LIVE" || m.status === "HALFTIME").length;

  return (
    <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-500/12 flex items-center justify-center">
            <Play className="w-4 h-4 text-red-400 fill-red-400" />
          </div>
          <span className="font-bold text-white text-sm">Active Matches</span>
        </div>
        <div className="flex items-center gap-2">
          {totalLiveViewers > 0 && (
            <span className="flex items-center gap-1 text-[10px] bg-white/5 text-white/60 border border-white/8 px-2 py-0.5 rounded-full font-semibold">
              <Eye className="w-3 h-3" /> {totalLiveViewers}
            </span>
          )}
          {liveCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] bg-red-500/15 text-red-400 border border-red-500/25 px-2.5 py-0.5 rounded-full font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
              {liveCount} LIVE
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 rounded-full border-2 border-[#00FF84]/30 border-t-[#00FF84] animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="py-10 text-center">
            <Calendar className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40 font-medium">No active matches</p>
            <Link href="/admin/matches" className="inline-flex items-center gap-1 mt-3 text-xs text-[#00FF84] font-bold hover:underline">
              Schedule a match →
            </Link>
          </div>
        ) : (
          matches.map((match) => {
            const vc = viewers[match.id] ?? 0;
            const isLive = match.status === "LIVE" || match.status === "HALFTIME";
            const team1 = match.homeTeam?.name ?? match.participant1 ?? "Team A";
            const team2 = match.awayTeam?.name ?? match.participant2 ?? null;
            const isSolo = !team2;

            return (
              <Link
                key={match.id}
                href={`/live/${match.slug}`}
                target="_blank"
                className="block relative rounded-xl overflow-hidden border transition-all duration-200 hover:-translate-y-0.5 group"
                style={{
                  borderColor: isLive ? "rgba(239,68,68,0.25)" : "rgba(59,130,246,0.20)",
                  background: isLive
                    ? "linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(13,17,23,0.95) 100%)"
                    : "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(13,17,23,0.95) 100%)",
                }}
              >
                {/* Top accent line */}
                <div className="absolute inset-x-0 top-0 h-0.5" style={{
                  background: isLive
                    ? "linear-gradient(90deg, transparent, rgba(239,68,68,0.7), transparent)"
                    : "linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)"
                }} />

                <div className="p-3">
                  {/* Top row — sport + status + viewers */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      {match.sport?.icon && <span className="text-sm leading-none">{match.sport.icon}</span>}
                      <span className="text-[11px] text-white/50 font-medium">
                        {match.sport?.name ?? match.league?.name ?? "Event"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {vc > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-[#00FF84] font-bold">
                          <Eye className="w-3 h-3" />{vc}
                        </span>
                      )}
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isLive
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-blue-500/15 text-blue-400 border border-blue-500/25"
                      }`}>
                        {match.status === "HALFTIME" ? "HT" : match.status}
                      </span>
                    </div>
                  </div>

                  {/* Teams */}
                  {isSolo ? (
                    <div className="flex items-center gap-2 py-1">
                      <div className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-sm font-black text-white shrink-0">
                        {team1.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-white truncate">{team1}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <TeamBadge name={team1} color="#EF4444" />
                      <div className="flex flex-col items-center shrink-0 gap-0.5">
                        <span className="text-[10px] font-black text-white/30 px-2 py-1 rounded-lg border border-white/8 bg-white/4">VS</span>
                      </div>
                      <TeamBadge name={team2} color="#3B82F6" />
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/5 shrink-0">
        <p className="text-[10px] text-[#00FF84]/60 flex items-center gap-1.5">
          <Wifi className="w-3 h-3" /> Live updates via WebSocket
        </p>
      </div>
    </div>
  );
}
