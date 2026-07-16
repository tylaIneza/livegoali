import { cacheGet, cacheSet, acquireLock, releaseLock } from "@/lib/redis";
import { syncFootballMatchesToDb } from "@/lib/ppv-football-sync";

const DEFAULT_BASE = "https://api.ppv.st/api";

function primaryBase(): string {
  return process.env.PPV_API_URL || DEFAULT_BASE;
}

interface PPVStream {
  id: number | string;
  name: string;
  tag?: string | null;
  poster?: string | null;
  uri_name: string;
  starts_at: number | string;
  ends_at?: number | string | null;
  always_live?: boolean;
  category_name?: string | null;
  iframe: string;
  allowpaststreams?: boolean;
}

interface PPVCategoryGroup {
  category: string;
  streams: PPVStream[];
}

interface PingResponse {
  domains?: string[];
}

async function ppvGet<T>(base: string, path: string): Promise<T> {
  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PPV ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function fetchBackupDomains(): Promise<string[]> {
  try {
    const data = await ppvGet<PingResponse>(primaryBase(), "/ping");
    return (data.domains ?? []).filter((d) => typeof d === "string" && d.length > 0);
  } catch {
    return [];
  }
}

// Tries the configured domain first, then whatever backup domains /ping
// advertises — the provider expects clients to need failover.
async function fetchStreams(): Promise<PPVCategoryGroup[]> {
  const primary = primaryBase();
  const backups = await fetchBackupDomains();
  const candidates = [primary, ...backups.filter((d) => d !== primary)];

  let lastErr: unknown;
  for (const base of candidates) {
    try {
      const data = await ppvGet<{ streams: PPVCategoryGroup[] }>(base, "/streams");
      if (!Array.isArray(data.streams)) throw new Error("Malformed /streams response: missing streams array");
      return data.streams;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("PPV /streams failed on all known domains");
}

const FOOTBALL_CATEGORY_NAMES = new Set(["football", "soccer"]);

// Provider timestamps have been observed as unix seconds; defensively also
// accept ms and ISO strings rather than trusting a single shape.
function parseTimestamp(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    return value < 1e12 ? value * 1000 : value;
  }
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed);
    return n < 1e12 ? n * 1000 : n;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function isValidRawStream(s: PPVStream): boolean {
  return (
    (typeof s.id === "string" || typeof s.id === "number") &&
    typeof s.name === "string" && s.name.length > 0 &&
    typeof s.uri_name === "string" && s.uri_name.length > 0 &&
    typeof s.iframe === "string" && s.iframe.length > 0
  );
}

export interface NormalizedPPVStream {
  id: string;
  name: string;
  tag: string | null;
  poster: string | null;
  uri_name: string;
  starts_at: number | null;
  ends_at: number | null;
  always_live: boolean;
  category_name: string;
  iframe: string;
  allowpaststreams: boolean;
}

function normalizeStream(raw: PPVStream, fallbackCategory: string): NormalizedPPVStream | null {
  if (!isValidRawStream(raw)) return null;
  return {
    id: String(raw.id),
    name: raw.name,
    tag: raw.tag ?? null,
    poster: raw.poster ?? null,
    uri_name: raw.uri_name,
    starts_at: parseTimestamp(raw.starts_at),
    ends_at: parseTimestamp(raw.ends_at),
    always_live: !!raw.always_live,
    category_name: raw.category_name ?? fallbackCategory,
    iframe: raw.iframe,
    allowpaststreams: !!raw.allowpaststreams,
  };
}

export type PPVStreamStatus = "LIVE" | "UPCOMING" | "ENDED";

export function getStreamStatus(stream: NormalizedPPVStream, now: number = Date.now()): PPVStreamStatus {
  if (stream.always_live) return "LIVE";
  if (stream.ends_at !== null && now >= stream.ends_at) return "ENDED";
  if (stream.starts_at !== null && now < stream.starts_at) return "UPCOMING";
  return "LIVE";
}

async function fetchFootballStreams(): Promise<NormalizedPPVStream[]> {
  const groups = await fetchStreams();
  const byUriName = new Map<string, NormalizedPPVStream>();

  for (const group of groups) {
    if (!FOOTBALL_CATEGORY_NAMES.has((group.category ?? "").trim().toLowerCase())) continue;
    for (const raw of group.streams ?? []) {
      const normalized = normalizeStream(raw, group.category);
      if (normalized) byUriName.set(normalized.uri_name, normalized);
    }
  }

  return [...byUriName.values()].sort((a, b) => (a.starts_at ?? 0) - (b.starts_at ?? 0));
}

const FRESH_KEY = "ppv:football:v1";
const STALE_KEY = "ppv:football:stale:v1";
const LOCK_KEY = "ppv:football:lock";
const FRESH_TTL = 60; // seconds
const STALE_TTL = 21600; // 6h — served only if a live fetch fails
const LOCK_TTL = 15;
const WAIT_MS = 4000;

export interface FootballStreamsResult {
  matches: NormalizedPPVStream[];
  stale: boolean;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAndCache(): Promise<NormalizedPPVStream[]> {
  const matches = await fetchFootballStreams();
  await cacheSet(FRESH_KEY, matches, FRESH_TTL);
  await cacheSet(STALE_KEY, matches, STALE_TTL);

  // Persist into the Match table too, so fixtures/live/home (all DB-driven)
  // pick these up, not just /football. Piggybacks on this cache refresh
  // instead of a separate worker — runs at most once per FRESH_TTL window. A
  // DB hiccup here must never break the public-facing football feed.
  try {
    await syncFootballMatchesToDb(matches);
  } catch (err) {
    console.error("[ppv-football] DB sync failed:", err);
  }

  return matches;
}

// 60s fresh cache with a stampede lock (mirrors src/app/api/stream/extract),
// plus a long-lived stale fallback so a PPV outage degrades to "last known
// list" instead of an error page.
export async function getFootballStreams(): Promise<FootballStreamsResult> {
  const fresh = await cacheGet<NormalizedPPVStream[]>(FRESH_KEY);
  if (fresh) return { matches: fresh, stale: false };

  const gotLock = await acquireLock(LOCK_KEY, LOCK_TTL);
  if (gotLock) {
    try {
      const matches = await fetchAndCache();
      return { matches, stale: false };
    } catch {
      const stale = await cacheGet<NormalizedPPVStream[]>(STALE_KEY);
      if (stale) return { matches: stale, stale: true };
      throw new Error("PPV football streams unavailable and no cached data to fall back to");
    } finally {
      await releaseLock(LOCK_KEY);
    }
  }

  // Someone else is already fetching — wait briefly for their result instead
  // of duplicating the work.
  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    await sleep(300);
    const result = await cacheGet<NormalizedPPVStream[]>(FRESH_KEY);
    if (result) return { matches: result, stale: false };
  }

  // The other request is taking unusually long — fall back to doing it
  // ourselves rather than making the caller wait indefinitely.
  try {
    const matches = await fetchAndCache();
    return { matches, stale: false };
  } catch {
    const stale = await cacheGet<NormalizedPPVStream[]>(STALE_KEY);
    if (stale) return { matches: stale, stale: true };
    throw new Error("PPV football streams unavailable and no cached data to fall back to");
  }
}
