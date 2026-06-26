import { createServer } from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

async function broadcastMatchViewers(matchId: string) {
  const room = `match-${matchId}`;
  const sockets = await io.in(room).fetchSockets();
  const users = sockets.filter((s) => s.data.userId).length;
  io.to(room).emit("viewer-count", {
    total: sockets.length,
    users,
    guests: sockets.length - users,
  });
}

async function broadcastGlobalViewers() {
  const rooms = [...io.sockets.adapter.rooms.keys()].filter((r) => r.startsWith("match-"));
  const data: { matchId: string; total: number; users: number; guests: number }[] = [];
  for (const room of rooms) {
    const sockets = await io.in(room).fetchSockets();
    if (sockets.length === 0) continue;
    const users = sockets.filter((s) => s.data.userId).length;
    data.push({
      matchId: room.replace("match-", ""),
      total: sockets.length,
      users,
      guests: sockets.length - users,
    });
  }
  io.to("global").emit("viewer-update", data);
}

io.on("connection", (socket) => {
  // Admin/global widgets join this room to get live viewer data
  socket.on("join-global", async () => {
    socket.join("global");
    await broadcastGlobalViewers();
  });

  socket.on("join-match", async (data: string | { matchId: string; userId?: string }) => {
    const matchId = typeof data === "string" ? data : data.matchId;
    const userId = typeof data === "object" ? (data.userId ?? null) : null;

    socket.data.matchId = matchId;
    socket.data.userId = userId;

    const room = `match-${matchId}`;
    socket.join(room);

    // Persist view count once per match per socket connection
    if (!socket.data.viewedMatches) socket.data.viewedMatches = new Set<string>();
    if (!socket.data.viewedMatches.has(matchId)) {
      socket.data.viewedMatches.add(matchId);
      try {
        await prisma.match.update({
          where: { id: matchId },
          data: {
            views: { increment: 1 },
            ...(userId ? { userViews: { increment: 1 } } : { anonViews: { increment: 1 } }),
          },
        });
      } catch (err) {
        console.error("Failed to increment match views:", err);
      }
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

      socket.emit("chat-history", messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        user: m.user,
      })));
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }

    await broadcastMatchViewers(matchId);
    await broadcastGlobalViewers();
  });

  socket.on("leave-match", async (matchId: string) => {
    socket.leave(`match-${matchId}`);
    await broadcastMatchViewers(matchId);
    await broadcastGlobalViewers();
  });

  socket.on("send-message", async (data: {
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
    if (now - lastMsg < 1000) {
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
      console.error("Failed to save message:", err);
    }
  });

  socket.on("match-event", (data: {
    matchId: string;
    type: string;
    minute: number;
    playerName?: string;
    description?: string;
  }) => {
    io.to(`match-${data.matchId}`).emit("match-event", data);
    io.to("global").emit("match-updated", { matchId: data.matchId });
  });

  socket.on("score-update", (data: {
    matchId: string;
    homeScore: number;
    awayScore: number;
    matchMinute: number;
    status: string;
  }) => {
    io.to(`match-${data.matchId}`).emit("score-update", data);
    io.to("global").emit("match-updated", { matchId: data.matchId });
  });

  socket.on("disconnect", async () => {
    const matchId = socket.data.matchId as string | undefined;
    if (matchId) {
      await broadcastMatchViewers(matchId);
    }
    await broadcastGlobalViewers();
  });
});

// ── Auto-live: set SCHEDULED matches to LIVE 30 min before kickoff ──────────
async function autoLiveMatches() {
  const now = new Date();
  const in30min = new Date(now.getTime() + 30 * 60_000);

  // Find SCHEDULED matches whose kickoff is within the next 30 minutes (or already past)
  const matches = await prisma.match.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: in30min },
    },
    select: { id: true, scheduledAt: true },
  });

  if (matches.length === 0) return;

  for (const match of matches) {
    await prisma.match.update({
      where: { id: match.id },
      data: {
        status: "LIVE",
        startedAt: match.scheduledAt, // timer counts from actual kickoff time
        matchMinute: null,            // first half
      },
    });

    // Notify all connected clients so the homepage refreshes
    io.to("global").emit("match-updated", { matchId: match.id });
    console.log(`[auto-live] Match ${match.id} set to LIVE (kickoff: ${match.scheduledAt.toISOString()})`);
  }
}

// Run once at startup, then every 60 seconds
autoLiveMatches();
setInterval(autoLiveMatches, 60_000);

const PORT = process.env.SOCKET_PORT ? parseInt(process.env.SOCKET_PORT) : 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});

export { io };
