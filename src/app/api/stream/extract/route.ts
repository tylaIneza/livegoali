import { NextRequest, NextResponse } from "next/server";

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

function extractStreamUrls(html: string): string[] {
  const found = new Set<string>();

  for (const pattern of STREAM_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const url = match[1];
      if (!url) continue;
      // Skip ad/tracker URLs
      const isBlocked = BLOCKED_DOMAINS.some((d) => url.includes(d));
      if (!isBlocked) found.add(url);
    }
  }

  // Sort: prefer longer (more specific) URLs, prefer https
  return [...found].sort((a, b) => {
    if (a.startsWith("https") && !b.startsWith("https")) return -1;
    return b.length - a.length;
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "url parameter required" }, { status: 400 });
  }

  // If it's already a direct stream, return it immediately
  const lower = targetUrl.toLowerCase();
  if (lower.includes(".m3u8") || lower.includes(".mpd")) {
    return NextResponse.json({ url: targetUrl, type: "direct" });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

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
      return NextResponse.json(
        { error: `Page returned ${response.status}` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const urls = extractStreamUrls(html);

    if (urls.length === 0) {
      return NextResponse.json(
        { error: "No stream URL found on this page", html_length: html.length },
        { status: 404 }
      );
    }

    return NextResponse.json({
      url: urls[0],
      alternatives: urls.slice(1, 5),
      type: urls[0].includes(".mpd") ? "dash" : "hls",
      source_page: targetUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch page: ${message}` },
      { status: 502 }
    );
  }
}
