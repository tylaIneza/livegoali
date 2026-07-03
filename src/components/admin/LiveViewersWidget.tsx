"use client";

import { useEffect, useState } from "react";
import { Radio, UserCheck, UserX, Eye, Wifi } from "lucide-react";
import { getSocket } from "@/lib/socketClient";

interface MatchViewers {
  matchId: string;
  total: number;
  users: number;
  guests: number;
}

export function LiveViewersWidget() {
  const [data, setData] = useState<MatchViewers[]>([]);

  useEffect(() => {
    const socket = getSocket();
    const joinGlobal = () => socket.emit("join-global");
    joinGlobal();
    socket.on("connect", joinGlobal);
    socket.on("viewer-update", (d: MatchViewers[]) => {
      setData(Array.isArray(d) ? d : []);
    });
    return () => {
      socket.off("connect", joinGlobal);
      socket.off("viewer-update");
    };
  }, []);

  const total = data.reduce((s, m) => s + m.total, 0);
  const totalUsers = data.reduce((s, m) => s + m.users, 0);
  const totalGuests = data.reduce((s, m) => s + m.guests, 0);
  const userPct = total > 0 ? Math.round((totalUsers / total) * 100) : 0;

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-red-500/20 bg-gradient-to-br from-red-500/8 to-[#0D1117]"
      style={{ boxShadow: "0 4px 40px rgba(239,68,68,0.08)" }}>
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">

          {/* Left — big number */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 live-pulse shrink-0" />
              <span className="text-sm font-bold text-white/70 uppercase tracking-widest">Live Viewers</span>
              <span className="flex items-center gap-1 text-[10px] text-[#00FF84] bg-[#00FF84]/10 border border-[#00FF84]/20 px-2 py-0.5 rounded-full font-bold">
                <Wifi className="w-2.5 h-2.5" /> Real-time
              </span>
            </div>
            <div className="flex items-end gap-3">
              <Eye className="w-8 h-8 text-red-400 mb-1 shrink-0" />
              <span className="text-6xl sm:text-7xl font-black text-white leading-none tracking-tight">{fmt(total)}</span>
              <span className="text-white/40 text-base mb-2">watching</span>
            </div>
          </div>

          {/* Right — breakdown */}
          <div className="flex flex-col gap-4 sm:min-w-[220px]">
            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-white/50 mb-1.5">
                <span>Signed in vs Guests</span>
                <span>{userPct}% / {100 - userPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/6 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00FF84] to-[#00CC6A] transition-all duration-700"
                  style={{ width: `${userPct}%` }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#00FF84]/8 border border-[#00FF84]/15 p-3 text-center">
                <UserCheck className="w-4 h-4 text-[#00FF84] mx-auto mb-1" />
                <div className="text-lg font-black text-[#00FF84]">{fmt(totalUsers)}</div>
                <div className="text-[10px] text-white/50">Signed in</div>
              </div>
              <div className="rounded-xl bg-yellow-500/8 border border-yellow-500/15 p-3 text-center">
                <UserX className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                <div className="text-lg font-black text-yellow-400">{fmt(totalGuests)}</div>
                <div className="text-[10px] text-white/50">Guests</div>
              </div>
              <div className="rounded-xl bg-red-500/8 border border-red-500/15 p-3 text-center">
                <Radio className="w-4 h-4 text-red-400 mx-auto mb-1" />
                <div className="text-lg font-black text-red-400">{data.length}</div>
                <div className="text-[10px] text-white/50">Matches</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
