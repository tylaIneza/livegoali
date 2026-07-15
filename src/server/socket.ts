import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { randomBytes } from "crypto";
import { prisma } from "../lib/prisma";
import { runLiveScoreSync } from "../lib/sync-livescore";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Two dedicated clients required by the Redis adapter (pub/sub pattern)
const pubClient = new Redis(REDIS_URL, { maxRetriesPerRequest: 3, lazyConnect: false });
const subClient = pubClient.duplicate();

// Prevent unhandled error events from crashing the process
pubClient.on("error", (err) => console.error("[redis:pub] connection error:", err.message));
subClient.on("error", (err) => console.error("[redis:sub] connection error:", err.message));

// Redis key helpers
const vwKey = (matchId: string) => `vw:${matchId}`;
const ACTIVE_KEY = "vw:active";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  // High-concurrency tuning
  pingTimeout: 60_000,
  pingInterval: 25_000,
  upgradeTimeout: 30_000,
  maxHttpBufferSize: 1e6,
  perMessageDeflate: false, // saves CPU at scale, disable compression
});

// Scale across multiple processes via Redis pub/sub
io.adapter(createAdapter(pubClient, subClient));

// ── Redis-based viewer counters ───────────────────────────────────────────────
// Replaces in-memory socket-room iteration — handles 100k+ concurrent viewers

async function trackJoin(matchId: string, isUser: boolean) {
  const key = vwKey(matchId);
  await pubClient
    .pipeline()
    .hincrby(key, "total", 1)
    .hincrby(key, isUser ? "users" : "guests", 1)
    .sadd(ACTIVE_KEY, matchId)
    .expire(key, 7_200) // 2h TTL — auto-clean stale data after server restart
    .exec();
}

async function trackLeave(matchId: string, isUser: boolean) {
  const key = vwKey(matchId);
  await pubClient
    .pipeline()
    .hincrby(key, "total", -1)
    .hincrby(key, isUser ? "users" : "guests", -1)
    .exec();
}

async function broadcastMatchViewers(matchId: string) {
  const raw = await pubClient.hgetall(vwKey(matchId));
  const total = Math.max(0, parseInt(raw?.total || "0"));
  const users = Math.max(0, parseInt(raw?.users || "0"));
  io.to(`match-${matchId}`).emit("viewer-count", {
    total,
    users,
    guests: Math.max(0, parseInt(raw?.guests || "0")),
  });
}

// Debounced global broadcast — fires at most once every 2 seconds.
// Prevents thundering herd when thousands of viewers join/leave at once.
let _globalTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleBroadcastGlobal() {
  if (_globalTimer) return;
  _globalTimer = setTimeout(async () => {
    _globalTimer = null;
    await broadcastGlobalViewers();
  }, 2_000);
}

async function broadcastGlobalViewers() {
  const matchIds = await pubClient.smembers(ACTIVE_KEY);
  if (!matchIds.length) {
    io.to("global").emit("viewer-update", []);
    return;
  }

  // Fetch all match viewer counts in ONE round-trip pipeline
  const pipeline = pubClient.pipeline();
  for (const matchId of matchIds) pipeline.hgetall(vwKey(matchId));
  const results = await pipeline.exec();

  const data = matchIds
    .map((matchId, i) => {
      const d = (results?.[i]?.[1] as Record<string, string>) || {};
      const total = Math.max(0, parseInt(d.total || "0"));
      return {
        matchId,
        total,
        users: Math.max(0, parseInt(d.users || "0")),
        guests: Math.max(0, parseInt(d.guests || "0")),
      };
    })
    .filter((m) => m.total > 0);

  io.to("global").emit("viewer-update", data);
}

// On startup: reset stale viewer counts from previous run
async function resetViewerCounts() {
  const keys: string[] = [];
  let cursor = "0";
  do {
    const [next, batch] = await pubClient.scan(cursor, "MATCH", "vw:*", "COUNT", 100);
    cursor = next;
    keys.push(...batch);
  } while (cursor !== "0");
  if (keys.length) await pubClient.del(...keys);
  console.log("[socket] Viewer counts reset");
}

// ── Socket event handlers ─────────────────────────────────────────────────────

