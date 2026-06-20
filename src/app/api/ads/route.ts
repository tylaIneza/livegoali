import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { AdPlacement } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const placement = searchParams.get("placement") as AdPlacement | null;
  const all = searchParams.get("all") === "1"; // admin: return all including inactive

  const now = new Date();
  const ads = await prisma.advertisement.findMany({
    where: all ? {} : {
      isActive: true,
      ...(placement ? { placement } : {}),
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(ads);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, imageUrl, videoUrl, targetUrl, placement, startDate, endDate } = await req.json();
  if (!title || !targetUrl || !placement) {
    return NextResponse.json({ error: "Title, target URL and placement are required" }, { status: 400 });
  }

  const ad = await prisma.advertisement.create({
    data: {
      title,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
      targetUrl,
      placement: placement as AdPlacement,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  return NextResponse.json(ad, { status: 201 });
}
