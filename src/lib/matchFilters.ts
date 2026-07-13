import type { Prisma } from "@prisma/client";

export type StatusFilter = "live" | "upcoming" | "finished";

export function statusFilterToWhere(status?: string): Prisma.MatchWhereInput["status"] | undefined {
  if (status === "live") return { in: ["LIVE", "HALFTIME"] };
  if (status === "upcoming") return "SCHEDULED";
  if (status === "finished") return "FINISHED";
  return undefined;
}

export function parseDateParam(date?: string): Date {
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const d = new Date(`${date}T00:00:00`);
    if (!isNaN(d.getTime())) return d;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}
