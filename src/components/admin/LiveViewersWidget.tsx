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

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

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

  const cards = [
    {
      label: "Total Viewers",
      value: fmt(total),
      icon: Eye,
      color: "#EF4444",
      bg: "rgba(239,68,68,0.10)",
      border: "rgba(239,68,68,0.20)",
      glow: "rgba(239,68,68,0.12)",
      badge: (
        <span className="flex items-center gap-1 text-[10px] text-[#00FF84] bg-[#00FF84]/10 border border-[#00FF84]/20 px-2 py-0.5 rounded-full font-bold">
          <Wifi className="w-2.5 h-2.5" /> Live
        </span>
      ),
      pulse: true,
    },
    {
      label: "Signed In",
      value: fmt(totalUsers),
      icon: UserCheck,
      color: "#00FF84",
      bg: "rgba(0,255,132,0.08)",
      border: "rgba(0,255,132,0.18)",
      glow: "rgba(0,255,132,0.10)",
    },
    {
      label: "Guests",
      value: fmt(totalGuests),
      icon: UserX,
      color: "#EAB308",
      bg: "rgba(234,179,8,0.08)",
      border: "rgba(234,179,8,0.18)",
      glow: "rgba(234,179,8,0.10)",
    },
    {
      label: "Live Matches",
      value: data.length.toString(),
      icon: Radio,
      color: "#A855F7",
      bg: "rgba(168,85,247,0.08)",
      border: "rgba(168,85,247,0.18)",
      glow: "rgba(168,85,247,0.10)",
      pulse: true,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="w-2 h-2 rounded-full bg-red-500 live-pulse shrink-0" />
        <span className="text-sm font-bold text-white/70 uppercase tracking-widest">Live Viewers</span>
        <span className="flex items-center gap-1 text-[10px] text-[#00FF84] bg-[#00FF84]/10 border border-[#00FF84]/20 px-2 py-0.5 rounded-full font-bold ml-1">
          <Wifi className="w-2.5 h-2.5" /> Real-time
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="relative rounded-2xl overflow-hidden p-5 flex flex-col gap-3 border transition-all duration-300"
              style={{
                background: card.bg,
                borderColor: card.border,
                boxShadow: `0 4px 24px ${card.glow}`,
              }}
            >
              {/* Top accent line */}
              <div
                className="absolute inset-x-0 top-0 h-0.5"
                style={{ background: `linear-gradient(90deg, transparent, ${card.color}, transparent)` }}
              />

              {/* Icon + badge row */}
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: card.bg, border: `1px solid ${card.border}` }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                {card.pulse && (
                  <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: card.color, boxShadow: `0 0 6px ${card.color}` }} />
                )}
              </div>

              {/* Value */}
              <div>
                <div className="text-3xl font-black leading-none" style={{ color: card.color }}>
                  {card.value}
                </div>
                <div className="text-xs text-white/50 font-medium mt-1.5">{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
