"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, MousePointer, Megaphone, TrendingUp, DollarSign, Pause, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import toast from "react-hot-toast";

type AdPlacement = "HEADER" | "SIDEBAR" | "FOOTER" | "IN_PLAYER" | "VIDEO" | "POPUP" | "SPONSORED";

interface Ad {
  id: string;
  title: string;
  imageUrl: string | null;
  videoUrl: string | null;
  targetUrl: string;
  placement: AdPlacement;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  views: number;
  clicks: number;
  revenue: number;
  createdAt: string;
}

const PLACEMENTS: AdPlacement[] = ["HEADER", "SIDEBAR", "FOOTER", "IN_PLAYER", "VIDEO", "POPUP", "SPONSORED"];

const placementColor: Record<AdPlacement, string> = {
  HEADER: "bg-blue-500/15 text-blue-400",
  SIDEBAR: "bg-purple-500/15 text-purple-400",
  FOOTER: "bg-gray-500/15 text-gray-400",
  IN_PLAYER: "bg-red-500/15 text-red-400",
  VIDEO: "bg-orange-500/15 text-orange-400",
  POPUP: "bg-yellow-500/15 text-yellow-400",
  SPONSORED: "bg-[#00FF84]/15 text-[#00FF84]",
};

interface FormState {
  title: string;
  imageUrl: string;
  videoUrl: string;
  targetUrl: string;
  placement: AdPlacement;
  startDate: string;
  endDate: string;
  revenue: string;
}

