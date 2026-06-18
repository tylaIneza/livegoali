import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");
  const after = searchParams.get("after");

  if (!matchId) return NextResponse.json([], { status: 400 });

  const messages = await prisma.liveChatMessage.findMany({
    where: {
      matchId,
      isDeleted: false,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, image: true, role: true, isVIP: true } },
    },
    orderBy: { createdAt: "asc" },
    take: after ? 50 : 80,
  });

  return NextResponse.json(messages.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    user: m.user,
  })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { matchId, content } = await req.json();
  if (!matchId || !content?.trim()) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const message = await prisma.liveChatMessage.create({
    data: {
      matchId,
      userId: session.user.id,
      content: content.trim().slice(0, 200),
    },
    include: {
      user: { select: { id: true, name: true, image: true, role: true, isVIP: true } },
    },
  });

  return NextResponse.json({
    id: message.id,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    user: message.user,
  }, { status: 201 });
}
