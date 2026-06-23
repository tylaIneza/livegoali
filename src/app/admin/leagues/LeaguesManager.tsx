"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, X, Globe, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface League {
  id: string;
  name: string;
  country: string;
  season: string;
  logo: string | null;
  isActive: boolean;
  isFeatured: boolean;
  _count: { matches: number; teams: number };
}

export function LeaguesManager({ leagues: initial }: { leagues: League[] }) {
  const router = useRouter();
  const [leagues, setLeagues] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", country: "", season: "", logo: "" });
  const [newForm, setNewForm] = useState({ name: "", country: "", season: "", logo: "" });
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const startEdit = (l: League) => {
    setEditingId(l.id);
    setEditForm({ name: l.name, country: l.country, season: l.season, logo: l.logo ?? "" });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/leagues", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...editForm, logo: editForm.logo || null }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setLeagues((prev) => prev.map((l) => l.id === editingId ? { ...l, ...updated } : l));
      setEditingId(null);
      toast.success("League updated");
    } catch {
      toast.error("Failed to update league");
    } finally {
      setSaving(false);
    }
  };

  const createLeague = async () => {
    if (!newForm.name || !newForm.country || !newForm.season) {
      toast.error("Name, country and season are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newForm, logo: newForm.logo || null }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setLeagues((prev) => [...prev, { ...created, _count: { matches: 0, teams: 0 } }]);
      setNewForm({ name: "", country: "", season: "", logo: "" });
      setShowNew(false);
      toast.success("League created!");
    } catch {
      toast.error("Failed to create league");
    } finally {
      setSaving(false);
    }
  };

  const deleteLeague = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/leagues", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setLeagues((prev) => prev.filter((l) => l.id !== id));
      toast.success("League deleted");
    } catch {
      toast.error("Failed to delete league");
    }
  };

  const toggleActive = async (l: League) => {
    try {
      await fetch("/api/leagues", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: l.id, isActive: !l.isActive }),
      });
      setLeagues((prev) => prev.map((x) => x.id === l.id ? { ...x, isActive: !x.isActive } : x));
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="space-y-4">
      {/* Add new league */}
      <div className="rounded-2xl border border-white/8 bg-[#121821] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#00FF84]" /> Add New League
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowNew(!showNew)}>
            <Plus className="w-3 h-3" /> New League
          </Button>
        </div>

        {showNew && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
            <Input placeholder="League name *" value={newForm.name} onChange={(e) => setNewForm((p) => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Country *" value={newForm.country} onChange={(e) => setNewForm((p) => ({ ...p, country: e.target.value }))} />
            <Input placeholder="Season * (e.g. 2025/26)" value={newForm.season} onChange={(e) => setNewForm((p) => ({ ...p, season: e.target.value }))} />
            <Input placeholder="Logo URL (optional)" value={newForm.logo} onChange={(e) => setNewForm((p) => ({ ...p, logo: e.target.value }))} />
            <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
              <Button onClick={createLeague} disabled={saving}>
                <Plus className="w-4 h-4" /> Create League
              </Button>
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      {/* Leagues list */}
      <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/8">
          <p className="text-sm text-white/75">{leagues.length} leagues total</p>
        </div>
        {leagues.length === 0 ? (
          <div className="py-16 text-center text-white/70 text-sm">No leagues yet</div>
        ) : (
          <div className="divide-y divide-white/6">
            {leagues.map((l) => (
              <div key={l.id} className="px-5 py-4">
                {editingId === l.id ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" />
                    <Input value={editForm.country} onChange={(e) => setEditForm((p) => ({ ...p, country: e.target.value }))} placeholder="Country" />
                    <Input value={editForm.season} onChange={(e) => setEditForm((p) => ({ ...p, season: e.target.value }))} placeholder="Season" />
                    <Input value={editForm.logo} onChange={(e) => setEditForm((p) => ({ ...p, logo: e.target.value }))} placeholder="Logo URL" />
                    <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
                      <Button size="sm" onClick={saveEdit} disabled={saving}><Check className="w-3 h-3" /> Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="w-3 h-3" /> Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    {l.logo ? (
                      <img src={l.logo} alt={l.name} className="w-8 h-8 object-contain shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4 text-white/60" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{l.name}</p>
                      <p className="text-xs text-white/70">{l.country} · {l.season} · {l._count.matches} matches · {l._count.teams} teams</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleActive(l)}
                        className={`text-xs px-2.5 py-1 rounded-full font-bold transition-colors ${l.isActive ? "bg-[#00FF84]/10 text-[#00FF84]" : "bg-white/5 text-white/70"}`}
                      >
                        {l.isActive ? "Active" : "Inactive"}
                      </button>
                      <Button size="sm" variant="ghost" onClick={() => startEdit(l)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteLeague(l.id, l.name)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
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
