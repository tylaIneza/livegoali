"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Newspaper, ArrowRight, Clock } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import type { NewsArticle } from "@/types";

interface Props {
  articles: NewsArticle[];
}

export function NewsSection({ articles }: Props) {
  if (!articles.length) return null;

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Football News</h2>
            <p className="text-sm text-white/70">Latest from the world of football</p>
          </div>
        </div>
        <Link href="/news" className="text-sm text-[#00FF84] hover:underline flex items-center gap-1">
          All News <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Featured */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <Link href={`/news/${featured.slug}`}>
            <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-[#121821] group cursor-pointer h-full min-h-[300px]">
              {featured.featuredImage ? (
                <Image
                  src={featured.featuredImage}
                  alt={featured.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#1F2937] to-[#0B0F14]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                {featured.category && (
                  <span className="inline-block text-xs font-bold text-[#00FF84] bg-[#00FF84]/10 border border-[#00FF84]/30 px-2.5 py-1 rounded-full mb-3 w-fit">
                    {featured.category.name}
                  </span>
                )}
                <h3 className="text-xl font-black text-white mb-2 leading-tight group-hover:text-[#00FF84] transition-colors">
                  {featured.title}
                </h3>
                {featured.excerpt && (
                  <p className="text-sm text-white/75 line-clamp-2 mb-3">{featured.excerpt}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-white/70">
                  <Clock className="w-3 h-3" />
                  {featured.publishedAt ? formatTimeAgo(featured.publishedAt) : ""}
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* List */}
        <div className="space-y-3">
          {rest.slice(0, 4).map((article, i) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/news/${article.slug}`}>
                <div className="flex gap-3 p-3 rounded-xl border border-white/8 bg-[#121821] hover:border-[#00FF84]/30 transition-all duration-200 group cursor-pointer">
                  {article.featuredImage ? (
                    <Image
                      src={article.featuredImage}
                      alt={article.title}
                      width={80}
                      height={60}
                      className="rounded-lg object-cover w-20 h-16 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-16 rounded-lg bg-[#1F2937] shrink-0 flex items-center justify-center">
                      <Newspaper className="w-6 h-6 text-white/60" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-[#00FF84] transition-colors leading-tight">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-1 mt-1 text-xs text-white/70">
                      <Clock className="w-3 h-3" />
                      {article.publishedAt ? formatTimeAgo(article.publishedAt) : ""}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
