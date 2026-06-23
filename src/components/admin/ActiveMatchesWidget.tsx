"use client";

import { useEffect, useState } from "react";
import { Activity, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSocket } from "@/lib/socketClient";

interface Match {
  id: string;
  status: string;
  homeTeam: { name: string; shortName: string | null };
  awayTeam: { name: string; shortName: string | null };
  league: { name: string };
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

    socket.on("match-updated", () => {
      fetchMatches();
    });

    // Light fallback poll every 60s for match list changes
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00FF84]" /> Active Matches
          </span>
          <div className="flex items-center gap-2">
            {totalLiveViewers > 0 && (
              <span className="flex items-center gap-1 text-[10px] bg-white/5 text-white/75 px-2 py-0.5 rounded-full">
                <Eye className="w-3 h-3" /> {totalLiveViewers} watching
              </span>
            )}
            {matches.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
                {matches.length} LIVE
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 rounded-full border-2 border-[#00FF84]/30 border-t-[#00FF84] animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <p className="text-white/70 text-sm text-center py-4">No active matches</p>
        ) : (
          <div className="space-y-2">
            {matches.map((match) => {
              const liveCount = viewers[match.id] ?? 0;
              return (
                <div key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0B0F14] border border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {match.homeTeam.name} vs {match.awayTeam.name}
                    </p>
                    <p className="text-xs text-white/70">{match.league.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      match.status === "LIVE" || match.status === "HALFTIME"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-blue-500/10 text-blue-400"
                    }`}>{match.status}</span>
                    <span className={`text-xs flex items-center gap-1 font-medium ${liveCount > 0 ? "text-[#00FF84]" : "text-white/60"}`}>
                      <Eye className="w-3 h-3" />
                      {liveCount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-[#00FF84] mt-3 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF84] animate-pulse" />
          Live updates via WebSocket
        </p>
      </CardContent>
    </Card>
  );
}
