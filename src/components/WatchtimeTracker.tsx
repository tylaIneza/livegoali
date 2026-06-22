"use client";

import { useEffect, useRef } from "react";

export function WatchtimeTracker() {
  const accumulated = useRef(0);
  const isVisible = useRef(true);

  useEffect(() => {
    const tick = setInterval(() => {
      if (isVisible.current) accumulated.current += 1;
    }, 1000);

    const flush = () => {
      if (accumulated.current <= 0) return;
      const seconds = accumulated.current;
      accumulated.current = 0;
      try {
        navigator.sendBeacon(
          "/api/watchtime",
          new Blob([JSON.stringify({ seconds })], { type: "application/json" })
        );
      } catch {
        fetch("/api/watchtime", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seconds }),
          keepalive: true,
        }).catch(() => {});
      }
    };

    const flushInterval = setInterval(flush, 30_000);

    const handleVisibility = () => {
      isVisible.current = document.visibilityState === "visible";
      if (!isVisible.current) flush();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", flush);

    return () => {
      clearInterval(tick);
      clearInterval(flushInterval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, []);

  return null;
}
