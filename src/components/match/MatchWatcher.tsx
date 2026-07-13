"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function MatchWatcher({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [removed, setRemoved] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`/api/matches/${matchId}`, { cache: "no-store" });
        if (res.status === 404) setRemoved(true);
      } catch {}
    };

    check();
    const interval = setInterval(check, 300_000); // 5 min — was 15s (20x fewer DB queries)
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    if (!removed) return;
    if (countdown <= 0) { router.replace("/"); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [removed, countdown, router]);

  if (!removed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="text-center px-6 max-w-sm">
        <div className="w-16 h-16 rounded-full bg-danger/15 border border-danger/30 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">📺</span>
        </div>
        <h2 className="text-xl font-black text-white mb-2">Stream Ended</h2>
        <p className="text-white/75 text-sm mb-6">
          This match has been removed. You'll be redirected to the homepage in{" "}
          <span className="text-white font-bold">{countdown}</span> second{countdown !== 1 ? "s" : ""}.
        </p>
        <button
          onClick={() => router.replace("/")}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          Go to Homepage
        </button>
      </div>
    </div>
  );
}
