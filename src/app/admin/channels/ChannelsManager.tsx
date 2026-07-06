"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

const CATEGORIES = ["SPORTS", "NEWS", "ENTERTAINMENT", "KIDS", "MUSIC", "OTHER"] as const;
type Category = (typeof CATEGORIES)[number];

interface ChannelSource {
  id: string;
  url: string;
  type: string;
  quality: string;
  isPrimary: boolean;
}

interface Channel {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  category: Category;
  description: string | null;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  views: number;
  sources: ChannelSource[];
}

const emptyForm = {
  name: "", category: "SPORTS" as Category, logo: "", description: "",
  streamUrl: "", streamType: "HLS", quality: "HD", order: "0",
};

function primaryUrl(ch: Channel): string {
  return ch.sources.find((s) => s.isPrimary)?.url ?? ch.sources[0]?.url ?? "";
}

export function ChannelsManager({ channels: initial }: { channels: Channel[] }) {
  const [channels, setChannels] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [newForm, setNewForm] = useState(emptyForm);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const startEdit = (ch: Channel) => {
    setEditingId(ch.id);
    setEditForm({
      name: ch.name,
      category: ch.category,
      logo: ch.logo ?? "",
      description: ch.description ?? "",
      streamUrl: primaryUrl(ch),
      streamType: ch.sources.find((s) => s.isPrimary)?.type ?? "HLS",
      quality: ch.sources.find((s) => s.isPrimary)?.quality ?? "HD",
      order: String(ch.order),
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/channels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name: editForm.name,
          category: editForm.category,
          logo: editForm.logo || null,
          description: editForm.description || null,
          streamUrl: editForm.streamUrl,
          streamType: editForm.streamType,
          quality: editForm.quality,
          order: parseInt(editForm.order) || 0,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setChannels((prev) => prev.map((c) => c.id === editingId ? { ...c, ...updated } : c));
      setEditingId(null);
      toast.success("Channel updated");
    } catch {
      toast.error("Failed to update channel");
    } finally {
      setSaving(false);
    }
  };

  const createChannel = async () => {
    if (!newForm.name || !newForm.streamUrl) {
      toast.error("Name and stream URL are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newForm.name,
          category: newForm.category,
          logo: newForm.logo || null,
          description: newForm.description || null,
          streamUrl: newForm.streamUrl,
          streamType: newForm.streamType,
          quality: newForm.quality,
          order: parseInt(newForm.order) || 0,
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setChannels((prev) => [...prev, created]);
      setNewForm(emptyForm);
      setShowNew(false);
      toast.success("Channel created!");
    } catch {
      toast.error("Failed to create channel");
    } finally {
      setSaving(false);
    }
  };

  const deleteChannel = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/channels", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setChannels((prev) => prev.filter((c) => c.id !== id));
      toast.success("Channel deleted");
    } catch {
      toast.error("Failed to delete channel");
    }
  };

  const toggleActive = async (ch: Channel) => {
    try {
      await fetch("/api/channels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ch.id, isActive: !ch.isActive }),
      });
      setChannels((prev) => prev.map((c) => c.id === ch.id ? { ...c, isActive: !c.isActive } : c));
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="space-y-4">
      {/* Add new channel */}
      <div className="rounded-2xl border border-white/8 bg-[#121821] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Tv className="w-4 h-4 text-[#00FF84]" /> Add New Channel
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowNew(!showNew)}>
            <Plus className="w-3 h-3" /> New Channel
          </Button>
        </div>

        {showNew && (
          <ChannelForm form={newForm} setForm={setNewForm} onSubmit={createChannel} onCancel={() => setShowNew(false)} saving={saving} submitLabel="Create Channel" />
        )}
      </div>

      {/* Channels list */}
      <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/8">
          <p className="text-sm text-white/75">{channels.length} channels total</p>
        </div>
        {channels.length === 0 ? (
          <div className="py-16 text-center text-white/70 text-sm">No channels yet</div>
        ) : (
          <div className="divide-y divide-white/6">
            {channels.map((ch) => (
              <div key={ch.id} className="px-5 py-4">
                {editingId === ch.id ? (
                  <ChannelForm form={editForm} setForm={setEditForm} onSubmit={saveEdit} onCancel={() => setEditingId(null)} saving={saving} submitLabel="Save" />
                ) : (
                  <div className="flex items-center gap-4">
                    {ch.logo ? (
                      <img src={ch.logo} alt={ch.name} className="w-8 h-8 object-contain shrink-0 rounded" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Tv className="w-4 h-4 text-white/60" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{ch.name}</p>
                      <p className="text-xs text-white/70">{ch.category} · {ch.views} views · {ch.sources.length} source{ch.sources.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleActive(ch)}
                        className={`text-xs px-2.5 py-1 rounded-full font-bold transition-colors ${ch.isActive ? "bg-[#00FF84]/10 text-[#00FF84]" : "bg-white/5 text-white/70"}`}
                      >
                        {ch.isActive ? "Active" : "Inactive"}
                      </button>
                      <Button size="sm" variant="ghost" onClick={() => startEdit(ch)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteChannel(ch.id, ch.name)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChannelForm({
  form, setForm, onSubmit, onCancel, saving, submitLabel,
}: {
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Input placeholder="Channel name *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
      <select
        value={form.category}
        onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as Category }))}
        className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50 transition-colors"
      >
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <Input placeholder="Logo URL (optional)" value={form.logo} onChange={(e) => setForm((p) => ({ ...p, logo: e.target.value }))} />
      <Input placeholder="Order (sort position)" type="number" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))} />

      <div className="sm:col-span-2 lg:col-span-4">
        <Input placeholder="Stream URL * (.m3u8 or embed URL)" value={form.streamUrl} onChange={(e) => setForm((p) => ({ ...p, streamUrl: e.target.value }))} className="font-mono text-xs" />
      </div>

      <select
        value={form.streamType}
        onChange={(e) => setForm((p) => ({ ...p, streamType: e.target.value }))}
        className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50 transition-colors"
      >
        <option value="HLS">HLS (.m3u8)</option>
        <option value="DASH">DASH (.mpd)</option>
        <option value="MP4">MP4</option>
        <option value="IFRAME">Embed / iframe</option>
      </select>
      <select
        value={form.quality}
        onChange={(e) => setForm((p) => ({ ...p, quality: e.target.value }))}
        className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50 transition-colors"
      >
        <option value="4K">4K Ultra HD</option>
        <option value="FHD">Full HD 1080p</option>
        <option value="HD">HD 720p</option>
        <option value="SD">SD 480p</option>
      </select>
      <div className="sm:col-span-2">
        <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
      </div>

      <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
        <Button onClick={onSubmit} disabled={saving}>
          <Check className="w-4 h-4" /> {saving ? "Saving..." : submitLabel}
        </Button>
        <Button variant="outline" onClick={onCancel}><X className="w-4 h-4" /> Cancel</Button>
      </div>
    </div>
  );
}
