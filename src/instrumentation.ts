export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // startMatchAutoStatus intentionally removed — the socket server already runs
    // autoLiveMatches() every minute. Running it in every Next.js cluster worker
    // caused N duplicate status flips and flooded the DB.
    const { startFootballSyncWorker } = await import("@/lib/football-sync-worker");
    startFootballSyncWorker();
  }
}
