import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cacheGet, cacheSet, cacheDel, acquireLock, releaseLock } from "@/lib/redis";
import { z } from "zod";

const commentSchema = z.object({
  matchId: z.string().min(1),
  content: z.string().min(1).max(500),
  parentId: z.string().optional(),
});

function commentsCacheKey(matchId: string) {
  return `comments:${matchId}`;
}

function commentsLockKey(matchId: string) {
  return `lock:comments:${matchId}`;
}

// CommentSection polls this every 30s per viewer (src/components/match/
// CommentSection.tsx) — a popular match with hundreds of concurrent viewers
// turned into hundreds of identical queries every 30s. A short TTL cuts that
// to one query per match per window while staying effectively real-time.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  const key = commentsCacheKey(matchId);
  try {
    const cached = await cacheGet(key);
    if (cached) return NextResponse.json(cached);
  } catch {}

  // Lock-protected cache miss (same pattern as match:live/match:detail and
  // the chat-history fetch in src/server/socket.ts) — without this, a burst
  // of viewers all missing the 5s cache window at the same moment each ran
  // this query themselves instead of one query plus N short waits.
  const lockKey = commentsLockKey(matchId);
  const gotLock = await acquireLock(lockKey, 5);
  if (!gotLock) {
    await new Promise((r) => setTimeout(r, 150));
    try {
      const cached = await cacheGet(key);
      if (cached) return NextResponse.json(cached);
    } catch {}
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { matchId, parentId: null, isDeleted: false },
      include: {
        user: { select: { id: true, name: true, image: true, role: true, isVIP: true } },
        _count: { select: { replies: true } },
        replies: {
          where: { isDeleted: false },
          include: {
            user: { select: { id: true, name: true, image: true, role: true, isVIP: true } },
          },
          orderBy: { createdAt: "asc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    try { await cacheSet(key, comments, 5); } catch {}

    return NextResponse.json(comments);
  } finally {
    if (gotLock) await releaseLock(lockKey);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json();
  const result = commentSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { matchId, content, parentId } = result.data;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { enableComments: true },
  });

  if (!match?.enableComments) {
    return NextResponse.json({ error: "Comments disabled for this match" }, { status: 403 });
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      userId: session.user.id,
      matchId,
      parentId,
    },
    include: {
      user: { select: { id: true, name: true, image: true, role: true, isVIP: true } },
    },
  });

  try { await cacheDel(commentsCacheKey(matchId)); } catch {}

  return NextResponse.json(comment, { status: 201 });
}
