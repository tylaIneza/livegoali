import { cn } from "@/lib/utils";

interface LiveBadgeProps {
  status?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  // kept for API compatibility but no longer used for display
  startedAt?: Date | string | null;
  minute?: number | null;
}

export function LiveBadge({ status, size = "md", className }: LiveBadgeProps) {
  if (status === "HALFTIME") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 rounded-full bg-warning/20 text-warning border border-warning/30 font-bold",
        size === "sm" && "text-[10px] px-2 py-0.5",
        size === "md" && "text-xs px-2.5 py-1",
        size === "lg" && "text-sm px-3 py-1.5",
        className
      )}>
        HT
      </span>
    );
  }

  if (status !== "LIVE") return null;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full bg-danger/20 text-danger border border-danger/30 font-bold",
      size === "sm" && "text-[10px] px-2 py-0.5",
      size === "md" && "text-xs px-2.5 py-1",
      size === "lg" && "text-sm px-3 py-1.5",
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-danger live-pulse" />
      LIVE
    </span>
  );
}
