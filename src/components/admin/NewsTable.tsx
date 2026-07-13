"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from "@/lib/utils";
import toast from "react-hot-toast";

interface Article {
  id: string;
  title: string;
  slug: string;
  views: number;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Date;
  category: { name: string } | null;
}

export function NewsTable({ articles: initial }: { articles: Article[] }) {
  const router = useRouter();
  const [articles, setArticles] = useState(initial);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const togglePublished = async (article: Article) => {
    setTogglingId(article.id);
    const next = !article.isPublished;
    try {
      const res = await fetch(`/api/news/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: next }),
      });
      if (!res.ok) throw new Error("Failed");
      setArticles((prev) => prev.map((a) => (a.id === article.id ? { ...a, isPublished: next } : a)));
      toast.success(next ? "Article published" : "Article unpublished");
    } catch {
      toast.error("Failed to update article");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/news/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setConfirmId(null);
      toast.success("Article deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete article");
    } finally {
      setDeleting(null);
    }
  };

  if (articles.length === 0) {
    return (
      <div className="text-center py-16 text-white/70">
        <p>No articles yet.</p>
      </div>
    );
  }

  return (
    <>
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Delete Article?</h3>
            <p className="text-white/75 text-sm mb-6">
              This will permanently delete the article. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleting === confirmId}
                onClick={() => handleDelete(confirmId)}
              >
                {deleting === confirmId ? "Deleting…" : "Yes, Delete"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setConfirmId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  <button
                    onClick={() => togglePublished(article)}
                    disabled={togglingId === article.id}
                    className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                      article.isPublished
                        ? "bg-accent/15 text-accent border-accent/30 hover:bg-accent/25"
                        : "bg-white/5 text-white/60 border-white/15 hover:bg-white/10"
                    }`}
                  >
                    {article.isPublished ? "Published" : "Draft"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <Link href={`/news/${article.slug}`} target="_blank">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <Link href={`/admin/news/${article.id}/edit`}>
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-red-400"
                      onClick={() => setConfirmId(article.id)}
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
