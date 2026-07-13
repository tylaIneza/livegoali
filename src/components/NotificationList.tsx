"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Trophy, Info, AlertCircle, CheckCheck } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string | Date;
}

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  match: Trophy,
  info: Info,
  alert: AlertCircle,
};

export function NotificationList({ initial }: { initial: NotificationItem[] }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  function handleClick(n: NotificationItem) {
    if (!n.isRead) markRead(n.id);
    if (n.link) router.push(n.link);
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    startTransition(() => {
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      }).catch(() => {});
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Notifications</h1>
            <p className="text-sm text-white/60">{notifications.length} total</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-card p-16 text-center">
          <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white font-bold mb-1">No notifications yet</p>
          <p className="text-white/60 text-sm">We&apos;ll let you know when something needs your attention.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-card overflow-hidden divide-y divide-white/5">
          {notifications.map((n) => {
            const Icon = TYPE_ICON[n.type] ?? Bell;
            const clickable = !n.isRead || !!n.link;
            return (
              <div
                key={n.id}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => handleClick(n) : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") handleClick(n);
                      }
                    : undefined
                }
                className={`flex items-start gap-3 p-4 ${!n.isRead ? "bg-primary/5" : ""} ${
                  clickable ? "cursor-pointer hover:bg-white/5 transition-colors" : ""
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  <p className="text-sm text-white/70 mt-0.5">{n.message}</p>
                  <p className="text-xs text-white/40 mt-1">{formatTimeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
