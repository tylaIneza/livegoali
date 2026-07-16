// Concurrency probe: fires N concurrent requests at a page and reports
// success/failure/timing, so you can see exactly where things start
// failing.
//
// Usage:
//   node scripts/loadtest.mjs https://livegoali.com/live/some-match-slug 30
//
// Run it multiple times with increasing counts (5, 10, 15, 20, 30) to
// find the exact breaking point.

const url = process.argv[2];
const concurrency = parseInt(process.argv[3] ?? "20", 10);

if (!url) {
  console.error("Usage: node loadtest.mjs <url> [concurrency]");
  process.exit(1);
}

console.log(`Firing ${concurrency} concurrent requests at ${url}\n`);

const start = Date.now();

const results = await Promise.all(
  Array.from({ length: concurrency }, async (_, i) => {
    const reqStart = Date.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(35000) });
      const ms = Date.now() - reqStart;
      return { i, status: res.status, ms, ok: res.ok };
    } catch (err) {
      const ms = Date.now() - reqStart;
      return { i, status: "ERROR", ms, ok: false, error: String(err.message || err) };
    }
  })
);

results.sort((a, b) => a.ms - b.ms);

for (const r of results) {
  const marker = r.ok ? "OK   " : "FAIL ";
  console.log(`${marker} req#${String(r.i).padStart(2)}  ${String(r.ms).padStart(6)}ms  status=${r.status}${r.error ? "  " + r.error : ""}`);
}

const failed = results.filter((r) => !r.ok);
const slow = results.filter((r) => r.ms > 5000);

console.log(`\nTotal wall time: ${Date.now() - start}ms`);
console.log(`Failed: ${failed.length}/${concurrency}`);
console.log(`Slow (>5s): ${slow.length}/${concurrency}`);
if (failed.length > 0 || slow.length > 0) {
  console.log(`\nRequests started failing/slowing down at concurrency=${concurrency}.`);
}