const emptyForm = (): FormState => ({
  title: "", imageUrl: "", videoUrl: "", targetUrl: "",
  placement: "HEADER", startDate: "", endDate: "", revenue: "",
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function Inp({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl bg-[#0B0F14] border border-white/10 px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00FF84]/50 transition-colors ${className}`}
    />
  );
}

export function AdsManager() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Ad | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchAds = async () => {
    try {
      const res = await fetch("/api/ads");
      // fetch all including inactive for admin — use a separate admin endpoint approach
      const data = await res.json();
      setAds(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  // Admin needs all ads, not just active ones — fetch from prisma via server action isn't available here
  // So we'll fetch all via the public endpoint and also do a separate admin fetch
  useEffect(() => {
    // Fetch all ads (active + inactive) for admin view
    fetch("/api/ads?all=1")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setAds(d); })
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setForm(emptyForm()); setAddOpen(true); };
  const openEdit = (ad: Ad) => {
    setForm({
      title: ad.title,
      imageUrl: ad.imageUrl ?? "",
      videoUrl: ad.videoUrl ?? "",
      targetUrl: ad.targetUrl,
      placement: ad.placement,
      startDate: ad.startDate ? ad.startDate.slice(0, 16) : "",
      endDate: ad.endDate ? ad.endDate.slice(0, 16) : "",
      revenue: ad.revenue.toString(),
    });
    setEditTarget(ad);
  };

  const handleAdd = async () => {
    if (!form.title || !form.targetUrl) { toast.error("Title and target URL are required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, revenue: parseFloat(form.revenue) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      setAds((p) => [data, ...p]);
      setAddOpen(false);
      toast.success("Ad created!");
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/ads/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, revenue: parseFloat(form.revenue) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      setAds((p) => p.map((a) => a.id === editTarget.id ? { ...a, ...data } : a));
      setEditTarget(null);
      toast.success("Ad updated!");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/ads/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete"); return; }
      setAds((p) => p.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Ad deleted");
    } finally { setDeleting(false); }
  };

  const toggleActive = async (ad: Ad) => {
    try {
      const res = await fetch(`/api/ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !ad.isActive }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error("Failed"); return; }
      setAds((p) => p.map((a) => a.id === ad.id ? { ...a, ...data } : a));
      toast.success(data.isActive ? "Ad activated" : "Ad paused");
    } catch { toast.error("Failed"); }
  };

  const totalViews = ads.reduce((s, a) => s + a.views, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const totalRevenue = ads.reduce((s, a) => s + a.revenue, 0);
  const avgCTR = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : "0.00";

  const FormBody = (
    <div className="space-y-4">
      <Field label="Title *">
        <Inp placeholder="Ad title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      </Field>
      <Field label="Target URL * (where clicking takes users)">
        <Inp placeholder="https://..." value={form.targetUrl} onChange={(e) => setForm((f) => ({ ...f, targetUrl: e.target.value }))} />
      </Field>
      <Field label="Placement">
        <div className="flex flex-wrap gap-2">
          {PLACEMENTS.map((p) => (
            <button key={p} type="button" onClick={() => setForm((f) => ({ ...f, placement: p }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${form.placement === p ? "border-[#00FF84] bg-[#00FF84]/15 text-[#00FF84]" : "border-white/10 text-gray-500 hover:border-white/20 hover:text-white"}`}>
              {p}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Image URL (banner image)">
        <Inp placeholder="https://... (jpg, png, gif)" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
        {form.imageUrl && (
          <img src={form.imageUrl} alt="preview" className="mt-2 h-20 rounded-lg object-cover border border-white/10" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        )}
      </Field>
      <Field label="Video URL (optional)">
        <Inp placeholder="https://... (mp4)" value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start Date (optional)">
          <Inp type="datetime-local" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
        </Field>
        <Field label="End Date (optional)">
          <Inp type="datetime-local" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
        </Field>
      </div>
      <Field label="Revenue ($)">
        <Inp type="number" min="0" step="0.01" placeholder="0.00" value={form.revenue} onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))} />
      </Field>
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Advertisement Management</h1>
            <p className="text-gray-500 text-sm mt-1">{ads.length} ads · {ads.filter((a) => a.isActive).length} active</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00FF84] text-[#0B0F14] font-bold text-sm hover:bg-[#00C864] transition-colors">
            <Plus className="w-4 h-4" /> New Ad
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, color: "text-blue-400" },
            { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointer, color: "text-[#00FF84]" },
            { label: "Avg CTR", value: `${avgCTR}%`, icon: TrendingUp, color: "text-yellow-400" },
            { label: "Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-[#121821] p-4 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color} shrink-0`} />
              <div>
                <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Placements overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {PLACEMENTS.map((p) => {
            const count = ads.filter((a) => a.placement === p).length;
            const active = ads.filter((a) => a.placement === p && a.isActive).length;
            return (
              <div key={p} className="rounded-xl border border-white/8 bg-[#121821] p-3 text-center">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${placementColor[p]}`}>{p}</span>
                <div className="text-lg font-black text-white mt-1">{count}</div>
                <div className="text-[10px] text-gray-600">{active} active</div>
              </div>
            );
          })}
        </div>

        {/* Ads table */}
        <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-[#00FF84]/30 border-t-[#00FF84] animate-spin" />
            </div>
          ) : ads.length === 0 ? (
            <div className="py-16 text-center">
              <Megaphone className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No ads yet. Create one to start monetizing.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Ad</th>
                    <th className="px-4 py-3 text-left">Placement</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Views</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Clicks</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">CTR</th>
                    <th className="px-4 py-3 text-left hidden lg:table-cell">Revenue</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ads.map((ad) => {
                    const ctr = ad.views > 0 ? ((ad.clicks / ad.views) * 100).toFixed(2) : "0.00";
                    return (
                      <tr key={ad.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {ad.imageUrl ? (
                              <img src={ad.imageUrl} alt={ad.title} className="w-10 h-8 object-cover rounded border border-white/10 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : (
                              <div className="w-10 h-8 rounded border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                                <Megaphone className="w-3 h-3 text-gray-600" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate max-w-[140px]">{ad.title}</p>
                              <p className="text-[10px] text-gray-600 truncate max-w-[140px]">{ad.targetUrl}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${placementColor[ad.placement]}`}>{ad.placement}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-400">{ad.views.toLocaleString()}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-400">{ad.clicks.toLocaleString()}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-[#00FF84]">{ctr}%</td>
                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-purple-400">${ad.revenue.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleActive(ad)}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${ad.isActive ? "bg-[#00FF84]/10 text-[#00FF84] hover:bg-red-500/10 hover:text-red-400" : "bg-red-500/10 text-red-400 hover:bg-[#00FF84]/10 hover:text-[#00FF84]"}`}>
                            {ad.isActive ? <><Play className="w-2.5 h-2.5" /> Active</> : <><Pause className="w-2.5 h-2.5" /> Paused</>}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(ad)} className="p-1.5 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteTarget(ad)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Advertisement</DialogTitle></DialogHeader>
          {FormBody}
          <DialogFooter className="mt-2">
            <button onClick={() => setAddOpen(false)} className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white transition-colors">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="px-4 py-2 rounded-xl bg-[#00FF84] text-[#0B0F14] font-bold text-sm hover:bg-[#00C864] disabled:opacity-50 transition-colors">
              {saving ? "Creating…" : "Create Ad"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Ad</DialogTitle></DialogHeader>
          {FormBody}
          <DialogFooter className="mt-2">
            <button onClick={() => setEditTarget(null)} className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white transition-colors">Cancel</button>
            <button onClick={handleEdit} disabled={saving} className="px-4 py-2 rounded-xl bg-[#00FF84] text-[#0B0F14] font-bold text-sm hover:bg-[#00C864] disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-red-400 flex items-center gap-2"><Trash2 className="w-5 h-5" /> Delete Ad</DialogTitle></DialogHeader>
          <p className="text-gray-300 text-sm py-2">Delete <span className="font-bold text-white">"{deleteTarget?.title}"</span>? This cannot be undone.</p>
          <DialogFooter>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white transition-colors">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 disabled:opacity-50 transition-colors">
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
