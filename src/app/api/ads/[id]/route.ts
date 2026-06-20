import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { AdPlacement } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { title, imageUrl, videoUrl, targetUrl, placement, isActive, startDate, endDate, revenue } = await req.json();

  const ad = await prisma.advertisement.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
      ...(targetUrl && { targetUrl }),
      ...(placement && { placement: placement as AdPlacement }),
      ...(isActive !== undefined && { isActive }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(revenue !== undefined && { revenue }),
    },
  });

  return NextResponse.json(ad);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.advertisement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// Track views and clicks
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { type } = await req.json();

  if (type === "view") {
    await prisma.advertisement.update({ where: { id }, data: { views: { increment: 1 } } });
  } else if (type === "click") {
    await prisma.advertisement.update({ where: { id }, data: { clicks: { increment: 1 } } });
  }

  return NextResponse.json({ ok: true });
}
