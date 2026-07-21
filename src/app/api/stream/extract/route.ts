import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet, acquireLock, releaseLock } from "@/lib/redis";
import { assertSafeExternalUrl } from "@/lib/url-safety";

const RESULT_TTL = 300; // seconds — how long a resolved stream URL stays cached
const NEGATIVE_TTL = 30; // seconds — how long a failed extraction is cached, to avoid hammering broken pages
const LOCK_TTL = 8; // seconds — must cover the fetch timeout below
const WAIT_FOR_LOCK_MS = 6000; // how long a waiter polls before doing the fetch itself
const FETCH_TIMEOUT_MS = 4000;

type ExtractResult =
  | { url: string; alternatives: string[]; type: "hls" | "dash"; source_page: string }
  | { error: string };

function cacheKey(url: string) {
  return `stream:extract:${url}`;
}

function lockKey(url: string) {
  return `stream:extract:lock:${url}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Patterns to find HLS/stream URLs inside webpage source
const STREAM_PATTERNS = [
  // Direct .m3u8 in quotes or src attributes
  /["'`](https?:\/\/[^"'`\s]+\.m3u8[^"'`\s]*)/gi,
  // src= containing m3u8
  /src=["'](https?:\/\/[^"']+\.m3u8[^"']*)/gi,
  // file: or source: JSON-style
  /["'](?:file|source|src|url|stream|hls)["']\s*:\s*["'`](https?:\/\/[^"'`\s]+\.m3u8[^"'`\s]*)/gi,
  // jwplayer / videojs / hls.js setup
  /setup\(\s*\{[^}]*["']file["']\s*:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)/gi,
  // player.src({ src: "..." })
  /\.src\(\s*\{[^}]*["']src["']\s*:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)/gi,
  // DASH manifests
  /["'`](https?:\/\/[^"'`\s]+\.mpd[^"'`\s]*)/gi,
];

const BLOCKED_DOMAINS = [
  "ads.", "doubleclick", "googlesyndication", "analytics", "tracker",
  "pixel.", "beacon.", "metrics.",
];

// Caps how much of the page we scan, and lets us stop after the first
// (most specific) pattern already found something — ad-laden embed pages
// can run several hundred KB, and all 6 regexes running to completion over
// the full document blocks Node's single JS thread for the duration,
// stalling every other concurrent request on that worker in the meantime.
const MAX_SCAN_CHARS = 200_000; // embed players load their src near the top of the document

function extractStreamUrls(html: string): string[] {
  const scoped = html.length > MAX_SCAN_CHARS ? html.slice(0, MAX_SCAN_CHARS) : html;
  const found = new Set<string>();

  for (const pattern of STREAM_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(scoped)) !== null) {
      const url = match[1];
      if (!url) continue;
      // Skip ad/tracker URLs
      const isBlocked = BLOCKED_DOMAINS.some((d) => url.includes(d));
      if (!isBlocked) found.add(url);
    }
    // A direct .m3u8 match from the first, most specific pattern is already
    // good enough to serve — skip the remaining, more speculative patterns.
    if (found.size > 0 && pattern === STREAM_PATTERNS[0]) break;
  }

  // Sort: prefer longer (more specific) URLs, prefer https
  return [...found].sort((a, b) => {
    if (a.startsWith("https") && !b.startsWith("https")) return -1;
    return b.length - a.length;
  });
}

async function performExtraction(targetUrl: string): Promise<ExtractResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        Referer: new URL(targetUrl).origin,
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { error: `Page returned ${response.status}` };
    }

    const html = await response.text();
    const urls = extractStreamUrls(html);

    if (urls.length === 0) {
      return { error: "No stream URL found on this page" };
    }

    return {
      url: urls[0],
      alternatives: urls.slice(1, 5),
      type: urls[0].includes(".mpd") ? "dash" : "hls",
      source_page: targetUrl,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: `Failed to fetch page: ${message}` };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "url parameter required" }, { status: 400 });
  }

  // If it's already a direct stream, return it immediately — no scraping needed.
  // (Not a server-side fetch, so no SSRF exposure — the player fetches it client-side.)
  const lower = targetUrl.toLowerCase();
  if (lower.includes(".m3u8") || lower.includes(".mpd")) {
    return NextResponse.json({ url: targetUrl, type: "direct" });
  }

  // Everything past this point fetches targetUrl server-side — block internal/
  // private network targets so this endpoint can't be used as an SSRF proxy.
  try {
    await assertSafeExternalUrl(targetUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "URL not allowed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const key = cacheKey(targetUrl);

  // Fast path: already resolved (or already known-broken) — no scrape, no lock.
  const cached = await cacheGet<ExtractResult>(key);
  if (cached) {
    return NextResponse.json(cached, { status: "error" in cached ? 502 : 200 });
  }

  // Only one request per source URL should actually scrape it at a time.
  const gotLock = await acquireLock(lockKey(targetUrl), LOCK_TTL);

  if (gotLock) {
    try {
      const result = await performExtraction(targetUrl);
      await cacheSet(key, result, "error" in result ? NEGATIVE_TTL : RESULT_TTL);
      return NextResponse.json(result, { status: "error" in result ? 502 : 200 });
    } finally {
      await releaseLock(lockKey(targetUrl));
    }
  }

  // Someone else is already scraping this URL — wait briefly for their result
  // instead of duplicating the work.
  const deadline = Date.now() + WAIT_FOR_LOCK_MS;
  while (Date.now() < deadline) {
    await sleep(300);
    const result = await cacheGet<ExtractResult>(key);
    if (result) {
      return NextResponse.json(result, { status: "error" in result ? 502 : 200 });
    }
  }

  // The other request is taking unusually long — fall back to doing it ourselves
  // rather than making the client wait indefinitely.
  const result = await performExtraction(targetUrl);
  await cacheSet(key, result, "error" in result ? NEGATIVE_TTL : RESULT_TTL);
  return NextResponse.json(result, { status: "error" in result ? 502 : 200 });
}
