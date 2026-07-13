// ── Livescore integration (UNOFFICIAL API) ─────────────────────────────────
// prod-public-api.livescore.com is the endpoint Livescore's own website/app
// calls — it is NOT a documented, supported public API. It can change shape,
// rate-limit, or disappear without notice, and using it may not comply with
// Livescore's Terms of Service. This is a judgment call made by the site
// operator; treat every response defensively and never let a shape change
// here crash anything that depends on it.

const BASE = "https://prod-public-api.livescore.com/v1/api/app/date/soccer";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export interface LivescoreMatch {
  matchId: string;
  league: string;
  country: string;
  homeTeam: string;
  homeId: string;
  awayTeam: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  status: string;
}

// Raw response shapes — intentionally loose (only the fields we read are
// typed) since this is reverse-engineered and unfamiliar fields are expected.
interface RawTeam {
  ID: string;
  Nm: string;
}

interface RawEvent {
  Eid: string;
  Eps: string;
  Tr1?: string;
  Tr2?: string;
  T1?: RawTeam[];
  T2?: RawTeam[];
}

interface RawStage {
  Snm?: string;
  Cnm?: string;
  Events?: RawEvent[];
}

interface RawResponse {
  Stages?: RawStage[];
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Fetches Livescore's unofficial daily soccer schedule and returns a flat,
 * clean list of matches. Never throws for a *parsing* problem — only for a
 * network/HTTP failure — so callers can decide how to handle a bad response.
 * Callers should still wrap calls in try/catch since network failures do throw.
 */
export async function fetchMatches(
  date: number,
  month: number,
  year: number,
  countryCode = "KE"
): Promise<LivescoreMatch[]> {
  const dateStr = `${year}${pad2(month)}${pad2(date)}`;
  const url = `${BASE}/${dateStr}/3?MD=1&countryCode=${encodeURIComponent(countryCode)}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": BROWSER_USER_AGENT,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Livescore ${dateStr} → HTTP ${res.status}`);
  }

  let data: RawResponse;
  try {
    data = (await res.json()) as RawResponse;
  } catch (err) {
    throw new Error(`Livescore ${dateStr} → non-JSON response: ${(err as Error).message}`);
  }

  const matches: LivescoreMatch[] = [];

  for (const stage of data.Stages ?? []) {
    for (const event of stage.Events ?? []) {
      const home = event.T1?.[0];
      const away = event.T2?.[0];
      if (!home || !away) continue;

      matches.push({
        matchId: event.Eid,
        league: stage.Snm ?? "Unknown League",
        country: stage.Cnm ?? "Unknown",
        homeTeam: home.Nm,
        homeId: home.ID,
        awayTeam: away.Nm,
        awayId: away.ID,
        homeScore: parseInt(event.Tr1 ?? "0", 10) || 0,
        awayScore: parseInt(event.Tr2 ?? "0", 10) || 0,
        status: event.Eps,
      });
    }
  }

  return matches;
}
