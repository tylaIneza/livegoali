"use client";

import { useState, useEffect } from "react";
import { Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socketClient";

interface SidebarProps {
  events: Array<{
    id: string;
    type: string;
    minute: number;
    playerName: string | null;
    teamId: string | null;
    description: string | null;
  }>;
}

const EVENT_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  GOAL:         { icon: "⚽", color: "var(--accent)", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.25)" },
  YELLOW_CARD:  { icon: "🟨", color: "var(--warning)", bg: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.25)" },
  RED_CARD:     { icon: "🟥", color: "var(--danger)", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)" },
  SUBSTITUTION: { icon: "🔄", color: "#A855F7", bg: "rgba(168,85,247,0.10)", border: "rgba(168,85,247,0.20)" },
  VAR:          { icon: "📺", color: "var(--primary)", bg: "rgba(37,99,235,0.10)", border: "rgba(37,99,235,0.20)" },
  PENALTY:      { icon: "🥅", color: "#F97316", bg: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.20)" },
  KICKOFF:      { icon: "▶️", color: "var(--accent)", bg: "rgba(16,185,129,0.06)",  border: "rgba(16,185,129,0.15)" },
  HALFTIME:     { icon: "⏸️", color: "var(--warning)", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.15)" },
  FULLTIME:     { icon: "⏹️", color: "#94A3B8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.15)" },
};
const DEFAULT_EVENT = { icon: "📌", color: "#94A3B8", bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.12)" };

export function LiveMatchSidebar({ events: initialEvents }: SidebarProps) {
  const [events, setEvents] = useState(initialEvents);

  useEffect(() => {
    const socket = getSocket();
    socket.on("match-event", (event: {
      id?: string; type: string; minute: number;
      playerName?: string; teamId?: string; description?: string;
    }) => {
      setEvents((prev) => {
        const newEvent = { id: event.id || `${Date.now()}`, ...event, teamId: event.teamId ?? null, playerName: event.playerName ?? null, description: event.description ?? null };
        if (prev.some((e) => e.id === newEvent.id)) return prev;
        return [newEvent, ...prev];
      });
    });
    return () => {
      socket.off("match-event");
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-white/8 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/6 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-white">Live Commentary</h3>
          {events.length > 0 && (
            <span className="ml-auto text-[10px] font-bold text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{events.length} events</span>
          )}
        </div>
        <div className="overflow-y-auto max-h-[480px] p-3 space-y-2">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-full bg-white/4 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-sm text-white/40 font-medium">No events yet</p>
              <p className="text-xs text-white/25">Match events will appear here in real-time</p>
            </div>
          ) : (
            events.map((event) => {
              const cfg = EVENT_CONFIG[event.type] ?? DEFAULT_EVENT;
              const isGoal = event.type === "GOAL";
              return (
                <div
                  key={event.id}
                  className={cn(
                    "flex gap-3 p-3 rounded-xl border transition-all",
                    isGoal && "shadow-[0_0_16px_rgba(16,185,129,0.12)]"
                  )}
                  style={{ background: cfg.bg, borderColor: cfg.border }}
                >
                  {/* Minute */}
                  <div className="flex flex-col items-center shrink-0 min-w-[36px]">
                    <span className="text-xs font-black" style={{ color: cfg.color }}>{event.minute}&apos;</span>
                    {isGoal && <Zap className="w-3 h-3 mt-1" style={{ color: cfg.color }} />}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{cfg.icon}</span>
                      <span className="text-xs font-bold" style={{ color: cfg.color }}>
                        {event.type.replace(/_/g, " ")}
                      </span>
                    </div>
                    {event.playerName && (
                      <p className="text-sm font-semibold text-white mt-1">{event.playerName}</p>
                    )}
                    {event.description && (
                      <p className="text-xs text-white/50 mt-0.5">{event.description}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
