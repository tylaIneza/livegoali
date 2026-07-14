import { NextRequest } from "next/server";

// hls.js talks to the CDN directly from the browser, which sends
// Referer/Origin: https://livegoali.com — most stream CDNs hotlink-protect
// against that and silently fail. This route re-fetches manifests, keys, and
// segments server-side with the embed page's own Referer/Origin spoofed back
// on, so playback works exactly as it would embedded on the source page.

const FETCH_TIMEOUT_MS = 12000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const PASSTHROUGH_RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "etag",
  "last-modified",
];

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/,
  /^\[?::1\]?$/,
];

function isBlockedHostname(hostname: string): boolean {
  return BLOCKED_HOSTNAME_PATTERNS.some((p) => p.test(hostname));
}

function proxiedUrl(absoluteUrl: string, referer: string): string {
  return `/api/stream/proxy?url=${encodeURIComponent(absoluteUrl)}&ref=${encodeURIComponent(referer)}`;
}

// iOS Safari plays HLS via its native <video> engine, not hls.js — it never
// goes through our custom loader, so its manifest/segment/key requests would
// still leak the wrong Referer. Rewriting every URI in the playlist to route
// through this proxy fixes that path too.
function rewritePlaylist(text: string, baseUrl: string, referer: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => {
      if (line.trim() === "") return line;
      if (line.startsWith("#")) {
        if (!line.includes("URI=")) return line;
        return line.replace(/URI="([^"]+)"/g, (_m, uri) => {
          let absolute: string;
          try { absolute = new URL(uri, baseUrl).toString(); } catch { return _m; }
          return `URI="${proxiedUrl(absolute, referer)}"`;
        });
      }
      let absolute: string;
      try { absolute = new URL(line.trim(), baseUrl).toString(); } catch { return line; }
      return proxiedUrl(absolute, referer);
    })
    .join("\n");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("url");
  const ref = searchParams.get("ref");

  if (!target) {
    return new Response("url parameter required", { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return new Response("invalid url", { status: 400 });
  }

  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return new Response("invalid protocol", { status: 400 });
  }
  if (isBlockedHostname(targetUrl.hostname)) {
    return new Response("forbidden host", { status: 400 });
  }

  const referer = ref || `${targetUrl.origin}/`;
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept: "*/*",
    Referer: referer,
    Origin: targetUrl.origin,
  };
  const range = req.headers.get("range");
  if (range) headers["Range"] = range;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl.toString(), {
      headers,
      signal: controller.signal,
      redirect: "follow",
    });
  } catch {
    return new Response("upstream fetch failed", { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  const contentType = upstream.headers.get("content-type") || "";
  const looksLikePlaylist =
    targetUrl.pathname.toLowerCase().endsWith(".m3u8") ||
    contentType.includes("mpegurl");

  if (looksLikePlaylist && upstream.ok) {
    const text = await upstream.text();
    const body = text.includes("#EXTM3U")
      ? rewritePlaylist(text, targetUrl.toString(), referer)
      : text;
    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type": "application/vnd.apple.mpegurl",
        "cache-control": "public, max-age=2",
      },
    });
  }

  const respHeaders = new Headers();
  for (const h of PASSTHROUGH_RESPONSE_HEADERS) {
    const v = upstream.headers.get(h);
    if (v) respHeaders.set(h, v);
  }
  if (!respHeaders.has("cache-control")) {
    respHeaders.set("cache-control", "public, max-age=4");
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: respHeaders,
  });
}
