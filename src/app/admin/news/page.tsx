export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsTable } from "@/components/admin/NewsTable";

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

      <div className="rounded-2xl border border-white/8 bg-card overflow-hidden">
        <NewsTable articles={articles} />
      </div>
    </div>
  );
}
