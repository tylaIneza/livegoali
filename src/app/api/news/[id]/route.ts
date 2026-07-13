import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireEditor() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "EDITOR"].includes(session.user.role)) {
    return null;
  }
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireEditor())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const article = await prisma.news.findUnique({ where: { id } });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(article);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireEditor())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.slug !== undefined) data.slug = body.slug;
  if (body.excerpt !== undefined) data.excerpt = body.excerpt;
  if (body.content !== undefined) data.content = body.content;
  if (body.featuredImage !== undefined) data.featuredImage = body.featuredImage;
  if (body.categoryId !== undefined) data.categoryId = body.categoryId || null;
  if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured;
  if (body.isSponsored !== undefined) data.isSponsored = body.isSponsored;

  if (body.isPublished !== undefined) {
    const current = await prisma.news.findUnique({ where: { id }, select: { isPublished: true, publishedAt: true } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
    data.isPublished = body.isPublished;
    if (body.isPublished && !current.publishedAt) data.publishedAt = new Date();
    if (!body.isPublished) data.publishedAt = null;
  }

  const article = await prisma.news.update({ where: { id }, data });
  return NextResponse.json(article);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireEditor())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.news.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
