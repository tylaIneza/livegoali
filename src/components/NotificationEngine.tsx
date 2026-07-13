"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socketClient";
import { notificationsGranted, isReminded, markSeenLive, getSeenLive, removeReminder } from "@/lib/notifPrefs";
import type { LiveCheckMatch } from "@/app/api/matches/live-check/route";

const POLL_MS = 20_000;

export function NotificationEngine() {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  });

  useEffect(() => {
    let cancelled = false;

    async function checkLive() {
      if (!notificationsGranted()) return;
      try {
        const res = await fetch("/api/matches/live-check");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { matches: LiveCheckMatch[] };
        const seen = new Set(getSeenLive());

        for (const match of data.matches) {
          if (seen.has(match.id)) continue;
          const reminded = isReminded(match.id);

          const notification = new window.Notification(
            reminded ? "Your match is live!" : "Match is live now",
            {
              body: match.league ? `${match.label} · ${match.league}` : match.label,
              tag: match.id,
              icon: "/favicon.ico",
            }
          );
          notification.onclick = () => {
            window.focus();
            routerRef.current.push(`/live/${match.id}`);
            notification.close();
          };

          markSeenLive(match.id);
          if (reminded) removeReminder(match.id);
        }
      } catch {
        // network hiccup — next poll will retry, nothing to surface to the user
      }
    }

    checkLive();
    const interval = setInterval(checkLive, POLL_MS);

    // Best-effort: react instantly to the existing real-time channel when it's
    // available, instead of waiting out the poll interval. Safe no-op if the
    // socket server isn't running — checkLive() itself never depends on it.
    let socket: ReturnType<typeof getSocket> | null = null;
    try {
      socket = getSocket();
      socket.on("match-updated", checkLive);
    } catch {
      // socket unavailable — polling alone still covers it
    }

    return () => {
      cancelled = true;
      clearInterval(interval);
      socket?.off("match-updated", checkLive);
    };
  }, []);

  return null;
}
