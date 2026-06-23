"use client";

import { useState } from "react";
import { RefreshCw, Radio, Calendar, CheckCircle, XCircle } from "lucide-react";

type Result = { ok?: boolean; synced?: number; days?: number; error?: string } | null;

export function SyncControls() {
  const [liveLoading, setLiveLoading] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [liveResult, setLiveResult] = useState<Result>(null);
  const [dailyResult, setDailyResult] = useState<Result>(null);

  async function trigger(type: "live" | "daily") {
    const setLoading = type === "live" ? setLiveLoading : setDailyLoading;
    const setResult = type === "live" ? setLiveResult : setDailyResult;

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Request failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
      <h2 className="text-sm font-semibold text-white mb-5">Manual Sync</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Live Sync */}
        <div className="bg-[#0B0F14] rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-white">Live Scores Now</span>
          </div>
          <p className="text-xs text-white/70 mb-4">Fetch all inplay matches and update scores instantly</p>
          <button
            onClick={() => trigger("live")}
            disabled={liveLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${liveLoading ? "animate-spin" : ""}`} />
            {liveLoading ? "Syncing..." : "Sync Live Scores"}
          </button>
          {liveResult && (
            <div className={`mt-3 flex items-center gap-2 text-xs ${liveResult.ok ? "text-[#00FF84]" : "text-red-400"}`}>
              {liveResult.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {liveResult.ok ? `${liveResult.synced} fixture(s) updated` : liveResult.error}
            </div>
          )}
        </div>

        {/* Daily Sync */}
        <div className="bg-[#0B0F14] rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Fixtures & Teams</span>
          </div>
          <p className="text-xs text-white/70 mb-4">Import fixtures for the next 7 days + auto-create teams and leagues</p>
          <button
            onClick={() => trigger("daily")}
            disabled={dailyLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${dailyLoading ? "animate-spin" : ""}`} />
            {dailyLoading ? "Syncing... (may take 30s)" : "Sync Fixtures"}
          </button>
          {dailyResult && (
            <div className={`mt-3 flex items-center gap-2 text-xs ${dailyResult.ok ? "text-[#00FF84]" : "text-red-400"}`}>
              {dailyResult.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {dailyResult.ok ? `${dailyResult.synced} fixtures over ${dailyResult.days} days` : dailyResult.error}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
