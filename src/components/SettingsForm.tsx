"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Bell, BellRing, Check, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { getReminders, clearReminders } from "@/lib/notifPrefs";

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

export function SettingsForm() {
  const permission = useSyncExternalStore(subscribeNoop, getPermissionSnapshot, getServerPermissionSnapshot);
  const [justRequested, setJustRequested] = useState<"granted" | "denied" | "unsupported" | null>(null);
  const [reminderCount, setReminderCount] = useState(0);

  useEffect(() => {
    setReminderCount(getReminders().length);
  }, []);

  const status =
    justRequested ??
    (permission === "unsupported" ? "unsupported" : permission === "granted" ? "granted" : permission === "denied" ? "denied" : "idle");

  const handleEnable = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setJustRequested("unsupported");
      return;
    }
    try {
      const result = await window.Notification.requestPermission();
      setJustRequested(result === "granted" ? "granted" : "denied");
    } catch {
      setJustRequested("unsupported");
    }
  };

  const handleClearReminders = () => {
    clearReminders();
    setReminderCount(0);
    toast.success("Reminders cleared");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/8 bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white mb-1">Browser Notifications</h2>
            <p className="text-xs text-white/60 leading-relaxed mb-4">
              Get alerts for kickoffs, goals, and matches you're following, even in another tab.
            </p>
            {status === "granted" ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                <Check className="w-3.5 h-3.5" /> Notifications enabled
              </div>
            ) : (
              <Button size="sm" onClick={handleEnable}>
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
      </div>

      <div className="rounded-2xl border border-white/8 bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-white/60" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white mb-1">Match Reminders</h2>
            <p className="text-xs text-white/60 leading-relaxed mb-4">
              {reminderCount > 0
                ? `You have ${reminderCount} match reminder${reminderCount !== 1 ? "s" : ""} set on this device.`
                : "You don't have any match reminders set on this device."}
            </p>
            <Button size="sm" variant="outline" onClick={handleClearReminders} disabled={reminderCount === 0}>
              Clear All Reminders
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
