// Warms the /api/stream/extract cache for a live match before its player
// mounts (e.g. on match-card hover), so the scrape overlaps with browsing
// instead of adding to the loading spinner time.

const prefetched = new Set<string>();

export function prefetchStreamForMatch(matchId: string) {
  if (prefetched.has(matchId)) return;
  prefetched.add(matchId);

  fetch(`/api/matches/${matchId}/stream-url`)
    .then((r) => r.json())
    .then((data: { url?: string | null }) => {
      if (!data.url) return;
      return fetch(`/api/stream/extract?url=${encodeURIComponent(data.url)}`);
    })
    .catch(() => {
      // Best-effort warm-up — the player will retry extraction on mount anyway.
      prefetched.delete(matchId);
    });
}
