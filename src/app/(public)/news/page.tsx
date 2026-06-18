export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Newspaper, Clock, Eye } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Football News",
  description: "Latest football news, transfers, and match reports.",
};

export default async function NewsPage() {
  const [featured, articles, categories] = await Promise.all([
    prisma.news.findMany({
      where: { isPublished: true, isFeatured: true },
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    prisma.news.findMany({
      where: { isPublished: true },
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { publishedAt: "desc" },
      take: 20,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]).catch(() => [[], [], []] as [never[], never[], never[]]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Football News</h1>
            <p className="text-gray-500 text-sm">Latest from the world of football</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-[#00FF84] text-[#0B0F14]">All</button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="px-4 py-1.5 rounded-full text-sm font-medium bg-[#1F2937] text-gray-300 hover:bg-[#00FF84]/10 hover:text-[#00FF84] transition-all"
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {featured.map((article, i) => (
            <Link
              key={article.id}
              href={`/news/${article.slug}`}
              className={`relative rounded-2xl overflow-hidden border border-white/8 group ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
            >
              <div className={`relative ${i === 0 ? "h-80" : "h-44"} bg-[#1F2937]`}>
                {article.featuredImage && (
                  <Image src={article.featuredImage} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                  {article.category && (
                    <span className="text-xs font-bold text-[#00FF84] bg-[#00FF84]/10 px-2.5 py-1 rounded-full w-fit mb-2">
                      {article.category.name}
                    </span>
                  )}
                  <h3 className={`font-black text-white group-hover:text-[#00FF84] transition-colors leading-tight ${i === 0 ? "text-xl" : "text-sm"}`}>
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {article.publishedAt ? formatTimeAgo(article.publishedAt) : ""}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* All Articles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.filter((a) => !a.isFeatured).map((article) => (
          <Link key={article.id} href={`/news/${article.slug}`}>
            <div className="rounded-xl overflow-hidden border border-white/8 bg-[#121821] hover:border-[#00FF84]/30 transition-all duration-200 group">
              {article.featuredImage ? (
                <div className="relative h-44 bg-[#1F2937]">
                  <Image src={article.featuredImage} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <div className="h-44 bg-gradient-to-br from-[#1F2937] to-[#0B0F14] flex items-center justify-center">
                  <Newspaper className="w-10 h-10 text-gray-600" />
                </div>
              )}
              <div className="p-4">
                {article.category && (
                  <span className="text-xs font-bold text-[#00FF84]">{article.category.name}</span>
                )}
                <h3 className="font-bold text-white text-sm mt-1 line-clamp-2 group-hover:text-[#00FF84] transition-colors leading-tight">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>
                )}
                <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.publishedAt ? formatTimeAgo(article.publishedAt) : ""}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {article.views}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-20">
          <Newspaper className="w-16 h-16 mx-auto mb-4 text-gray-700" />
          <p className="text-gray-500">No articles yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
