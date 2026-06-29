import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { prisma } from "../lib/prisma";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Two dedicated clients required by the Redis adapter (pub/sub pattern)
const pubClient = new Redis(REDIS_URL, { maxRetriesPerRequest: 3 });
const subClient = pubClient.duplicate();

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
  const keys = await pubClient.keys("vw:*");
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

    // Send recent chat history
    try {
      const messages = await prisma.liveChatMessage.findMany({
        where: { matchId, isDeleted: false },
        include: {
          user: { select: { id: true, name: true, image: true, role: true, isVIP: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 50,
      });
      socket.emit(
        "chat-history",
        messages.map((m) => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          user: m.user,
        })),
      );
    } catch (err) {
      console.error("[socket] chat history failed:", err);
    }

    await trackJoin(matchId, !!userId);
    await broadcastMatchViewers(matchId);
    scheduleBroadcastGlobal();
  });

  socket.on("leave-match", async (matchId: string) => {
    socket.leave(`match-${matchId}`);
    const userId = socket.data.userId as string | null;
    await trackLeave(matchId, !!userId);
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
    if (matchId) {
      await trackLeave(matchId, !!userId);
      await broadcastMatchViewers(matchId);
      scheduleBroadcastGlobal();
    }
  });
});

// ── Auto-live: set SCHEDULED matches to LIVE 30 min before kickoff ────────────
async function autoLiveMatches() {
  const now = new Date();
  const in30min = new Date(now.getTime() + 30 * 60_000);
  const matches = await prisma.match.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: in30min } },
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

resetViewerCounts().then(() => {
  autoLiveMatches();
  setInterval(autoLiveMatches, 60_000);
});

const PORT = process.env.SOCKET_PORT ? parseInt(process.env.SOCKET_PORT) : 3001;
httpServer.listen(PORT, () => {
  console.log(`[socket] Server running on port ${PORT}`);
});

export { io };
