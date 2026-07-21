// Real join-burst probe: opens N concurrent Socket.IO connections against
// the socket server and has them all emit "join-match" for the same match
// at (as close to) the same instant as Promise.all allows — reproducing the
// actual burst scenario behind the ~20-viewer slowdown.
//
// scripts/loadtest.mjs only fires plain HTTP GETs at a single cached page,
// which exercises the ISR/Redis page-render path (already fixed and
// verified at 200 concurrent). It never opens a socket, so it can't
// reproduce the join-time work this script targets: the view-count buffer
// (src/server/socket.ts trackJoin / flushViewCounters).
//
// Live chat (and its chat-history fetch, previously the dominant cost here)
// has since been removed from the product entirely, so join-match is now
// pure Redis work — no MySQL query on the join path at all. This script
// only waits on "viewer-count" accordingly.
//
// Usage:
//   node scripts/loadtest-sockets.mjs <matchId> [concurrency] [socketUrl]
//
// <matchId> must be a real Match.id from your database (not the slug) —
// grab one quickly with:
//   npx prisma studio                      (copy the id column), or
//   node -e "require('./src/lib/prisma').prisma.match.findFirst({where:{status:'LIVE'}}).then(m=>console.log(m?.id)).finally(()=>process.exit())"
//
// Examples:
//   node scripts/loadtest-sockets.mjs cme1a2b3c4d5e 20
//   node scripts/loadtest-sockets.mjs cme1a2b3c4d5e 200 http://localhost:3001
//   node scripts/loadtest-sockets.mjs cme1a2b3c4d5e 2000 https://livegoali.com
//
// Run it at increasing concurrency (20, 100, 500, 2000, 10000) against a
// real deployment to find where it actually breaks, the same way
// loadtest.mjs's own header comment suggests doing for the HTTP path.

import { io } from "socket.io-client";

const matchId = process.argv[2];
const concurrency = parseInt(process.argv[3] ?? "20", 10);
const socketUrl = process.argv[4] ?? process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

if (!matchId) {
  console.error("Usage: node loadtest-sockets.mjs <matchId> [concurrency] [socketUrl]");
  console.error("  matchId must be a real Match.id from your DB — see the comment at the top of this file.");
  process.exit(1);
}

const JOIN_TIMEOUT_MS = 15_000;

// Simulates one viewer: connect, join the match, wait for the viewer-count
// broadcast a real player's mount would wait on, then leave and disconnect.
// Never rejects — failures resolve with ok:false so one dead socket can't
// abort the whole batch.
function simulateViewer(i) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const timings = { connectMs: null, viewerCountMs: null };
    let settled = false;

    const socket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: false,
      forceNew: true,
      timeout: JOIN_TIMEOUT_MS,
    });

    const timeoutHandle = setTimeout(() => {
      finish(false, `timeout after ${JOIN_TIMEOUT_MS}ms waiting for viewer-count`);
    }, JOIN_TIMEOUT_MS);

    function finish(ok, error) {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutHandle);
      try {
        socket.emit("leave-match", matchId);
      } catch {}
      socket.close();
      resolve({ i, ok, error, ...timings, totalMs: Date.now() - t0 });
    }

    socket.on("connect_error", (err) => finish(false, `connect_error: ${err.message}`));
    socket.on("connect", () => {
      timings.connectMs = Date.now() - t0;
      socket.emit("join-match", { matchId, userId: undefined });
    });

    // Broadcast to the whole match-<id> room on every join, so a socket may
    // see one triggered by another viewer's join before its own — still a
    // meaningful signal for the view-count buffer under load.
    socket.on("viewer-count", () => {
      if (timings.viewerCountMs === null) {
        timings.viewerCountMs = Date.now() - t0;
        finish(true);
      }
    });
  });
}

function percentile(arr, p) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

console.log(`Opening ${concurrency} concurrent socket joins against ${socketUrl} for match ${matchId}\n`);

const start = Date.now();
const results = await Promise.all(Array.from({ length: concurrency }, (_, i) => simulateViewer(i)));
const wallMs = Date.now() - start;

for (const r of [...results].sort((a, b) => (a.totalMs ?? 0) - (b.totalMs ?? 0))) {
  const marker = r.ok ? "OK  " : "FAIL";
  const detail = r.ok
    ? `connect=${r.connectMs}ms viewers=${r.viewerCountMs}ms`
    : r.error;
  console.log(`${marker} viewer#${String(r.i).padStart(String(concurrency).length)}  total=${String(r.totalMs).padStart(6)}ms  ${detail}`);
}

const ok = results.filter((r) => r.ok);
const failed = results.filter((r) => !r.ok);
const viewerTimes = ok.map((r) => r.viewerCountMs).filter((v) => v !== null);

console.log(`\n── Summary ──`);
console.log(`Concurrency:        ${concurrency}`);
console.log(`Succeeded:          ${ok.length}/${concurrency}`);
console.log(`Failed/timed out:   ${failed.length}/${concurrency}`);
console.log(`Wall time:          ${wallMs}ms`);
if (viewerTimes.length) {
  console.log(`viewer-count latency   p50=${percentile(viewerTimes, 50)}ms  p95=${percentile(viewerTimes, 95)}ms  p99=${percentile(viewerTimes, 99)}ms  max=${Math.max(...viewerTimes)}ms`);
}
if (failed.length > 0) {
  console.log(`\n${failed.length} viewer(s) failed to join at concurrency=${concurrency} — this is a real breaking point, not visible to the HTTP-only test in loadtest.mjs.`);
}
