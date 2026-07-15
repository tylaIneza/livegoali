const DEFAULT_BASE = "https://api.ppv.st/api";

function primaryBase(): string {
  return process.env.PPV_API_URL || DEFAULT_BASE;
}

export interface PPVStream {
  id: number | string;
  name: string;
  tag?: string | null;
  poster?: string | null;
  uri_name: string;
  starts_at: number | string;
  ends_at?: number | string | null;
  always_live?: boolean;
  category_name: string;
  iframe: string;
}

export interface PPVCategoryGroup {
  category: string;
  id?: number;
  always_live?: boolean;
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

export async function fetchBackupDomains(): Promise<string[]> {
  try {
    const data = await ppvGet<PingResponse>(primaryBase(), "/ping");
    return (data.domains ?? []).filter((d) => typeof d === "string" && d.length > 0);
  } catch {
    return [];
  }
}

// Tries the configured domain first, then falls back to whatever backup
// domains /ping advertises — the provider expects clients to need failover.
export async function fetchStreams(): Promise<PPVCategoryGroup[]> {
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
