import { prisma } from "@/lib/prisma";
import { getFlagUrl } from "@/lib/countryFlags";
import type { NormalizedPPVStream } from "@/lib/ppv-football";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// "CF Montréal vs. Toronto FC" → ["CF Montréal", "Toronto FC"]. Falls back to
// [null, null] (renders via `title` instead) for names that don't have a
// clean two-sided "vs" split.
function splitParticipants(name: string): [string | null, string | null] {
  const parts = name.split(/\s+vs\.?\s+/i);
  if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
    return [parts[0].trim(), parts[1].trim()];
  }
  return [null, null];
}

// Keyed by slug so a name that already exists (including real teams entered
// manually elsewhere) is reused rather than duplicated. A name that matches a
// country (national team) gets its flag auto-applied; club names are left for
// an admin to fill in a logo manually.
async function findOrCreateTeam(name: string): Promise<string> {
  const slug = slugify(name);
  const flagUrl = getFlagUrl(name);

  const existing = await prisma.team.findUnique({ where: { slug } });
  if (existing) {
    if (!existing.logo && flagUrl) {
      await prisma.team.update({ where: { id: existing.id }, data: { logo: flagUrl } });
    }
    return existing.id;
  }

  const team = await prisma.team.create({ data: { name, slug, logo: flagUrl } });
  return team.id;
}

export interface FootballSyncResult {
  imported: number;
  updated: number;
  finished: number;
  skippedAlwaysLive: number;
  skippedInvalid: number;
  errors: number;
}

// Persists the current live PPV football list into Match rows so it flows
// through the site's existing fixtures/live/home pages (which are DB-driven),
// not just the ephemeral /football section. Upserts on the (source,
// externalId) unique key from the schema, so re-running this is idempotent —
// safe to call on every PPV cache refresh.
export async function syncFootballMatchesToDb(streams: NormalizedPPVStream[]): Promise<FootballSyncResult> {
  const result: FootballSyncResult = {
    imported: 0, updated: 0, finished: 0,
    skippedAlwaysLive: 0, skippedInvalid: 0, errors: 0,
  };

  const sport = await prisma.sport.findUnique({ where: { slug: "football" } });
  if (!sport) return result;

  const seenExternalIds = new Set<string>();

  for (const stream of streams) {
    try {
      // 24/7 channels don't fit the "scheduled match" model — left out of
      // import entirely rather than shown with a misleading kickoff time.
      if (stream.always_live) {
        result.skippedAlwaysLive++;
        continue;
      }
      if (stream.starts_at === null) {
        result.skippedInvalid++;
        continue;
      }

      const externalId = stream.id;
      seenExternalIds.add(externalId);

      const startsAt = new Date(stream.starts_at);
      const endsAt = stream.ends_at !== null ? new Date(stream.ends_at) : null;
      const status = endsAt && endsAt.getTime() < Date.now() ? "FINISHED" : "SCHEDULED";
      const slug = `${slugify(stream.uri_name)}-${externalId}`;
      const [participant1, participant2] = splitParticipants(stream.name);

      // A clean two-sided split gets real Team rows — this is what unlocks
      // team logos/pages for these matches on the existing fixtures/live UI.
      let homeTeamId: string | null = null;
      let awayTeamId: string | null = null;
      if (participant1 && participant2) {
        homeTeamId = await findOrCreateTeam(participant1);
        awayTeamId = await findOrCreateTeam(participant2);
      }

      const metadata = JSON.stringify({
        tag: stream.tag,
        uriName: stream.uri_name,
        endsAt: endsAt?.toISOString() ?? null,
      });

      const existing = await prisma.match.findUnique({
        where: { source_externalId: { source: "ppv", externalId } },
        select: { id: true },
      });

      const match = await prisma.match.upsert({
        where: { source_externalId: { source: "ppv", externalId } },
        create: {
          source: "ppv",
          externalId,
          slug,
          sportId: sport.id,
          title: stream.name,
          participant1,
          participant2,
          homeTeamId,
          awayTeamId,
          streamUrl: stream.iframe,
          streamType: "IFRAME",
          coverImage: stream.poster,
          scheduledAt: startsAt,
          status,
          endedAt: status === "FINISHED" ? endsAt : null,
          isAlwaysLive: false,
          isPublished: true,
          metadata,
        },
        update: {
          title: stream.name,
          participant1,
          participant2,
          homeTeamId,
          awayTeamId,
          streamUrl: stream.iframe,
          coverImage: stream.poster,
          scheduledAt: startsAt,
          metadata,
          ...(status === "FINISHED" ? { status: "FINISHED", endedAt: endsAt } : {}),
        },
      });

      const existingSource = await prisma.streamSource.findFirst({
        where: { matchId: match.id, label: "PPV Stream" },
      });
      if (existingSource) {
        await prisma.streamSource.update({
          where: { id: existingSource.id },
          data: { url: stream.iframe, isActive: true },
        });
      } else {
        await prisma.streamSource.create({
          data: {
            matchId: match.id,
            url: stream.iframe,
            type: "IFRAME",
            quality: "HD",
            label: "PPV Stream",
            isPrimary: true,
            isActive: true,
            priority: 0,
          },
        });
      }

      if (existing) result.updated++; else result.imported++;
    } catch (err) {
      result.errors++;
      console.error(`[PPVFootballSync] Failed stream ${stream?.id}:`, err);
    }
  }

  // Anything previously imported that's no longer in the feed and was already
  // due to have started is treated as over.
  const stale = await prisma.match.findMany({
    where: {
      source: "ppv",
      sportId: sport.id,
      status: { in: ["SCHEDULED", "LIVE", "HALFTIME"] },
      scheduledAt: { lt: new Date() },
      externalId: { notIn: Array.from(seenExternalIds) },
    },
    select: { id: true },
  });
  if (stale.length > 0) {
    await prisma.match.updateMany({
      where: { id: { in: stale.map((m) => m.id) } },
      data: { status: "FINISHED", endedAt: new Date() },
    });
    result.finished = stale.length;
  }

  await prisma.settings.upsert({
    where: { key: "sync_ppv_football_last" },
    create: { key: "sync_ppv_football_last", value: JSON.stringify({ time: new Date().toISOString(), ...result }) },
    update: { value: JSON.stringify({ time: new Date().toISOString(), ...result }) },
  }).catch(() => {});

  return result;
}
