import { prisma } from "@/lib/prisma";
import { fetchStreams } from "@/lib/ppv";
import type { PPVStream } from "@/lib/ppv";
import { getFlagUrl } from "@/lib/countryFlags";

// Only these sports are imported — everything else the provider lists
// (combat sports, tennis, F1, etc.) is ignored per product requirements.
// Keyed by lowercased provider category_name → our Sport slug.
const CATEGORY_ALLOWLIST: Record<string, string> = {
  football: "football",
  soccer: "football",
  basketball: "basketball",
  volleyball: "volleyball",
};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Provider timestamps have been observed as unix seconds; defensively also
// accept ms and ISO strings rather than trusting a single shape.
function parseTimestamp(value: number | string | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    return new Date(value < 1e12 ? value * 1000 : value);
  }
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && /^\d+$/.test(value.trim())) {
    return new Date(asNumber < 1e12 ? asNumber * 1000 : asNumber);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// "CF Montréal vs. Toronto FC" → ["CF Montréal", "Toronto FC"]. Falls back to
// [null, null] (renders via `title` instead) if the name doesn't have a clean
// two-sided "vs" split — e.g. a solo event or an unexpected name format.
function splitParticipants(name: string): [string | null, string | null] {
  const parts = name.split(/\s+vs\.?\s+/i);
  if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
    return [parts[0].trim(), parts[1].trim()];
  }
  return [null, null];
}

// Keyed by slug (same convention as sync-football.ts's upsertTeam) so a name
// that already exists — including real teams created by the Sportmonks sync —
// is reused rather than duplicated, and its existing logo carries over for free.
// A name that matches a country (national team) gets its flag auto-applied;
// club names have no such source and are left for an admin to fill in manually.
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

function isValidStream(s: PPVStream): boolean {
  return (
    !!s.id &&
    typeof s.name === "string" && s.name.trim().length > 0 &&
    typeof s.uri_name === "string" && s.uri_name.trim().length > 0 &&
    typeof s.iframe === "string" && s.iframe.trim().length > 0 &&
    typeof s.category_name === "string" && s.category_name.trim().length > 0
  );
}

interface SyncResult {
  imported: number;
  updated: number;
  finished: number;
  skippedAlwaysLive: number;
  skippedCategory: number;
  skippedInvalid: number;
  errors: number;
}

export async function runPpvSync(): Promise<SyncResult> {
  const result: SyncResult = {
    imported: 0, updated: 0, finished: 0,
    skippedAlwaysLive: 0, skippedCategory: 0, skippedInvalid: 0, errors: 0,
  };

  const categories = await fetchStreams();
  const seenExternalIds = new Set<string>();

  for (const group of categories) {
    const categoryKey = (group.category ?? "").trim().toLowerCase();
    const sportSlug = CATEGORY_ALLOWLIST[categoryKey];
    if (!sportSlug) {
      result.skippedCategory += group.streams?.length ?? 0;
      continue;
    }

    const sport = await prisma.sport.findUnique({ where: { slug: sportSlug } });
    if (!sport || !sport.enabled) {
      result.skippedCategory += group.streams?.length ?? 0;
      continue;
    }

    for (const stream of group.streams ?? []) {
      try {
        if (!isValidStream(stream)) {
          result.skippedInvalid++;
          continue;
        }

        // 24/7 channels don't fit the "scheduled match" model — they're left
        // out of import entirely rather than shown with a misleading kickoff time.
        if (stream.always_live) {
          result.skippedAlwaysLive++;
          continue;
        }

        const startsAt = parseTimestamp(stream.starts_at);
        if (!startsAt) {
          result.skippedInvalid++;
          continue;
        }
        const endsAt = parseTimestamp(stream.ends_at);

        const externalId = String(stream.id);
        seenExternalIds.add(externalId);

        const slug = `${slugify(stream.uri_name)}-${externalId}`;
        const status = endsAt && endsAt.getTime() < Date.now() ? "FINISHED" : "SCHEDULED";
        const [participant1, participant2] = splitParticipants(stream.name);

        // A clean two-sided split gets real Team rows — this is what unlocks
        // the existing "Team Logos" editor and team pages for these matches.
        let homeTeamId: string | null = null;
        let awayTeamId: string | null = null;
        if (participant1 && participant2) {
          homeTeamId = await findOrCreateTeam(participant1);
          awayTeamId = await findOrCreateTeam(participant2);
        }

        const metadata = JSON.stringify({
          tag: stream.tag ?? null,
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
            coverImage: stream.poster ?? null,
            scheduledAt: startsAt,
            status,
            endedAt: status === "FINISHED" ? endsAt : null,
            isAlwaysLive: false,
            isPublished: false, // requires admin approval before it appears publicly
            metadata,
          },
          update: {
            slug,
            title: stream.name,
            participant1,
            participant2,
            homeTeamId,
            awayTeamId,
            streamUrl: stream.iframe,
            coverImage: stream.poster ?? null,
            scheduledAt: startsAt,
            metadata,
            ...(status === "FINISHED" ? { status: "FINISHED", endedAt: endsAt } : {}),
            // isPublished is deliberately never touched here — an admin's
            // approval/rejection must survive future syncs of the same stream.
          },
        });

        // Once a match has real Team rows, its edit-form/Watch page look at
        // StreamSource[] rather than the legacy streamUrl field — mirror the
        // stream there too so it's actually visible/manageable in that view.
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
        console.error(`[PPVSync] Failed stream ${stream?.id}:`, err);
      }
    }
  }

  // Anything previously imported from PPV that's no longer in the feed and
  // was already due to have started is treated as over.
  const stale = await prisma.match.findMany({
    where: {
      source: "ppv",
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

  await setSyncStatus(result);
  return result;
}

async function setSyncStatus(result: SyncResult) {
  const now = new Date().toISOString();
  await prisma.settings.upsert({
    where: { key: "sync_ppv_last" },
    create: { key: "sync_ppv_last", value: JSON.stringify({ time: now, ...result }) },
    update: { value: JSON.stringify({ time: now, ...result }) },
  }).catch(() => {});
}

export async function getPpvSyncStatus() {
  const row = await prisma.settings.findUnique({ where: { key: "sync_ppv_last" } }).catch(() => null);
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value) as { time: string } & SyncResult;
  } catch {
    return null;
  }
}
