import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const take = parseInt(searchParams.get("take") || "20");
  const skip = parseInt(searchParams.get("skip") || "0");

  const articles = await prisma.news.findMany({
    where: { isPublished: true },
    include: { category: { select: { name: true, slug: true } } },
    orderBy: { publishedAt: "desc" },
    take,
    skip,
  });

  return NextResponse.json(articles);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, content, excerpt, featuredImage, isPublished, isFeatured, categoryId } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "Title and content required" }, { status: 400 });
  }

  const slug = body.slug || generateSlug(title) + "-" + Date.now();

  const article = await prisma.news.create({
    data: {
      title,
      slug,
      content,
      excerpt: excerpt || null,
      featuredImage: featuredImage || null,
      isPublished: isPublished ?? false,
      isFeatured: isFeatured ?? false,
      categoryId: categoryId || null,
      publishedAt: isPublished ? new Date() : null,
    },
  });

  return NextResponse.json(article, { status: 201 });
}
