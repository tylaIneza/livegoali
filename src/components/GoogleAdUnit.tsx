"use client";

import { useEffect, useRef } from "react";

interface Props {
  /** Ad unit slot ID from AdSense > Ads > By ad unit */
  slot: string;
  className?: string;
  style?: React.CSSProperties;
  format?: string;
  fullWidthResponsive?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export function GoogleAdUnit({
  slot,
  className = "",
  style = { display: "block" },
  format = "auto",
  fullWidthResponsive = true,
}: Props) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current || !adsenseClientId) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // adsbygoogle script not ready yet
    }
  }, []);

  if (!adsenseClientId) return null;

  return (
    <ins
      ref={insRef}
      className={`adsbygoogle ${className}`}
      style={style}
      data-ad-client={adsenseClientId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={fullWidthResponsive}
    />
  );
}
