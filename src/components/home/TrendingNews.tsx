import Link from "next/link";
import Image from "next/image";
import { Clock, Newspaper } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { formatTimeAgo } from "@/lib/utils";

interface TrendingNewsItem {
  id: string;
  title: string;
  slug: string;
  featuredImage: string | null;
  publishedAt: Date | string | null;
}

export function TrendingNews({ articles }: { articles: TrendingNewsItem[] }) {
  if (articles.length === 0) return null;

  return (
    <div>
      <SectionHeader
        icon={Newspaper}
        iconClassName="bg-purple-500/10 text-purple-400"
        title="Trending News"
        viewAllHref="/news"
      />
      <div className="space-y-3">
        {articles.slice(0, 4).map((article) => (
          <Link
            key={article.id}
            href={`/news/${article.slug}`}
            className="flex gap-3 group"
          >
            <div className="w-16 h-14 rounded-lg overflow-hidden bg-muted shrink-0 relative">
              {article.featuredImage ? (
                <Image src={article.featuredImage} alt={article.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Newspaper className="w-5 h-5 text-white/30" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                {article.title}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-white/40">
                <Clock className="w-3 h-3" />
                {article.publishedAt ? formatTimeAgo(article.publishedAt) : ""}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
