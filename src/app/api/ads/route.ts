import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cacheGet, cacheSet, cacheDelPattern } from "@/lib/redis";
import type { AdPlacement } from "@prisma/client";

const AD_CACHE_TTL = 60; // seconds — ads rarely change

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const placement = searchParams.get("placement") as AdPlacement | null;
  const all = searchParams.get("all") === "1"; // admin: return all including inactive

  // Skip cache for admin requests
  if (!all) {
    const cacheKey = `ads:${placement ?? "all"}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    const now = new Date();
    const ads = await prisma.advertisement.findMany({
      where: {
        isActive: true,
        ...(placement ? { placement } : {}),
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    await cacheSet(cacheKey, ads, AD_CACHE_TTL);
    return NextResponse.json(ads);
  }

  const ads = await prisma.advertisement.findMany({ orderBy: { createdAt: "desc" } });
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

  // Bust all ad caches so the new ad appears immediately
  await cacheDelPattern("ads:*");

  return NextResponse.json(ad, { status: 201 });
}
