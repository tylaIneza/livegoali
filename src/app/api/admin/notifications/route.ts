import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return null;
  }
  return session;
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, message, type, link, target } = await req.json();

  if (!title || !message || !type) {
    return NextResponse.json({ error: "title, message and type are required" }, { status: 400 });
  }

  if (target === "all") {
    const users = await prisma.user.findMany({ select: { id: true } });
    await prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.id, title, message, type, link: link || null })),
    });
    return NextResponse.json({ sent: users.length });
  }

  // target is a userId
  const user = await prisma.user.findUnique({ where: { id: target } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.notification.create({
    data: { userId: target, title, message, type, link: link || null },
  });

  return NextResponse.json({ sent: 1 });
}
