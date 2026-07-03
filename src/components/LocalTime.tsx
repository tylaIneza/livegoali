"use client";

import { isToday, isTomorrow, isYesterday } from "date-fns";

interface LocalTimeProps {
  iso: string | Date;
  /** "time" = "15:30", "full" = "Today, 15:30" / "Mon, 07 Jul • 15:30", "date" = "Mon, 07 Jul" */
  format?: "time" | "full" | "date";
  className?: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function localTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
}

export function LocalTime({ iso, format = "time", className }: LocalTimeProps) {
  const d = new Date(iso);

  let text: string;
  if (format === "time") {
    text = localTime(d);
  } else if (format === "date") {
    text = localDate(d);
  } else {
    const time = localTime(d);
    if (isToday(d)) text = `Today, ${time}`;
    else if (isTomorrow(d)) text = `Tomorrow, ${time}`;
    else if (isYesterday(d)) text = `Yesterday, ${time}`;
    else text = `${localDate(d)} • ${time}`;
  }

  return <span className={className}>{text}</span>;
}
