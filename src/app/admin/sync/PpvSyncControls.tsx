"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";

type Result = {
  ok?: boolean;
  imported?: number;
  updated?: number;
  finished?: number;
  skippedAlwaysLive?: number;
  skippedCategory?: number;
  skippedInvalid?: number;
  errors?: number;
  error?: string;
} | null;

export function PpvSyncControls() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>(null);

  async function trigger() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/sync-ppv", { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Request failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#0B0F14] rounded-xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw className="w-4 h-4 text-[#00FF84]" />
        <span className="text-sm font-semibold text-white">PPV Streams</span>
      </div>
      <p className="text-xs text-white/70 mb-4">
        Fetch football, basketball &amp; volleyball streams — imported matches wait in
        &quot;Pending approval&quot; on the Matches page until an admin publishes them.
      </p>
      <button
        onClick={trigger}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00FF84]/10 border border-[#00FF84]/20 text-[#00FF84] text-sm font-semibold hover:bg-[#00FF84]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Syncing..." : "Sync PPV Streams"}
      </button>
      {result && (
        <div className={`mt-3 flex items-start gap-2 text-xs ${result.ok ? "text-[#00FF84]" : "text-red-400"}`}>
          {result.ok ? <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
          {result.ok
            ? `${result.imported} new, ${result.updated} updated, ${result.finished} finished (skipped: ${result.skippedAlwaysLive} always-live, ${result.skippedCategory} other sports)`
            : result.error}
        </div>
      )}
    </div>
  );
}
