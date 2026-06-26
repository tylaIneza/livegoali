"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LiveBadgeProps {
  startedAt?: Date | string | null;
  minute?: number | null; // half base: null = 1st half, 45 = 2nd half
  status?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function computeMinute(startedAt: Date | string | null | undefined, base: number | null | undefined): number | null {
  if (!startedAt) return base ?? null;
  const now = Date.now();
  const kickoff = new Date(startedAt).getTime();
  // Before scheduled kickoff — stream is live but match hasn't started yet
  if (now < kickoff) return null;
  const elapsed = Math.floor((now - kickoff) / 60_000);
  return (base ?? 0) + elapsed + 1;
}

export function LiveBadge({ startedAt, minute, status, size = "md", className }: LiveBadgeProps) {
  const [liveMinute, setLiveMinute] = useState<number | null>(() => computeMinute(startedAt, minute));

  useEffect(() => {
    if (!startedAt || status !== "LIVE") return;
    setLiveMinute(computeMinute(startedAt, minute));
    const id = setInterval(() => setLiveMinute(computeMinute(startedAt, minute)), 30_000);
    return () => clearInterval(id);
  }, [startedAt, minute, status]);

  if (status === "HALFTIME") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold",
        size === "sm" && "text-[10px] px-2 py-0.5",
        size === "md" && "text-xs px-2.5 py-1",
        size === "lg" && "text-sm px-3 py-1.5",
        className
      )}>
        HT
      </span>
    );
  }

  if (status !== "LIVE") return null;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold",
      size === "sm" && "text-[10px] px-2 py-0.5",
      size === "md" && "text-xs px-2.5 py-1",
      size === "lg" && "text-sm px-3 py-1.5",
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
      LIVE {liveMinute !== null && liveMinute > 0 ? `${liveMinute}'` : ""}
    </span>
  );
}
