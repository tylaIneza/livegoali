import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";

const USERS_CACHE_KEY = "admin:users:all";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return null;
  }
  return session;
}

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const cached = await cacheGet(USERS_CACHE_KEY);
    if (cached) return NextResponse.json(cached);
  } catch {}

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, image: true,
      role: true, isVIP: true, isBanned: true, banReason: true, createdAt: true,
      _count: { select: { predictions: true, comments: true } },
    },
  });

  try { await cacheSet(USERS_CACHE_KEY, users, 30); } catch {}

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, password, role } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: (role as UserRole) ?? "USER",
    },
    select: {
      id: true, name: true, email: true, role: true,
      isVIP: true, isBanned: true, banReason: true, createdAt: true,
      _count: { select: { predictions: true, comments: true } },
    },
  });

  try { await cacheDel(USERS_CACHE_KEY); } catch {}

  return NextResponse.json(user, { status: 201 });
}
