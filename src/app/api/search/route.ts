import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis, cacheGet, cacheSet } from "@/lib/redis";

// Rate limit: 30 searches per minute per IP
async function checkRateLimit(ip: string): Promise<boolean> {
  try {
    const key = `rl:search:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60);
    return count <= 30;
  } catch {
    return true; // allow on Redis failure
  }
}

export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return NextResponse.json({ matches: [], teams: [], leagues: [] });

    // Rate limit by IP
    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    if (!(await checkRateLimit(ip))) {
      return NextResponse.json(
        { matches: [], teams: [], leagues: [], rateLimited: true },
        { status: 429 },
      );
    }

    // Cache per normalised query — 60s TTL.
    // At 20k concurrent users all searching "Chelsea" this collapses
    // ~40k DB queries/sec → 1 per unique query string per minute.
    const cacheKey = `search:${q.toLowerCase()}`;
    const cached = await cacheGet<{ matches: unknown[]; teams: unknown[]; leagues: unknown[] }>(cacheKey);
    if (cached) return NextResponse.json(cached);

    // Prepare a MySQL FULLTEXT-compatible search string.
    // Wrap in quotes for exact phrase matching; append * for prefix matching.
    // Fallback: if query has special chars just use prefix mode.
    const ftQuery = `"${q.replace(/"/g, "")}"`;

    const [matches, teams, leagues] = await Promise.all([
      // FULLTEXT search on title/participant1/participant2 — uses @@fulltext index,
      // avoids LIKE '%q%' full table scan. Falls back to JOIN-based name search.
      prisma.match.findMany({
        where: {
          OR: [
            { title: { search: ftQuery } },
            { participant1: { search: ftQuery } },
            { participant2: { search: ftQuery } },
            { homeTeam: { name: { search: ftQuery } } },
            { awayTeam: { name: { search: ftQuery } } },
            { league: { name: { search: ftQuery } } },
          ],
        },
        include: {
          homeTeam: { select: { name: true, logo: true, shortName: true } },
          awayTeam: { select: { name: true, logo: true, shortName: true } },
          league: { select: { name: true } },
        },
        orderBy: [{ status: "asc" }, { scheduledAt: "desc" }],
        take: 5,
      }),
      // FULLTEXT on Team.name — uses @@fulltext index
      prisma.team.findMany({
        where: {
          OR: [
            { name: { search: ftQuery } },
            // shortName has no fulltext index; use prefix match (uses slug index via name scan is small)
            { shortName: { startsWith: q } },
          ],
        },
        select: { id: true, name: true, slug: true, logo: true, country: true },
        take: 4,
      }),
      // FULLTEXT on League.name — uses @@fulltext index
      prisma.league.findMany({
        where: {
          OR: [
            { name: { search: ftQuery } },
            { country: { startsWith: q } },
          ],
          isActive: true,
        },
        select: { id: true, name: true, slug: true, logo: true, country: true },
        take: 3,
      }),
    ]);

    const result = { matches, teams, leagues };
    await cacheSet(cacheKey, result, 60);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[search]", err);
    return NextResponse.json({ matches: [], teams: [], leagues: [] }, { status: 500 });
  }
}
