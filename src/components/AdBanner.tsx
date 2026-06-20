"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";

type AdPlacement = "HEADER" | "SIDEBAR" | "FOOTER" | "IN_PLAYER" | "VIDEO" | "POPUP" | "SPONSORED";

interface Ad {
  id: string;
  title: string;
  imageUrl: string | null;
  targetUrl: string;
}

interface Props {
  placement: AdPlacement;
  className?: string;
}

export function AdBanner({ placement, className = "" }: Props) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // First try placement-specific, then fall back to any active ad
    fetch(`/api/ads?placement=${placement}`)
      .then((r) => r.json())
      .then((data: Ad[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setAd(data[Math.floor(Math.random() * data.length)]);
          return;
        }
        // Fall back to any active ad
        return fetch("/api/ads")
          .then((r) => r.json())
          .then((all: Ad[]) => {
            if (Array.isArray(all) && all.length > 0) {
              setAd(all[Math.floor(Math.random() * all.length)]);
            }
          });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [placement]);

  useEffect(() => {
    if (!ad) return;
    fetch(`/api/ads/${ad.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "view" }),
    }).catch(() => {});
  }, [ad]);

  // Nothing to show
  if (!loading && !ad) return null;

  // Still fetching — render nothing (no layout shift)
  if (loading) return null;

  const handleClick = () => {
    if (!ad) return;
    fetch(`/api/ads/${ad.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "click" }),
    }).catch(() => {});
  };

  const hasImage = ad!.imageUrl && !imgError;

  return (
    <a
      href={ad!.targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`flex items-center justify-center overflow-hidden rounded-xl border border-white/8 relative group bg-[#121821] hover:border-[#00FF84]/20 transition-colors ${className}`}
      title={ad!.title}
    >
      {hasImage ? (
        <img
          src={ad!.imageUrl!}
          alt={ad!.title}
          className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex items-center gap-3 px-4 py-2 w-full justify-center">
          <Megaphone className="w-4 h-4 text-[#00FF84] shrink-0" />
          <span className="text-sm font-semibold text-white truncate">{ad!.title}</span>
          <span className="text-xs text-[#00FF84] shrink-0 underline">Learn more</span>
        </div>
      )}
      <span className="absolute top-1 right-1.5 text-[9px] text-white/40 bg-black/40 px-1.5 py-0.5 rounded font-medium pointer-events-none">
        Ad
      </span>
    </a>
  );
}
