import { runPpvSync } from "@/lib/sync-ppv";

const SYNC_INTERVAL_MS = 5 * 60_000; // 5 minutes — a stream listing, not a live score feed

let started = false;

async function tick() {
  try {
    const r = await runPpvSync();
    if (r.imported > 0 || r.updated > 0 || r.finished > 0) {
      console.log(
        `[PPVSync] +${r.imported} new, ${r.updated} updated, ${r.finished} finished ` +
        `(skipped: ${r.skippedAlwaysLive} always-live, ${r.skippedCategory} disallowed category, ${r.skippedInvalid} invalid, ${r.errors} errors)`
      );
    }
  } catch (err) {
    console.error("[PPVSync] Sync error:", err);
  }
}

export function startPpvSyncWorker() {
  if (started) return;
  started = true;

  console.log("[PPVSync] PPV streams sync worker started");

  tick();
  setInterval(tick, SYNC_INTERVAL_MS);
}
