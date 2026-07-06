"use client";

import { useEffect } from "react";

export function ViewTracker({ type, matchId, channelId }: { type: "match" | "site" | "channel"; matchId?: string; channelId?: string }) {
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, matchId, channelId }),
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
