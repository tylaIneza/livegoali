"use client";

import { useEffect, useState } from "react";
import { Megaphone, ExternalLink } from "lucide-react";

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

  if (loading || !ad) return null;

  const handleClick = () => {
    fetch(`/api/ads/${ad.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "click" }),
    }).catch(() => {});
  };

  const hasImage = !!ad.imageUrl && !imgError;

  // Sponsored placement: inline text-only style
  if (placement === "SPONSORED") {
    return (
      <a
        href={ad.targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-[#00FF84]/15 bg-[#00FF84]/5 hover:bg-[#00FF84]/10 transition-colors group ${className}`}
      >
        <Megaphone className="w-3.5 h-3.5 text-[#00FF84] shrink-0" />
        <span className="text-xs font-medium text-white/80 group-hover:text-white truncate flex-1 transition-colors">{ad.title}</span>
        <span className="text-[10px] text-[#00FF84]/70 shrink-0">Sponsored</span>
      </a>
    );
  }

  // All other placements: image banner or text fallback
  return (
    <a
      href={ad.targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      title={ad.title}
      className={`relative flex items-center justify-center overflow-hidden rounded-xl border border-white/8 bg-[#121821] hover:border-white/15 transition-colors group ${className}`}
    >
      {hasImage ? (
        <img
          src={ad.imageUrl!}
          alt={ad.title}
          className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 w-full justify-center min-h-0">
          <Megaphone className="w-4 h-4 text-[#00FF84] shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-white truncate">{ad.title}</span>
          <span className="hidden sm:flex items-center gap-1 text-xs text-[#00FF84] shrink-0">
            <ExternalLink className="w-3 h-3" /> Visit
          </span>
        </div>
      )}

      {/* Ad label */}
      <span className="absolute top-1 right-1.5 text-[9px] text-white/40 bg-black/50 px-1.5 py-0.5 rounded font-medium pointer-events-none select-none">
        Ad
      </span>
    </a>
  );
}
