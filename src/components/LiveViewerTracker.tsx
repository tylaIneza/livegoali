"use client";

import { useEffect, useRef } from "react";

export function LiveViewerTracker({ matchId }: { matchId: string }) {
  const sessionId = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const sid = sessionId.current;
    const ping = () =>
      fetch("/api/viewers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "heartbeat", matchId, sessionId: sid }),
      }).catch(() => {});

    ping(); // immediate on mount
    const interval = setInterval(ping, 15_000);

    const handleLeave = () =>
      navigator.sendBeacon(
        "/api/viewers",
        JSON.stringify({ action: "leave", matchId, sessionId: sid })
      );

    window.addEventListener("beforeunload", handleLeave);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") handleLeave();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleLeave);
      handleLeave();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
