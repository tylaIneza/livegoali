const BASE = "https://api.sportmonks.com/v3/football";

function token() {
  return process.env.SPORTMONKS_API_TOKEN ?? "";
}

async function smGet<T>(path: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${BASE}${path}${sep}api_token=${token()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sportmonks ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.data as T;
}

export type SMLocation = "home" | "away";

export interface SMTeam {
  id: number;
  name: string;
  short_code?: string;
  image_path?: string;
  founded?: number;
  meta?: { location: SMLocation; winner: boolean; position?: number };
}

export interface SMCountry {
  name: string;
  image_path?: string;
}

export interface SMLeague {
  id: number;
  name: string;
  short_code?: string;
  image_path?: string;
  country?: SMCountry;
}

export interface SMScore {
  description: string;
  score: { goals: number; participant: SMLocation };
}

export interface SMPeriod {
  period_id: number;
  description: string;
  minutes?: number;
  started?: number | null;
  ended?: number | null;
}

export interface SMEvent {
  id: number;
  type_id: number;
  period_id: number;
  minute: number;
  player_name?: string;
  description?: string;
  participant_id: number;
}

export interface SMFixture {
  id: number;
  league_id: number;
  state_id: number;
  starting_at: string;
  name: string;
  participants: SMTeam[];
  league: SMLeague;
  scores: SMScore[];
  periods: SMPeriod[];
  events?: SMEvent[];
  round?: { name: string };
}

export const fetchLive = (): Promise<SMFixture[]> =>
  smGet<SMFixture[]>(
    "/livescores/inplay?include=participants;scores;periods;league.country;round"
  );

export const fetchByDate = (date: string): Promise<SMFixture[]> =>
  smGet<SMFixture[]>(
    `/fixtures/date/${date}?include=participants;scores;league.country;round`
  );

export const fetchFixture = (id: number): Promise<SMFixture> =>
  smGet<SMFixture>(
    `/fixtures/${id}?include=participants;scores;periods;events;league.country;round`
  );
