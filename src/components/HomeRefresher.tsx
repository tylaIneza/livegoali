"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socketClient";

export function HomeRefresher() {
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const joinGlobal = () => socket.emit("join-global");
    joinGlobal();
    socket.on("connect", joinGlobal);

    // Debounce score/status updates — at most one full re-render every 30s.
    // Previously fired router.refresh() on every event, causing 50k × 3 DB
    // queries per goal scored (thundering herd).
    socket.on("match-updated", () => {
      if (refreshTimer.current) return;
      refreshTimer.current = setTimeout(() => {
        refreshTimer.current = null;
        router.refresh();
      }, 30_000);
    });

    // Soft refresh every 2 minutes (was 30s — 4x reduction in polling load)
    const interval = setInterval(() => router.refresh(), 120_000);

    return () => {
      socket.off("connect", joinGlobal);
      socket.off("match-updated");
      clearInterval(interval);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [router]);

  return null;
}
