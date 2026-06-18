"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NewArticlePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "",
    featuredImage: "", isPublished: false, isFeatured: false,
  });
  const [saving, setSaving] = useState(false);

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

  const handleTitleChange = (v: string) => {
    setForm((f) => ({ ...f, title: v, slug: generateSlug(v) }));
  };

  const handleSave = async () => {
    if (!form.title || !form.content) { toast.error("Title and content required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, publishedAt: form.isPublished ? new Date() : null }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Article saved!");
      router.push("/admin/news");
    } catch {
      toast.error("Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/news"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <h1 className="text-2xl font-black text-white">New Article</h1>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/8 bg-[#121821] p-6">
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Title *</label>
          <Input placeholder="Article title..." value={form.title} onChange={(e) => handleTitleChange(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Slug</label>
          <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Featured Image URL</label>
          <Input placeholder="https://..." value={form.featuredImage} onChange={(e) => setForm((f) => ({ ...f, featuredImage: e.target.value }))} />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Excerpt</label>
          <textarea
            rows={2}
            placeholder="Short description..."
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00FF84]/40 resize-none"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Content (HTML) *</label>
          <textarea
            rows={12}
            placeholder="<p>Article content...</p>"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00FF84]/40 resize-none font-mono"
          />
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-[#00FF84]" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} />
            <span className="text-sm text-gray-300">Publish immediately</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-[#00FF84]" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} />
            <span className="text-sm text-gray-300">Featured article</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Article"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/news">Cancel</Link>
        </Button>
      </div>
    </div>
  );
}
