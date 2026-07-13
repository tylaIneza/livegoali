import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, isVIP: true, role: true, createdAt: true },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, image } = body as { name?: string; image?: string };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 60) {
      return NextResponse.json({ error: "Name must be 1-60 characters" }, { status: 400 });
    }
    data.name = trimmed;
  }

  if (image !== undefined) {
    const trimmed = image.trim();
    if (trimmed && !/^https?:\/\//.test(trimmed)) {
      return NextResponse.json({ error: "Image must be a valid URL" }, { status: 400 });
    }
    data.image = trimmed || null;
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, email: true, image: true, isVIP: true, role: true, createdAt: true },
  });

  return NextResponse.json(user);
}
