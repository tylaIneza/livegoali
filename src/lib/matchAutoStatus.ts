import { prisma } from "@/lib/prisma";

const INTERVAL_MS = 60_000; // run every minute
let started = false;

async function tick() {
  try {
    const now = new Date();
    const thirtyMinFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    // SCHEDULED → LIVE: kickoff is within the next 30 minutes (or already passed)
    const activated = await prisma.match.updateMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: thirtyMinFromNow },
      },
      data: { status: "LIVE" },
    });

    if (activated.count > 0) {
      console.log(`[AutoStatus] ${activated.count} match(es) set to LIVE at ${now.toISOString()}`);
    }
  } catch (err) {
    console.error("[AutoStatus] Error updating match statuses:", err);
  }
}

export function startMatchAutoStatus() {
  if (started) return;
  started = true;
  console.log("[AutoStatus] Match auto-status checker started (runs every 60s, goes LIVE 30min before kickoff)");
  tick(); // run immediately on startup
  setInterval(tick, INTERVAL_MS);
}
