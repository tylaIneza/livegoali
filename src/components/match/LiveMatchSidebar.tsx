"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, TrendingUp, Clock } from "lucide-react";
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

const eventIcons: Record<string, string> = {
  GOAL: "⚽",
  YELLOW_CARD: "🟨",
  RED_CARD: "🟥",
  SUBSTITUTION: "🔄",
  VAR: "📺",
  PENALTY: "🥅",
  KICKOFF: "▶️",
  HALFTIME: "⏸️",
  FULLTIME: "⏹️",
};

export function LiveMatchSidebar({
  matchId,
  enableChat,
  enableComments,
  events: initialEvents,
  prediction: initialPrediction,
  homeTeam,
  awayTeam,
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

    // Receive new match events instantly via socket
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

    // Keep prediction refresh at 60s (predictions don't go through socket)
    const predInterval = setInterval(fetchPrediction, 60_000);

    return () => {
      socket.off("match-event");
      clearInterval(predInterval);
    };
  }, [fetchPrediction]);

  const tabs: Array<{ id: Tab; label: string; icon: React.ComponentType<{className?: string}> }> = [
    ...(enableChat ? [{ id: "chat" as Tab, label: "Live Chat", icon: MessageSquare }] : []),
    { id: "commentary", label: "Commentary", icon: Clock },
    { id: "prediction", label: "Prediction", icon: TrendingUp },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#0B0F14] border border-white/8">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
              tab === t.id
                ? "bg-[#121821] text-[#00FF84]"
                : "text-white/70 hover:text-gray-300"
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-[500px]">
        {tab === "chat" && enableChat && (
          <LiveChat matchId={matchId} />
        )}

        {tab === "commentary" && (
          <div className="h-full rounded-xl border border-white/8 bg-[#121821] overflow-hidden">
            <div className="p-3 border-b border-white/8">
              <h3 className="text-sm font-bold text-white">Live Commentary</h3>
            </div>
            <div className="overflow-y-auto h-[450px] p-3 space-y-2">
              {events.length === 0 ? (
                <div className="text-center text-white/70 text-sm py-8">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No events yet
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="flex gap-3 p-2.5 rounded-lg bg-[#0B0F14] border border-white/5"
                  >
                    <div className="text-center min-w-[40px]">
                      <span className="text-xs font-bold text-[#00FF84]">{event.minute}&apos;</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{eventIcons[event.type] || "📌"}</span>
                        <span className="text-xs font-semibold text-white">{event.type.replace(/_/g, " ")}</span>
                      </div>
                      {event.playerName && (
                        <p className="text-xs text-white/75 mt-0.5">{event.playerName}</p>
                      )}
                      {event.description && (
                        <p className="text-xs text-white/70 mt-0.5">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "prediction" && (
          <div className="rounded-xl border border-white/8 bg-[#121821] overflow-hidden">
            <div className="p-3 border-b border-white/8">
              <h3 className="text-sm font-bold text-white">AI Prediction</h3>
            </div>
            <div className="p-4">
              {prediction ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <PredBox label={homeTeam.split(" ")[homeTeam.split(" ").length - 1]} value={prediction.homeWinProb} color="text-[#00FF84]" />
                    <PredBox label="Draw" value={prediction.drawProb} color="text-yellow-400" />
                    <PredBox label={awayTeam.split(" ")[awayTeam.split(" ").length - 1]} value={prediction.awayWinProb} color="text-blue-400" />
                  </div>

                  <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                    <div className="h-full bg-[#00FF84] rounded-l-full" style={{ width: `${prediction.homeWinProb}%` }} />
                    <div className="h-full bg-yellow-400" style={{ width: `${prediction.drawProb}%` }} />
                    <div className="h-full bg-blue-400 rounded-r-full" style={{ width: `${prediction.awayWinProb}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Confidence</span>
                    <span className="font-bold text-[#00FF84]">{prediction.confidence.toFixed(0)}%</span>
                  </div>

                  {prediction.expectedHomeGoals !== null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">Expected Goals</span>
                      <span className="font-bold text-white">
                        {prediction.expectedHomeGoals.toFixed(1)} - {prediction.expectedAwayGoals?.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {prediction.aiExplanation && (
                    <div className="p-3 rounded-lg bg-[#0B0F14] border border-white/6">
                      <p className="text-xs text-white/70 leading-relaxed">{prediction.aiExplanation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-white/70 text-sm py-8">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No prediction available
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comments below */}
      {enableComments && (
        <div className="mt-2">
          <CommentSection matchId={matchId} />
        </div>
      )}
    </div>
  );
}

function PredBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center p-3 rounded-xl bg-[#0B0F14] border border-white/8">
      <div className={`text-2xl font-black ${color}`}>{value.toFixed(0)}%</div>
      <div className="text-xs text-white/70 mt-1 truncate">{label}</div>
    </div>
  );
}
