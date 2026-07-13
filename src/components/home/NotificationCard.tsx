"use client";

import { useState, useSyncExternalStore } from "react";
import { Bell, BellRing, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

function subscribeNoop() {
  return () => {};
}
function getPermissionSnapshot() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported" as const;
  return window.Notification.permission;
}
function getServerPermissionSnapshot() {
  return "default" as const;
}

export function NotificationCard() {
  // Reads the browser's real (non-React) permission state without an effect —
  // useSyncExternalStore re-checks it after hydration, avoiding SSR mismatches.
  const permission = useSyncExternalStore(subscribeNoop, getPermissionSnapshot, getServerPermissionSnapshot);
  const [justRequested, setJustRequested] = useState<"granted" | "denied" | "unsupported" | null>(null);

  const status =
    justRequested ??
    (permission === "unsupported" ? "unsupported" : permission === "granted" ? "granted" : permission === "denied" ? "denied" : "idle");

  const handleEnable = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setJustRequested("unsupported");
      return;
    }
    try {
      const permission = await window.Notification.requestPermission();
      setJustRequested(permission === "granted" ? "granted" : "denied");
    } catch {
      setJustRequested("unsupported");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-6 bottom-0 w-24 h-24 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative">
        <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(37,99,235,0.25)]">
          <BellRing className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-sm font-bold text-white mb-1">Never miss a match</h3>
        <p className="text-xs text-white/60 leading-relaxed mb-4">
          Get browser alerts for kickoffs, goals, and your favorite teams.
        </p>
        {status === "granted" ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
            <Check className="w-3.5 h-3.5" /> Notifications enabled
          </div>
        ) : (
          <Button size="sm" className="w-full" onClick={handleEnable}>
            <Bell className="w-4 h-4" />
            Enable Notifications
          </Button>
        )}
        {status === "denied" && (
          <p className="text-[11px] text-white/40 mt-2">Blocked — enable notifications in your browser settings.</p>
        )}
        {status === "unsupported" && (
          <p className="text-[11px] text-white/40 mt-2">Notifications aren&apos;t supported in this browser.</p>
        )}
      </div>
    </div>
  );
}