io.on("connection", (socket) => {
  socket.on("join-global", async () => {
    socket.join("global");
    await broadcastGlobalViewers();
  });

  socket.on("join-match", async (data: string | { matchId: string; userId?: string }) => {
    const matchId = typeof data === "string" ? data : data.matchId;
    const userId = typeof data === "object" ? (data.userId ?? null) : null;

    socket.data.matchId = matchId;
    socket.data.userId = userId;
    socket.join(`match-${matchId}`);

    // Fire-and-forget view count — don't block socket join on DB write
    if (!socket.data.viewedMatches) socket.data.viewedMatches = new Set<string>();
    if (!socket.data.viewedMatches.has(matchId)) {
      socket.data.viewedMatches.add(matchId);
      prisma.match
        .update({
          where: { id: matchId },
          data: {
            views: { increment: 1 },
            ...(userId ? { userViews: { increment: 1 } } : { anonViews: { increment: 1 } }),
          },
        })
        .catch((err) => console.error("[socket] view increment failed:", err));
    }

    // Send recent chat history — cached 30s so burst joins don't hammer DB
    try {
      const chatCacheKey = `chat:${matchId}`;
      const cachedHistory = await pubClient.get(chatCacheKey);
      if (cachedHistory) {
        socket.emit("chat-history", JSON.parse(cachedHistory));
      } else {
        const messages = await prisma.liveChatMessage.findMany({
          where: { matchId, isDeleted: false },
          include: {
            user: { select: { id: true, name: true, image: true, role: true, isVIP: true } },
          },
          orderBy: { createdAt: "asc" },
          take: 50,
        });
        const history = messages.map((m) => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          user: m.user,
        }));
        await pubClient.setex(chatCacheKey, 30, JSON.stringify(history));
        socket.emit("chat-history", history);
      }
    } catch (err) {
      console.error("[socket] chat history failed:", err);
    }

    // Idempotent: a socket reconnect re-emits join-match for the same match
    // without an intervening leave-match, which would otherwise double-count
    // the same viewer. Only increment once per "session" of watching.
    if (!socket.data.countedViewer) {
      socket.data.countedViewer = true;
      await trackJoin(matchId, !!userId);
    }
    await broadcastMatchViewers(matchId);
    scheduleBroadcastGlobal();
  });

  socket.on("leave-match", async (matchId: string) => {
    socket.leave(`match-${matchId}`);
    const userId = socket.data.userId as string | null;
    // Mirrors the join guard above — without this, leaving a match then
    // later disconnecting (e.g. closing the tab from the homepage) decrements
    // the same match a second time via the disconnect handler below, driving
    // counts negative.
    if (socket.data.countedViewer) {
      socket.data.countedViewer = false;
      await trackLeave(matchId, !!userId);
    }
    await broadcastMatchViewers(matchId);
    scheduleBroadcastGlobal();
  });

  socket.on(
    "send-message",
    async (data: {
      matchId: string;
      content: string;
      userId?: string;
      userName?: string;
      userImage?: string;
      userRole?: string;
      isVIP?: boolean;
    }) => {
      const { matchId, content, userId } = data;
      if (!content?.trim() || !userId) return;

      const now = Date.now();
      const lastMsg = (socket as unknown as { lastMessage?: number }).lastMessage || 0;
      if (now - lastMsg < 1_000) {
        socket.emit("error", "Slow down!");
        return;
      }
      (socket as unknown as { lastMessage: number }).lastMessage = now;

      try {
        const message = await prisma.liveChatMessage.create({
          data: { matchId, userId, content: content.trim().slice(0, 200) },
          include: {
            user: { select: { id: true, name: true, image: true, role: true, isVIP: true } },
          },
        });
        io.to(`match-${matchId}`).emit("chat-message", {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          user: message.user,
        });
        // Invalidate chat history cache so the next join sees this message
        pubClient.del(`chat:${matchId}`).catch(() => {});
      } catch (err) {
        console.error("[socket] message save failed:", err);
      }
    },
  );

  socket.on(
    "match-event",
    (data: {
      matchId: string;
      type: string;
      minute: number;
      playerName?: string;
      description?: string;
    }) => {
      io.to(`match-${data.matchId}`).emit("match-event", data);
      io.to("global").emit("match-updated", { matchId: data.matchId });
    },
  );

  socket.on(
    "score-update",
    (data: {
      matchId: string;
      homeScore: number;
      awayScore: number;
      matchMinute: number;
      status: string;
    }) => {
      io.to(`match-${data.matchId}`).emit("score-update", data);
      io.to("global").emit("match-updated", { matchId: data.matchId });
    },
  );

  socket.on("disconnect", async () => {
    const matchId = socket.data.matchId as string | undefined;
    const userId = socket.data.userId as string | null;
    if (matchId && socket.data.countedViewer) {
      socket.data.countedViewer = false;
      await trackLeave(matchId, !!userId);
      await broadcastMatchViewers(matchId);
      scheduleBroadcastGlobal();
    }
  });
});

// ── Visit counter flush — Redis → MySQL every 60 seconds ─────────────────────
// /api/track writes visit counts to Redis (microseconds).
// This function batches them into MySQL once per minute.

async function incrementDbSetting(key: string, count: number) {
  if (count <= 0) return;
  const id = randomBytes(12).toString("hex");
  await prisma.$executeRaw`
    INSERT INTO Settings (id, \`key\`, value, updatedAt)
    VALUES (${id}, ${key}, ${String(count)}, NOW())
    ON DUPLICATE KEY UPDATE value = CAST(CAST(value AS UNSIGNED) + ${count} AS CHAR), updatedAt = NOW()
  `;
}

