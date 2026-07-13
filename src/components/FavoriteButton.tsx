"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Star } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  teamId?: string;
  leagueId?: string;
  initialFavorited: boolean;
  className?: string;
  onRemoved?: () => void;
}

export function FavoriteButton({ teamId, leagueId, initialFavorited, className, onRemoved }: FavoriteButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    if (pending) return;

    const next = !favorited;
    setFavorited(next);
    setPending(true);
    try {
      const res = await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, leagueId }),
      });
      if (!res.ok) throw new Error();
      toast.success(next ? "Added to favorites" : "Removed from favorites");
      if (!next) onRemoved?.();
    } catch {
      setFavorited(!next);
      toast.error("Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorited}
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded-xl border transition-all active:scale-95",
        favorited
          ? "border-warning/40 bg-warning/15 text-warning hover:bg-warning/20"
          : "border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10",
        className
      )}
    >
      <Star className={cn("w-4 h-4", favorited && "fill-warning")} />
    </button>
  );
}
