// ── Livescore live-score sync ───────────────────────────────────────────────
// Polls the unofficial Livescore endpoint (see livescoreService.ts for the
// disclaimer) and credits goals to matches we already know about. This does
// NOT create teams/leagues/matches — it only updates the score/status of
// existing Match rows, resolved via admin-curated TeamMapping records.
import type { Server } from "socket.io";
import { prisma } from "@/lib/prisma";
import { fetchMatches, type LivescoreMatch } from "@/lib/livescoreService";
import type { MatchStatus } from "@prisma/client";

const LIVE_STATUS_CODES = new Set(["1H", "2H", "ET", "PEN_LIVE", "LIVE"]);
const HALFTIME_STATUS_CODES = new Set(["HT"]);
const FINISHED_STATUS_CODES = new Set(["FT", "AET", "PEN", "AP"]);
const POSTPONED_STATUS_CODES = new Set(["POSTP"]);
const CANCELLED_STATUS_CODES = new Set(["CANC", "ABAN", "SUSP"]);

// Best-effort mapping only — Livescore's status codes aren't documented, so
// anything unrecognized is left alone rather than guessed at.
function mapStatus(code: string): MatchStatus | null {
  if (LIVE_STATUS_CODES.has(code)) return "LIVE";
  if (HALFTIME_STATUS_CODES.has(code)) return "HALFTIME";
  if (FINISHED_STATUS_CODES.has(code)) return "FINISHED";
  if (POSTPONED_STATUS_CODES.has(code)) return "POSTPONED";
  if (CANCELLED_STATUS_CODES.has(code)) return "CANCELLED";
  return null;
}

function todayParts(): { date: number; month: number; year: number } {
  const now = new Date();
  return { date: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() };
}

async function resolveInternalMatch(homeTeamId: string, awayTeamId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.match.findFirst({
    where: {
      homeTeamId,
      awayTeamId,
      scheduledAt: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ["FINISHED", "CANCELLED"] },
    },
    select: { id: true, homeScore: true, awayScore: true, status: true },
  });
}

async function processMatch(lm: LivescoreMatch, io: Server) {
  const [homeMapping, awayMapping] = await Promise.all([
    prisma.teamMapping.findUnique({ where: { livescoreId: lm.homeId } }),
    prisma.teamMapping.findUnique({ where: { livescoreId: lm.awayId } }),
  ]);

  // Unmapped teams are expected — most teams won't be mapped until an admin
  // adds them via /admin/team-mappings. Nothing to do yet.
  if (!homeMapping || !awayMapping) return;

  const internalMatch = await resolveInternalMatch(homeMapping.teamId, awayMapping.teamId);

  const snapshot = await prisma.matchScoreSnapshot.findUnique({ where: { livescoreId: lm.matchId } });
  const scoreChanged = !snapshot || snapshot.homeScore !== lm.homeScore || snapshot.awayScore !== lm.awayScore;

  if (scoreChanged && internalMatch) {
    await updateMatchScore(internalMatch.id, lm.homeScore, lm.awayScore, io);
  }

  const mappedStatus = mapStatus(lm.status);
  if (mappedStatus && internalMatch && internalMatch.status !== mappedStatus) {
    await prisma.match.update({ where: { id: internalMatch.id }, data: { status: mappedStatus } });
  }

  await prisma.matchScoreSnapshot.upsert({
    where: { livescoreId: lm.matchId },
    create: {
      livescoreId: lm.matchId,
      matchId: internalMatch?.id ?? null,
      homeScore: lm.homeScore,
      awayScore: lm.awayScore,
      status: lm.status,
    },
    update: {
      matchId: internalMatch?.id ?? null,
      homeScore: lm.homeScore,
      awayScore: lm.awayScore,
      status: lm.status,
    },
  });
}

// "creditGoal" from the original spec, reinterpreted: Team has no goal
// counter field, so this updates the match's live score directly — the
// field that actually drives the live score UI — and broadcasts it the
// same way the existing client-emitted "score-update" socket event does.
async function updateMatchScore(matchId: string, homeScore: number, awayScore: number, io: Server) {
  const match = await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore },
    select: { id: true, status: true, matchMinute: true },
  });

  io.to(`match-${matchId}`).emit("score-update", {
    matchId,
    homeScore,
    awayScore,
    matchMinute: match.matchMinute,
    status: match.status,
  });
  io.to("global").emit("match-updated", { matchId });
}

export async function runLiveScoreSync(io: Server): Promise<{ processed: number }> {
  const liveCount = await prisma.match.count({ where: { status: { in: ["LIVE", "HALFTIME"] } } });
  if (liveCount === 0) return { processed: 0 };

  const { date, month, year } = todayParts();
  const matches = await fetchMatches(date, month, year);

  let processed = 0;
  for (const lm of matches) {
    try {
      await processMatch(lm, io);
      processed++;
    } catch (err) {
      console.error(`[livescore] Failed match ${lm.matchId}:`, err);
    }
  }

  return { processed };
}
