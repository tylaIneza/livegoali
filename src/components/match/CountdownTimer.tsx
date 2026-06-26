"use client";

import { useState, useEffect } from "react";

function compute(scheduledAt: string | Date): string {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return "Starting soon";
  const totalSec = Math.floor(diff / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  if (d > 0) return `${d}d ${hh}:${mm}:${ss}`;
  return `${hh}:${mm}:${ss}`;
}

export function CountdownTimer({
  scheduledAt,
  className,
}: {
  scheduledAt: string | Date;
  className?: string;
}) {
  const [label, setLabel] = useState(() => compute(scheduledAt));

  useEffect(() => {
    setLabel(compute(scheduledAt));
    const id = setInterval(() => setLabel(compute(scheduledAt)), 1000);
    return () => clearInterval(id);
  }, [scheduledAt]);

  return <span className={className}>{label}</span>;
}
