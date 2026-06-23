export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Newspaper, Plus, Edit, Eye, EyeOff, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from "@/lib/utils";

export default async function AdminNewsPage() {
  const [articles, total, published] = await Promise.all([
    prisma.news.findMany({
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.news.count(),
    prisma.news.count({ where: { isPublished: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">News Management</h1>
          <p className="text-white/70 text-sm mt-1">
            {total} total · <span className="text-[#00FF84]">{published} published</span>
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/news/new">
            <Plus className="w-4 h-4" /> New Article
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-white/70 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Views</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 max-w-xs">
                    <div>
                      <p className="font-medium text-white text-sm truncate">{article.title}</p>
                      {article.isFeatured && <Badge variant="hot" className="text-[10px] px-1.5 py-0 mt-0.5">Featured</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-white/75">{article.category?.name || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-white/75">{article.views.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-white/70">{formatTimeAgo(article.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {article.isPublished ? (
                      <Badge variant="default" className="text-[10px]">Published</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Draft</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link href={`/news/${article.slug}`} target="_blank">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-400">
                        <Trash className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {articles.length === 0 && (
          <div className="text-center py-16">
            <Newspaper className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-white/70 text-sm mb-4">No articles yet.</p>
            <Button asChild size="sm">
              <Link href="/admin/news/new"><Plus className="w-4 h-4" /> Create First Article</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
