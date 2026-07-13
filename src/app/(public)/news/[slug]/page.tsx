export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Clock, Eye, Tag, ArrowLeft } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import type { Metadata } from "next";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.news.findUnique({ where: { slug }, select: { title: true, seoDescription: true, featuredImage: true } });
  if (!article) return { title: "Article Not Found" };
  return {
    title: article.title,
    description: article.seoDescription || undefined,
    openGraph: {
      title: article.title,
      description: article.seoDescription || undefined,
      images: article.featuredImage ? [article.featuredImage] : [],
    },
  };
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;

  const article = await prisma.news.findUnique({
    where: { slug, isPublished: true },
    include: {
      category: { select: { name: true, slug: true } },
      tags: { include: { tag: { select: { name: true, slug: true } } } },
    },
  }).catch(() => null);

  if (!article) notFound();

  // Increment views (fire and forget)
  prisma.news.update({ where: { id: article.id }, data: { views: { increment: 1 } } }).catch(() => {});

  // Related articles
  const related = await prisma.news.findMany({
    where: {
      isPublished: true,
      categoryId: article.categoryId,
      id: { not: article.id },
    },
    include: { category: true },
    orderBy: { publishedAt: "desc" },
    take: 3,
  }).catch(() => []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/news" className="inline-flex items-center gap-2 text-white/75 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to News
      </Link>

      {/* Category & meta */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {article.category && (
          <Link href={`/news?category=${article.category.slug}`} className="text-xs font-bold text-primary bg-primary/10 border border-primary/30 px-3 py-1 rounded-full">
            {article.category.name}
          </Link>
        )}
        {article.isSponsored && (
          <span className="text-xs font-bold text-warning bg-warning/10 border border-warning/30 px-3 py-1 rounded-full">SPONSORED</span>
        )}
        <div className="flex items-center gap-1 text-xs text-white/70">
          <Clock className="w-3 h-3" />
          {article.publishedAt ? formatTimeAgo(article.publishedAt) : ""}
        </div>
        <div className="flex items-center gap-1 text-xs text-white/70">
          <Eye className="w-3 h-3" />
          {article.views} views
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-6">
        {article.title}
      </h1>

      {/* Featured image */}
      {article.featuredImage && (
        <div className="relative rounded-2xl overflow-hidden h-64 sm:h-96 mb-8 border border-white/8">
          <Image src={article.featuredImage} alt={article.title} fill className="object-cover" />
        </div>
      )}

      {/* Excerpt */}
      {article.excerpt && (
        <p className="text-lg text-gray-300 font-medium leading-relaxed mb-8 pb-8 border-b border-white/8">
          {article.excerpt}
        </p>
      )}

      {/* Content */}
      <div
        className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-p:text-gray-300 prose-a:text-primary prose-strong:text-white"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="mt-8 pt-8 border-t border-white/8">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-4 h-4 text-white/70" />
            {article.tags.map((t) => (
              <span key={t.tagId} className="text-xs font-medium text-white/75 bg-muted px-3 py-1 rounded-full hover:text-white transition-colors cursor-pointer">
                #{t.tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-black text-white mb-5">Related Articles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link key={r.id} href={`/news/${r.slug}`}>
                <div className="rounded-xl overflow-hidden border border-white/8 bg-card hover:border-primary/30 transition-all group">
                  {r.featuredImage ? (
                    <div className="relative h-36">
                      <Image src={r.featuredImage} alt={r.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="h-36 bg-muted" />
                  )}
                  <div className="p-3">
                    <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-primary transition-colors">{r.title}</h4>
                    <p className="text-xs text-white/70 mt-1">{r.publishedAt ? formatTimeAgo(r.publishedAt) : ""}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
