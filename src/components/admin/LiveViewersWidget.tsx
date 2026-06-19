"use client";

import { useEffect, useState } from "react";
import { Radio, UserCheck, UserX, Eye } from "lucide-react";

interface MatchViewers {
  matchId: string;
  total: number;
  users: number;
  guests: number;
}

export function LiveViewersWidget() {
  const [data, setData] = useState<MatchViewers[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchViewers = () => {
    fetch("/api/viewers")
      .then((r) => r.json())
      .then((d: MatchViewers[]) => {
        setData(Array.isArray(d) ? d : []);
        setLastUpdated(new Date());
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchViewers();
    const interval = setInterval(fetchViewers, 10_000);
    return () => clearInterval(interval);
  }, []);

  const total = data.reduce((s, m) => s + m.total, 0);
  const totalUsers = data.reduce((s, m) => s + m.users, 0);
  const totalGuests = data.reduce((s, m) => s + m.guests, 0);

  const formatCount = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className="rounded-2xl border border-white/8 bg-[#121821] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 live-pulse shrink-0" />
          <span className="text-sm font-semibold text-white">Live Viewers</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-700 animate-pulse" />
          Refreshes every 10s
          {lastUpdated && <span className="ml-1">· {lastUpdated.toLocaleTimeString()}</span>}
        </div>
      </div>

      {/* YouTube-style total count */}
      <div className="flex items-end gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-7 h-7 text-red-400 shrink-0" />
          <span className="text-5xl font-black text-white leading-none">{formatCount(total)}</span>
        </div>
        <span className="text-gray-500 text-sm mb-1">watching now</span>
      </div>

      {/* Breakdown bar */}
      {total > 0 && (
        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden mb-3">
          <div
            className="h-full bg-[#00FF84] rounded-full transition-all duration-500"
            style={{ width: `${Math.round((totalUsers / total) * 100)}%` }}
          />
        </div>
      )}

      {/* User / Guest split */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-[#00FF84]" />
          <span className="text-lg font-bold text-[#00FF84]">{formatCount(totalUsers)}</span>
          <span className="text-xs text-gray-500">signed in</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-1.5">
          <UserX className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-lg font-bold text-yellow-400">{formatCount(totalGuests)}</span>
          <span className="text-xs text-gray-500">guests</span>
        </div>
        {data.length > 0 && (
          <>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-500">{data.length} match{data.length !== 1 ? "es" : ""}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
