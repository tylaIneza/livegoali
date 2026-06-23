import { runLiveSync, runDailySync } from "@/lib/sync-football";

const LIVE_INTERVAL_MS = 90_000;  // 90 seconds — ~960 calls/day
const DAILY_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

let started = false;

async function liveTick() {
  try {
    const { synced } = await runLiveSync();
    if (synced > 0) {
      console.log(`[FootballSync] Live sync: ${synced} fixture(s) updated`);
    }
  } catch (err) {
    console.error("[FootballSync] Live sync error:", err);
  }
}

async function dailyTick() {
  try {
    const { synced, days } = await runDailySync();
    console.log(`[FootballSync] Daily sync: ${synced} fixtures over ${days} days`);
  } catch (err) {
    console.error("[FootballSync] Daily sync error:", err);
  }
}

export function startFootballSyncWorker() {
  if (started) return;
  started = true;

  if (!process.env.SPORTMONKS_API_TOKEN) {
    console.warn("[FootballSync] SPORTMONKS_API_TOKEN not set — sync disabled");
    return;
  }

  console.log("[FootballSync] Football sync worker started");

  // Run both immediately on startup
  dailyTick();
  liveTick();

  // Then run on intervals
  setInterval(liveTick, LIVE_INTERVAL_MS);
  setInterval(dailyTick, DAILY_INTERVAL_MS);
}
