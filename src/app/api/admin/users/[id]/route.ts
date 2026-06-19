import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return null;
  }
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, email, password, role, isVIP, isBanned, banReason } = body;

  // Prevent non-super-admins from editing super admins or promoting to super admin
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (target.role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cannot edit a super admin" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (role !== undefined) data.role = role as UserRole;
  if (isVIP !== undefined) data.isVIP = isVIP;
  if (isBanned !== undefined) data.isBanned = isBanned;
  if (banReason !== undefined) data.banReason = banReason || null;
  if (password) data.password = await bcrypt.hash(password, 12);

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true, name: true, email: true, role: true,
      isVIP: true, isBanned: true, banReason: true, createdAt: true,
      _count: { select: { predictions: true, comments: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Prevent deleting yourself or a super admin
  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (target.role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cannot delete a super admin" }, { status: 403 });
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
