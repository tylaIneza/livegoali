import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const sports = await prisma.sport.findMany({
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json(sports);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, icon, enabled, displayOrder } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const sport = await prisma.sport.create({
    data: {
      name: name.trim(),
      slug,
      icon: icon || "🏆",
      enabled: enabled ?? true,
      displayOrder: displayOrder ?? 0,
    },
  });

  return NextResponse.json(sport, { status: 201 });
}
