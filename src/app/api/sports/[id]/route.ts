import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, icon, enabled, displayOrder } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) {
    data.name = name.trim();
    data.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  if (icon !== undefined) data.icon = icon;
  if (enabled !== undefined) data.enabled = enabled;
  if (displayOrder !== undefined) data.displayOrder = displayOrder;

  const sport = await prisma.sport.update({ where: { id }, data });
  return NextResponse.json(sport);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.sport.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
