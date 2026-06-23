export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startMatchAutoStatus } = await import("@/lib/matchAutoStatus");
    startMatchAutoStatus();

    const { startFootballSyncWorker } = await import("@/lib/football-sync-worker");
    startFootballSyncWorker();
  }
}
