import { prisma } from "@/lib/prisma";
import { fetchLive, fetchByDate } from "@/lib/sportmonks";
import type { SMFixture, SMTeam, SMLeague, SMScore, SMPeriod } from "@/lib/sportmonks";
import type { MatchStatus } from "@prisma/client";

// ─── helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getSeason(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return m >= 7
    ? `${y}/${String(y + 1).slice(2)}`
    : `${y - 1}/${String(y).slice(2)}`;
}

const LIVE_STATES = new Set([2, 4, 7, 8, 9, 10]);
const HT_STATE = 3;
const FINISHED_STATES = new Set([5, 6, 11]);
const POSTPONED_STATE = 12;
const CANCELLED_STATES = new Set([13, 14, 15, 17]);

function mapStatus(stateId: number): MatchStatus {
  if (LIVE_STATES.has(stateId)) return "LIVE";
  if (stateId === HT_STATE) return "HALFTIME";
  if (FINISHED_STATES.has(stateId)) return "FINISHED";
  if (stateId === POSTPONED_STATE) return "POSTPONED";
  if (CANCELLED_STATES.has(stateId)) return "CANCELLED";
  return "SCHEDULED";
}

function extractScore(scores: SMScore[], location: "home" | "away"): number {
  const s = scores.find(
    (x) => x.description === "CURRENT" && x.score.participant === location
  );
  return s?.score.goals ?? 0;
}

function extractHalfScore(scores: SMScore[], location: "home" | "away"): number | null {
  const s = scores.find(
    (x) => x.description === "1ST_HALF" && x.score.participant === location
  );
  return s ? s.score.goals : null;
}

function extractMinute(periods: SMPeriod[]): number | null {
  const active = periods.find((p) => p.started && !p.ended);
  return active?.minutes ?? null;
}

// ─── upsert helpers ───────────────────────────────────────────────────────────

async function upsertLeague(sm: SMLeague) {
  const slug = slugify(sm.name);
  const country = sm.country?.name ?? "International";
  const season = new Date().getFullYear() + "/" + String(new Date().getFullYear() + 1).slice(2);

  return prisma.league.upsert({
    where: { slug },
    create: {
      name: sm.name,
      slug,
      country,
      logo: sm.image_path ?? null,
      season,
      isActive: true,
    },
    update: {
      name: sm.name,
      logo: sm.image_path ?? null,
      country,
    },
  });
}

async function upsertTeam(sm: SMTeam, leagueId: string) {
  const slug = slugify(sm.name);

  return prisma.team.upsert({
    where: { slug },
    create: {
      name: sm.name,
      slug,
      shortName: sm.short_code ?? null,
      logo: sm.image_path ?? null,
      founded: sm.founded ?? null,
      leagueId,
    },
    update: {
      name: sm.name,
      shortName: sm.short_code ?? null,
      logo: sm.image_path ?? null,
    },
  });
}

// ─── main sync ────────────────────────────────────────────────────────────────

async function syncFixtures(fixtures: SMFixture[]): Promise<number> {
  let count = 0;

  for (const fixture of fixtures) {
    try {
      if (!fixture.league) continue;

      const home = fixture.participants.find((p) => p.meta?.location === "home");
      const away = fixture.participants.find((p) => p.meta?.location === "away");
      if (!home || !away) continue;

      const league = await upsertLeague(fixture.league);
      const homeTeam = await upsertTeam(home, league.id);
      const awayTeam = await upsertTeam(away, league.id);

      const status = mapStatus(fixture.state_id);
      const homeScore = extractScore(fixture.scores, "home");
      const awayScore = extractScore(fixture.scores, "away");
      const homeHalf = extractHalfScore(fixture.scores, "home");
      const awayHalf = extractHalfScore(fixture.scores, "away");
      const matchMinute = extractMinute(fixture.periods);

      const dateStr = fixture.starting_at.slice(0, 10).replace(/-/g, "");
      const slug = `${homeTeam.slug}-vs-${awayTeam.slug}-${dateStr}`;

      const isLive = status === "LIVE" || status === "HALFTIME";
      const isFinished = status === "FINISHED";

      await prisma.match.upsert({
        where: { slug },
        create: {
          slug,
          leagueId: league.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          scheduledAt: new Date(fixture.starting_at),
          status,
          homeScore,
          awayScore,
          homeHalfScore: homeHalf,
          awayHalfScore: awayHalf,
          matchMinute,
          round: fixture.round?.name ?? null,
          season: getSeason(fixture.starting_at),
          startedAt: isLive ? new Date() : undefined,
          endedAt: isFinished ? new Date() : undefined,
        },
        update: {
          status,
          homeScore,
          awayScore,
          homeHalfScore: homeHalf,
          awayHalfScore: awayHalf,
          matchMinute,
          ...(isFinished ? { endedAt: new Date() } : {}),
        },
      });

      count++;
    } catch (err) {
      console.error(`[FootballSync] Failed fixture ${fixture.id}:`, err);
    }
  }

  return count;
}

// ─── public sync functions ────────────────────────────────────────────────────

export async function runLiveSync(): Promise<{ synced: number }> {
  const fixtures = await fetchLive();
  const synced = await syncFixtures(fixtures);
  await setSyncStatus("live", synced);
  return { synced };
}

export async function runDailySync(): Promise<{ synced: number; days: number }> {
  let total = 0;
  const days = 7;

  for (let i = -1; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    try {
      const fixtures = await fetchByDate(date);
      const count = await syncFixtures(fixtures);
      total += count;
    } catch (err) {
      console.error(`[FootballSync] Failed date ${date}:`, err);
    }
    // small delay to respect rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  await setSyncStatus("daily", total);
  return { synced: total, days };
}

// ─── sync status helpers ──────────────────────────────────────────────────────

async function setSyncStatus(type: string, count: number) {
  const now = new Date().toISOString();
  await prisma.settings.upsert({
    where: { key: `sync_${type}_last` },
    create: { key: `sync_${type}_last`, value: `${now}|${count}` },
    update: { value: `${now}|${count}` },
  }).catch(() => {});
}

export async function getSyncStatus() {
  const [live, daily] = await Promise.all([
    prisma.settings.findUnique({ where: { key: "sync_live_last" } }),
    prisma.settings.findUnique({ where: { key: "sync_daily_last" } }),
  ]).catch(() => [null, null]);

  const parse = (val: string | null | undefined) => {
    if (!val) return { time: null, count: 0 };
    const [time, count] = val.split("|");
    return { time, count: parseInt(count) || 0 };
  };

  return {
    live: parse(live?.value),
    daily: parse(daily?.value),
  };
}
