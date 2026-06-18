import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMatchDate(date: Date | string): string {
  const d = new Date(date);
  if (isToday(d)) return `Today, ${format(d, "HH:mm")}`;
  if (isTomorrow(d)) return `Tomorrow, ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, "HH:mm")}`;
  return format(d, "EEE, dd MMM • HH:mm");
}

export function formatTimeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatMatchMinute(minute: number): string {
  if (minute > 90) return `90+${minute - 90}'`;
  if (minute > 45 && minute <= 45) return `45+${minute - 45}'`;
  return `${minute}'`;
}

export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function getMatchStatusColor(status: string): string {
  switch (status) {
    case "LIVE": return "text-green-400";
    case "HALFTIME": return "text-yellow-400";
    case "FINISHED": return "text-gray-400";
    case "SCHEDULED": return "text-blue-400";
    case "POSTPONED": return "text-orange-400";
    case "CANCELLED": return "text-red-400";
    default: return "text-gray-400";
  }
}

export function getPredictionColor(prob: number): string {
  if (prob >= 60) return "text-[#00FF84]";
  if (prob >= 40) return "text-yellow-400";
  return "text-red-400";
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}
