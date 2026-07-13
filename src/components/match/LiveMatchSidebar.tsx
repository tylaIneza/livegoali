"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, TrendingUp, Clock, Zap, Target } from "lucide-react";
import { LiveChat } from "@/components/match/LiveChat";
import { CommentSection } from "@/components/match/CommentSection";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socketClient";

interface SidebarProps {
  matchId: string;
  enableChat: boolean;
  enableComments: boolean;
  events: Array<{
    id: string;
    type: string;
    minute: number;
    playerName: string | null;
    teamId: string | null;
    description: string | null;
  }>;
  prediction: {
    homeWinProb: number;
    drawProb: number;
    awayWinProb: number;
    confidence: number;
    aiExplanation: string | null;
    expectedHomeGoals: number | null;
    expectedAwayGoals: number | null;
  } | null;
  homeTeam: string;
  awayTeam: string;
}

type Tab = "chat" | "commentary" | "prediction";

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

export function LiveMatchSidebar({
  matchId, enableChat, enableComments, events: initialEvents,
  prediction: initialPrediction, homeTeam, awayTeam,
}: SidebarProps) {
  const [tab, setTab] = useState<Tab>(enableChat ? "chat" : "commentary");
  const [prediction, setPrediction] = useState(initialPrediction);
  const [events, setEvents] = useState(initialEvents);

  const fetchPrediction = useCallback(async () => {
    try {
      const res = await fetch(`/api/predictions?matchId=${matchId}`);
      if (res.ok) {
        const data = await res.json();
        if (data) setPrediction(data);
      }
    } catch {}
  }, [matchId]);

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
    const predInterval = setInterval(fetchPrediction, 60_000);
    return () => {
      socket.off("match-event");
      clearInterval(predInterval);
    };
  }, [fetchPrediction]);

  const tabs: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    ...(enableChat ? [{ id: "chat" as Tab, label: "Live Chat", icon: MessageSquare }] : []),
    { id: "commentary", label: "Commentary", icon: Clock },
    { id: "prediction", label: "AI Predict", icon: TrendingUp },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-2xl bg-card border border-white/8">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200",
                active
                  ? "gradient-primary text-primary-foreground shadow-[0_2px_12px_rgba(37,99,235,0.30)]"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div className="min-h-[500px]">
        {/* Live Chat */}
        {tab === "chat" && enableChat && <LiveChat matchId={matchId} />}

        {/* Commentary */}
        {tab === "commentary" && (
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
        )}

        {/* AI Prediction */}
        {tab === "prediction" && (
          <div className="rounded-2xl border border-white/8 bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/6 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/12 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <h3 className="text-sm font-bold text-white">AI Prediction</h3>
              <span className="ml-auto text-[10px] font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">BETA</span>
            </div>
            <div className="p-5">
              {prediction ? (
                <div className="space-y-5">
                  {/* Win probability boxes */}
                  <div className="grid grid-cols-3 gap-2">
                    <PredBox label={homeTeam.split(" ").pop() ?? homeTeam} value={prediction.homeWinProb} color="var(--accent)" bg="rgba(16,185,129,0.10)" border="rgba(16,185,129,0.20)" />
                    <PredBox label="Draw" value={prediction.drawProb} color="var(--warning)" bg="rgba(245,158,11,0.10)" border="rgba(245,158,11,0.20)" />
                    <PredBox label={awayTeam.split(" ").pop() ?? awayTeam} value={prediction.awayWinProb} color="var(--primary)" bg="rgba(37,99,235,0.10)" border="rgba(37,99,235,0.20)" />
                  </div>

                  {/* Stacked bar */}
                  <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                    <div className="h-full rounded-l-full" style={{ width: `${prediction.homeWinProb}%`, background: "var(--accent)" }} />
                    <div className="h-full" style={{ width: `${prediction.drawProb}%`, background: "var(--warning)" }} />
                    <div className="h-full rounded-r-full flex-1" style={{ background: "var(--primary)" }} />
                  </div>

                  {/* Confidence + xG */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-white/6 bg-white/3">
                      <span className="text-xs text-white/50 font-medium flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> Confidence
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-white/8 overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${prediction.confidence}%` }} />
                        </div>
                        <span className="text-sm font-black text-primary w-10 text-right">{prediction.confidence.toFixed(0)}%</span>
                      </div>
                    </div>

                    {prediction.expectedHomeGoals !== null && (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-white/6 bg-white/3">
                        <span className="text-xs text-white/50 font-medium">Expected Goals (xG)</span>
                        <span className="text-sm font-black text-white">
                          {prediction.expectedHomeGoals.toFixed(1)}
                          <span className="text-white/30 mx-1">—</span>
                          {prediction.expectedAwayGoals?.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* AI explanation */}
                  {prediction.aiExplanation && (
                    <div className="p-4 rounded-xl border border-purple-500/15 bg-purple-500/5">
                      <p className="text-[11px] font-bold text-purple-400 mb-2 uppercase tracking-wide">AI Analysis</p>
                      <p className="text-xs text-white/60 leading-relaxed">{prediction.aiExplanation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-14 h-14 rounded-full bg-purple-500/8 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-400/40" />
                  </div>
                  <p className="text-sm text-white/40 font-medium">No prediction available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comments section */}
      {enableComments && (
        <div className="rounded-2xl border border-white/8 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/6 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-white">Fan Comments</h3>
          </div>
          <div className="p-3">
            <CommentSection matchId={matchId} />
          </div>
        </div>
      )}
    </div>
  );
}

function PredBox({ label, value, color, bg, border }: { label: string; value: number; color: string; bg: string; border: string }) {
  return (
    <div className="text-center p-3 rounded-xl border" style={{ background: bg, borderColor: border }}>
      <div className="text-2xl font-black" style={{ color }}>{value.toFixed(0)}%</div>
      <div className="text-[10px] text-white/50 mt-1 truncate font-semibold">{label}</div>
    </div>
  );
}
