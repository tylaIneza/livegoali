"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Bell, Check, Star } from "lucide-react";
import { TeamLogo } from "@/components/match/TeamLogo";
import { LocalTime } from "@/components/LocalTime";
import { SectionHeader } from "@/components/ui/section-header";
import { addReminder, isReminded } from "@/lib/notifPrefs";
import type { HomeMatchItem } from "@/types";

function subscribeNoop() {
  return () => {};
}
function getServerRemindedSnapshot() {
  return false;
}

export function UpcomingCard({ match }: { match: HomeMatchItem | null }) {
  const matchId = match?.id ?? "";
  // Reads localStorage (not React state) without an effect — re-checked after
  // hydration by useSyncExternalStore, avoiding an SSR/client mismatch.
  const persistedReminded = useSyncExternalStore(subscribeNoop, () => isReminded(matchId), getServerRemindedSnapshot);
  const [justReminded, setJustReminded] = useState(false);
  const [denied, setDenied] = useState(false);
  const reminded = justReminded || persistedReminded;

  if (!match) return null;

  const handleRemindMe = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window === "undefined" || !("Notification" in window)) return;
    let permission = window.Notification.permission;
    if (permission === "default") permission = await window.Notification.requestPermission();
    if (permission === "granted") {
      addReminder(match.id);
      setJustReminded(true);
    } else {
      setDenied(true);
    }
  };

  const homeLabel = match.homeTeam?.shortName ?? match.homeTeam?.name ?? match.participant1 ?? "TBA";
  const awayLabel = match.awayTeam?.shortName ?? match.awayTeam?.name ?? match.participant2 ?? "TBA";

  return (
    <div>
      <SectionHeader icon={Star} iconClassName="bg-warning/10 text-warning" title="Upcoming Big Match" viewAllHref="/fixtures" viewAllLabel="More" />
      <Link
        href={`/match/${match.slug}`}
        className="block rounded-2xl border border-white/8 bg-card p-5 hover:border-primary/30 transition-all"
      >
        <p className="text-xs text-white/60 font-medium text-center mb-4 truncate">
          {match.league?.name ?? match.sport?.name ?? "Event"}
        </p>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <TeamLogo logo={match.homeTeam?.logo ?? null} name={homeLabel} size={44} />
            <span className="text-xs font-bold text-white text-center truncate w-full">{homeLabel}</span>
          </div>
          <span className="text-sm font-black text-white/40 shrink-0">VS</span>
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <TeamLogo logo={match.awayTeam?.logo ?? null} name={awayLabel} size={44} />
            <span className="text-xs font-bold text-white text-center truncate w-full">{awayLabel}</span>
          </div>
        </div>
        <div className="text-center mb-4">
          <LocalTime iso={String(match.scheduledAt)} format="full" className="text-xs text-white/60 font-medium" />
        </div>
        <button
          onClick={handleRemindMe}
          disabled={reminded}
          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
            reminded ? "bg-accent/10 text-accent" : "border border-white/15 text-white hover:bg-white/5"
          }`}
        >
          {reminded ? <Check className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          {reminded ? "We'll remind you" : "Remind Me"}
        </button>
        {denied && (
          <p className="text-[11px] text-white/40 text-center mt-2">Blocked — enable notifications in your browser settings.</p>
        )}
      </Link>
    </div>
  );
}
