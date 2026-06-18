import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";

export async function GET() {
  const leagues = await prisma.league.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, country: true, season: true, logo: true, isActive: true, isFeatured: true },
  });
  return NextResponse.json(leagues);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, country, season, logo } = await req.json();
  if (!name || !country || !season) {
    return NextResponse.json({ error: "name, country and season are required" }, { status: 400 });
  }
  const base = generateSlug(`${name}-${season}`);
  const slug = `${base}-${Date.now()}`;
  const league = await prisma.league.create({
    data: { name, country, season, logo: logo || null, slug },
  });
  return NextResponse.json(league, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, name, country, season, logo, isActive, isFeatured } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const league = await prisma.league.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(country && { country }),
      ...(season && { season }),
      ...(logo !== undefined && { logo }),
      ...(isActive !== undefined && { isActive }),
      ...(isFeatured !== undefined && { isFeatured }),
    },
  });
  return NextResponse.json(league);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await req.json();
  await prisma.league.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
