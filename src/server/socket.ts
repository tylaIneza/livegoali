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

// Room: match-{matchId}
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("join-match", async (matchId: string) => {
    const room = `match-${matchId}`;
    socket.join(room);

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

    // Track active viewers
    const sockets = await io.in(room).fetchSockets();
    io.to(room).emit("viewer-count", sockets.length);
  });

  socket.on("leave-match", (matchId: string) => {
    socket.leave(`match-${matchId}`);
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
    const { matchId, content, userId, userName, userImage, userRole, isVIP } = data;

    if (!content?.trim() || !userId) return;

    // Anti-spam: basic rate limiting per socket
    const now = Date.now();
    const lastMsg = (socket as unknown as { lastMessage?: number }).lastMessage || 0;
    if (now - lastMsg < 1000) {
      socket.emit("error", "Slow down!");
      return;
    }
    (socket as unknown as { lastMessage: number }).lastMessage = now;

    try {
      const message = await prisma.liveChatMessage.create({
        data: {
          matchId,
          userId,
          content: content.trim().slice(0, 200),
        },
        include: {
          user: { select: { id: true, name: true, image: true, role: true, isVIP: true } },
        },
      });

      const room = `match-${matchId}`;
      io.to(room).emit("chat-message", {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        user: message.user,
      });
    } catch (err) {
      console.error("Failed to save message:", err);
    }
  });

  // Admin: broadcast match event
  socket.on("match-event", (data: {
    matchId: string;
    type: string;
    minute: number;
    playerName?: string;
    description?: string;
  }) => {
    const room = `match-${data.matchId}`;
    io.to(room).emit("match-event", data);
  });

  // Admin: update score
  socket.on("score-update", (data: {
    matchId: string;
    homeScore: number;
    awayScore: number;
    matchMinute: number;
    status: string;
  }) => {
    const room = `match-${data.matchId}`;
    io.to(room).emit("score-update", data);
  });

  socket.on("disconnect", async () => {
    // Update viewer counts for all rooms this socket was in
    const rooms = [...socket.rooms].filter((r) => r.startsWith("match-"));
    for (const room of rooms) {
      const sockets = await io.in(room).fetchSockets();
      io.to(room).emit("viewer-count", sockets.length);
    }
  });
});

const PORT = process.env.SOCKET_PORT ? parseInt(process.env.SOCKET_PORT) : 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});

export { io };
