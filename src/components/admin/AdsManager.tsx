"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, MousePointer, Megaphone, TrendingUp, DollarSign, Pause, Play, ExternalLink } from "lucide-react";
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
  HEADER: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  SIDEBAR: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  FOOTER: "bg-gray-500/15 text-white/75 border-white/10",
  IN_PLAYER: "bg-red-500/15 text-red-400 border-red-500/20",
  VIDEO: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  POPUP: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  SPONSORED: "bg-[#00FF84]/15 text-[#00FF84] border-[#00FF84]/20",
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
      <label className="text-xs text-white/60 font-medium uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function Inp({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl bg-[#0B0F14] border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00FF84]/50 focus:ring-1 focus:ring-[#00FF84]/20 transition-all ${className}`}
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

  useEffect(() => {
    fetch("/api/ads?all=1")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setAds(d); })
      .catch(() => toast.error("Failed to load ads"))
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

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleAdd = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.targetUrl.trim()) { toast.error("Target URL is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, revenue: parseFloat(form.revenue) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to create ad"); return; }
      setAds((p) => [data, ...p]);
      setAddOpen(false);
      toast.success("Ad created!");
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/ads/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, revenue: parseFloat(form.revenue) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to update"); return; }
      setAds((p) => p.map((a) => a.id === editTarget.id ? { ...a, ...data } : a));
      setEditTarget(null);
      toast.success("Ad updated!");
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSaving(false);
    }
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
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setDeleting(false);
    }
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
    } catch {
      toast.error("Network error");
    }
  };

  const totalViews = ads.reduce((s, a) => s + a.views, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const totalRevenue = ads.reduce((s, a) => s + a.revenue, 0);
  const avgCTR = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : "0.00";

  const FormBody = (
    <div className="space-y-4">
      <Field label="Title *">
        <Inp placeholder="Ad title" value={form.title} onChange={set("title")} />
      </Field>
      <Field label="Target URL * (where clicking takes users)">
        <Inp placeholder="https://..." value={form.targetUrl} onChange={set("targetUrl")} />
      </Field>
      <Field label="Placement">
        <div className="flex flex-wrap gap-2">
          {PLACEMENTS.map((p) => (
            <button key={p} type="button" onClick={() => setForm((f) => ({ ...f, placement: p }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.placement === p ? "border-[#00FF84] bg-[#00FF84]/15 text-[#00FF84]" : "border-white/10 text-white/60 hover:border-white/25 hover:text-white"}`}>
              {p}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Image URL (banner image)">
        <Inp placeholder="https://... (jpg, png, gif, webp)" value={form.imageUrl} onChange={set("imageUrl")} />
        {form.imageUrl && (
          <img src={form.imageUrl} alt="preview" className="mt-2 h-16 rounded-lg object-cover border border-white/10 max-w-full" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        )}
      </Field>
      <Field label="Video URL (optional, mp4)">
        <Inp placeholder="https://... (mp4)" value={form.videoUrl} onChange={set("videoUrl")} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Start Date (optional)">
          <Inp type="datetime-local" value={form.startDate} onChange={set("startDate")} />
        </Field>
        <Field label="End Date (optional)">
          <Inp type="datetime-local" value={form.endDate} onChange={set("endDate")} />
        </Field>
      </div>
      <Field label="Revenue ($)">
        <Inp type="number" min="0" step="0.01" placeholder="0.00" value={form.revenue} onChange={set("revenue")} />
      </Field>
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Advertisement Management</h1>
            <p className="text-white/60 text-sm mt-0.5">{ads.length} ads · {ads.filter((a) => a.isActive).length} active</p>
          </div>
          <button onClick={openAdd} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00FF84] text-[#0B0F14] font-bold text-sm hover:bg-[#00C864] transition-colors shrink-0">
            <Plus className="w-4 h-4" /> New Ad
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, color: "text-blue-400", bg: "bg-blue-500/8" },
            { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointer, color: "text-[#00FF84]", bg: "bg-[#00FF84]/8" },
            { label: "Avg CTR", value: `${avgCTR}%`, icon: TrendingUp, color: "text-yellow-400", bg: "bg-yellow-500/8" },
            { label: "Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-purple-400", bg: "bg-purple-500/8" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-[#121821] p-4">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-white/60 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Placements overview */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {PLACEMENTS.map((p) => {
            const count = ads.filter((a) => a.placement === p).length;
            const active = ads.filter((a) => a.placement === p && a.isActive).length;
            return (
              <div key={p} className="rounded-xl border border-white/8 bg-[#121821] p-2.5 text-center">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${placementColor[p]}`}>{p}</span>
                <div className="text-base font-black text-white mt-1">{count}</div>
                <div className="text-[10px] text-white/50">{active} active</div>
              </div>
            );
          })}
        </div>

        {/* Ads list */}
        <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 rounded-full border-2 border-[#00FF84]/30 border-t-[#00FF84] animate-spin" />
            </div>
          ) : ads.length === 0 ? (
            <div className="py-16 text-center">
              <Megaphone className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/60 text-sm font-medium">No ads yet</p>
              <p className="text-white/40 text-xs mt-1">Create one to start monetizing</p>
              <button onClick={openAdd} className="mt-4 px-4 py-2 rounded-xl bg-[#00FF84]/10 text-[#00FF84] text-sm font-bold hover:bg-[#00FF84]/20 transition-colors">
                + Create First Ad
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table — hidden on mobile */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8 text-white/50 text-[11px] uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Ad</th>
                      <th className="px-4 py-3 text-left">Placement</th>
                      <th className="px-4 py-3 text-left">Views</th>
                      <th className="px-4 py-3 text-left">Clicks</th>
                      <th className="px-4 py-3 text-left">CTR</th>
                      <th className="px-4 py-3 text-left hidden lg:table-cell">Revenue</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ads.map((ad) => {
                      const ctr = ad.views > 0 ? ((ad.clicks / ad.views) * 100).toFixed(2) : "0.00";
                      return (
                        <tr key={ad.id} className="hover:bg-white/2 transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {ad.imageUrl ? (
                                <img src={ad.imageUrl} alt={ad.title} className="w-12 h-8 object-cover rounded-lg border border-white/10 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              ) : (
                                <div className="w-12 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                                  <Megaphone className="w-3 h-3 text-white/40" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white truncate max-w-[160px]">{ad.title}</p>
                                <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/40 hover:text-[#00FF84] truncate max-w-[160px] flex items-center gap-0.5 transition-colors">
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{ad.targetUrl.replace(/^https?:\/\//, "")}</span>
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${placementColor[ad.placement]}`}>{ad.placement}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-white/70">{ad.views.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-white/70">{ad.clicks.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-[#00FF84] font-semibold">{ctr}%</td>
                          <td className="px-4 py-3 hidden lg:table-cell text-xs text-purple-400 font-semibold">${ad.revenue.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => toggleActive(ad)}
                              className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${ad.isActive
                                ? "bg-[#00FF84]/10 text-[#00FF84] border-[#00FF84]/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-[#00FF84]/10 hover:text-[#00FF84] hover:border-[#00FF84]/20"}`}>
                              {ad.isActive ? <><Play className="w-2.5 h-2.5" /> Active</> : <><Pause className="w-2.5 h-2.5" /> Paused</>}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openEdit(ad)} className="p-1.5 rounded-lg hover:bg-white/8 text-white/50 hover:text-white transition-colors" title="Edit">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeleteTarget(ad)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors" title="Delete">
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

              {/* Mobile cards — shown on small screens */}
              <div className="md:hidden divide-y divide-white/5">
                {ads.map((ad) => {
                  const ctr = ad.views > 0 ? ((ad.clicks / ad.views) * 100).toFixed(2) : "0.00";
                  return (
                    <div key={ad.id} className="p-4 space-y-3">
                      {/* Ad header */}
                      <div className="flex items-center gap-3">
                        {ad.imageUrl ? (
                          <img src={ad.imageUrl} alt={ad.title} className="w-14 h-10 object-cover rounded-lg border border-white/10 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="w-14 h-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                            <Megaphone className="w-4 h-4 text-white/40" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{ad.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${placementColor[ad.placement]}`}>{ad.placement}</span>
                            <button onClick={() => toggleActive(ad)}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border transition-colors ${ad.isActive
                                ? "bg-[#00FF84]/10 text-[#00FF84] border-[#00FF84]/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                              {ad.isActive ? "Active" : "Paused"}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openEdit(ad)} className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(ad)} className="p-2 rounded-lg bg-red-500/8 text-red-400 hover:bg-red-500/15 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "Views", value: ad.views.toLocaleString(), color: "text-blue-400" },
                          { label: "Clicks", value: ad.clicks.toLocaleString(), color: "text-[#00FF84]" },
                          { label: "CTR", value: `${ctr}%`, color: "text-yellow-400" },
                          { label: "Revenue", value: `$${ad.revenue.toFixed(2)}`, color: "text-purple-400" },
                        ].map((s) => (
                          <div key={s.label} className="rounded-lg bg-white/3 p-2 text-center">
                            <div className={`text-xs font-bold ${s.color}`}>{s.value}</div>
                            <div className="text-[10px] text-white/40 mt-0.5">{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* URL */}
                      <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-white/40 hover:text-[#00FF84] transition-colors">
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{ad.targetUrl.replace(/^https?:\/\//, "")}</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Advertisement</DialogTitle></DialogHeader>
          {FormBody}
          <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
            <button onClick={() => setAddOpen(false)} className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 text-white/70 text-sm hover:text-white transition-colors">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#00FF84] text-[#0B0F14] font-bold text-sm hover:bg-[#00C864] disabled:opacity-50 transition-colors">
              {saving ? "Creating…" : "Create Ad"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Ad</DialogTitle></DialogHeader>
          {FormBody}
          <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
            <button onClick={() => setEditTarget(null)} className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 text-white/70 text-sm hover:text-white transition-colors">Cancel</button>
            <button onClick={handleEdit} disabled={saving} className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#00FF84] text-[#0B0F14] font-bold text-sm hover:bg-[#00C864] disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="w-[95vw] max-w-sm">
          <DialogHeader><DialogTitle className="text-red-400 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete Ad</DialogTitle></DialogHeader>
          <p className="text-white/70 text-sm py-1">Delete <span className="font-bold text-white">"{deleteTarget?.title}"</span>? This cannot be undone.</p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <button onClick={() => setDeleteTarget(null)} className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 text-white/70 text-sm hover:text-white transition-colors">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 disabled:opacity-50 transition-colors">
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