async function flushAdViews() {
  try {
    const adKeys: string[] = [];
    let cursor = "0";
    do {
      const [next, batch] = await pubClient.scan(cursor, "MATCH", "ads:views:*", "COUNT", 100);
      cursor = next;
      adKeys.push(...batch);
    } while (cursor !== "0");
    if (!adKeys.length) return;

    const getPipeline = pubClient.pipeline();
    for (const key of adKeys) getPipeline.get(key);
    const results = await getPipeline.exec();
    const delPipeline = pubClient.pipeline();
    for (const key of adKeys) delPipeline.del(key);
    await delPipeline.exec();

    await Promise.all(
      adKeys.map((key, i) => {
        const count = parseInt((results?.[i]?.[1] as string) || "0");
        if (count <= 0) return Promise.resolve();
        const id = key.replace("ads:views:", "");
        return prisma.advertisement
          .update({ where: { id }, data: { views: { increment: count } } })
          .catch(() => {});
      }),
    );
  } catch (err) {
    console.error("[flush] ad views flush failed:", err);
  }
}

async function flushMatchViews() {
  try {
    const keys: string[] = [];
    let cursor = "0";
    do {
      const [next, batch] = await pubClient.scan(cursor, "MATCH", "match_views:*", "COUNT", 100);
      cursor = next;
      keys.push(...batch);
    } while (cursor !== "0");
    if (!keys.length) return;

    const getPipeline = pubClient.pipeline();
    for (const key of keys) getPipeline.get(key);
    const results = await getPipeline.exec();
    const delPipeline = pubClient.pipeline();
    for (const key of keys) delPipeline.del(key);
    await delPipeline.exec();

    await Promise.all(
      keys.map((key, i) => {
        const count = parseInt((results?.[i]?.[1] as string) || "0");
        const month = key.replace("match_views:", ""); // YYYY-MM
        return incrementDbSetting(`match_views_month_${month}`, count);
      }),
    );
  } catch (err) {
    console.error("[flush] match views flush failed:", err);
  }
}

async function flushVisitCounters() {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const countryKeys: string[] = [];
    let cursor = "0";
    do {
      const [next, batch] = await pubClient.scan(cursor, "MATCH", "visits:country:*", "COUNT", 100);
      cursor = next;
      countryKeys.push(...batch);
    } while (cursor !== "0");

    const allKeys = ["visits:total", `visits:${today}`, ...countryKeys];
    if (allKeys.length === 0) return;

    // GET all values, then DEL them — compatible with all Redis versions (no GETDEL)
    const getPipeline = pubClient.pipeline();
    for (const key of allKeys) getPipeline.get(key);
    const getResults = await getPipeline.exec();

    const delPipeline = pubClient.pipeline();
    for (const key of allKeys) delPipeline.del(key);
    await delPipeline.exec();

    const total = parseInt((getResults?.[0]?.[1] as string) || "0");
    const todayCount = parseInt((getResults?.[1]?.[1] as string) || "0");

    const writes: Promise<void>[] = [
      incrementDbSetting("site_visits_total", total),
      incrementDbSetting(`site_visits_${today}`, todayCount),
    ];

    countryKeys.forEach((key, i) => {
      const count = parseInt((getResults?.[2 + i]?.[1] as string) || "0");
      const country = key.replace("visits:country:", "");
      writes.push(incrementDbSetting(`country_visits_${country}`, count));
    });

    await Promise.all(writes);

    if (total > 0) {
      console.log(`[flush] ${total} visits, ${todayCount} today flushed to DB`);
    }
  } catch (err) {
    console.error("[flush] visit counter flush failed:", err);
  }
}

// ── Auto-live: set SCHEDULED matches to LIVE 30 min before kickoff ────────────
// Only flips matches that actually have a stream to show — otherwise the site
// tells viewers a match is "LIVE" (badges, homepage, notifications) before
// there's anything real behind the play button.
async function autoLiveMatches() {
  const now = new Date();
  const in30min = new Date(now.getTime() + 30 * 60_000);
  const matches = await prisma.match.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: in30min },
      OR: [
        { streamUrl: { not: null } },
        { streams: { some: { isActive: true } } },
      ],
    },
    select: { id: true, scheduledAt: true },
  });
  for (const match of matches) {
    await prisma.match.update({
      where: { id: match.id },
      data: { status: "LIVE", startedAt: match.scheduledAt, matchMinute: null },
    });
    io.to("global").emit("match-updated", { matchId: match.id });
    console.log(`[auto-live] Match ${match.id} set to LIVE`);
  }
}

// ── Livescore live-score polling (unofficial API — see livescoreService.ts) ──
async function livescoreTick() {
  try {
    await runLiveScoreSync(io);
  } catch (err) {
    console.error("[livescore] sync error:", err);
  }
}

resetViewerCounts().then(() => {
  autoLiveMatches();
  flushVisitCounters();
  flushAdViews();
  flushMatchViews();
  livescoreTick();
  setInterval(autoLiveMatches, 60_000);
  setInterval(flushVisitCounters, 60_000);
  setInterval(flushAdViews, 60_000);
  setInterval(flushMatchViews, 60_000);
  setInterval(livescoreTick, 60_000);
});

const PORT = process.env.SOCKET_PORT ? parseInt(process.env.SOCKET_PORT) : 3001;
httpServer.listen(PORT, () => {
  console.log(`[socket] Server running on port ${PORT}`);
});

export { io };
