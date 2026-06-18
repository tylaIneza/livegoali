"use client";

import { useEffect, useState } from "react";
import { Radio, UserCheck, UserX } from "lucide-react";

interface MatchViewers {
  matchId: string;
  total: number;
  users: number;
  guests: number;
}

export function LiveViewersWidget() {
  const [data, setData] = useState<MatchViewers[]>([]);
  const [total, setTotal] = useState(0);

  const fetchViewers = () => {
    fetch("/api/viewers")
      .then((r) => r.json())
      .then((d: MatchViewers[]) => {
        setData(d);
        setTotal(d.reduce((s, m) => s + m.total, 0));
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchViewers();
    const interval = setInterval(fetchViewers, 30_000);
    return () => clearInterval(interval);
  }, []);

  const totalUsers = data.reduce((s, m) => s + m.users, 0);
  const totalGuests = data.reduce((s, m) => s + m.guests, 0);

  return (
    <div className="rounded-2xl border border-white/8 bg-[#121821] p-5 flex items-center justify-between gap-6">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 live-pulse shrink-0" />
        <span className="text-base font-bold text-white">Watching Live Now</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-red-400" />
          <span className="text-2xl font-black text-red-400">{total}</span>
          <span className="text-xs text-gray-500">total</span>
        </div>
        <div className="flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-[#00FF84]" />
          <span className="text-2xl font-black text-[#00FF84]">{totalUsers}</span>
          <span className="text-xs text-gray-500">users</span>
        </div>
        <div className="flex items-center gap-1.5">
          <UserX className="w-4 h-4 text-yellow-400" />
          <span className="text-2xl font-black text-yellow-400">{totalGuests}</span>
          <span className="text-xs text-gray-500">guests</span>
        </div>
      </div>
    </div>
  );
}
