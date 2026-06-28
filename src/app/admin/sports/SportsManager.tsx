"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, GripVertical, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface Sport {
  id: string;
  name: string;
  slug: string;
  icon: string;
  enabled: boolean;
  displayOrder: number;
  _count: { matches: number };
}

interface Props {
  initialSports: Sport[];
}

const COMMON_ICONS = ["⚽", "🏀", "🏐", "🏎", "🥊", "🎾", "🏏", "🏆", "🎽", "🏊", "🚴", "⛳", "🎿", "🏒", "🏑"];

export function SportsManager({ initialSports }: Props) {
  const [sports, setSports] = useState<Sport[]>(initialSports);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("🏆");

  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) { toast.error("Name is required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/sports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, icon: newIcon, displayOrder: sports.length }),
      });
      if (!res.ok) throw new Error("Failed");
      const sport = await res.json();
      setSports((prev) => [...prev, { ...sport, _count: { matches: 0 } }]);
      setNewName("");
      setNewIcon("🏆");
      setShowAdd(false);
      toast.success("Sport added!");
    } catch {
      toast.error("Failed to add sport");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, icon: editIcon }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setSports((prev) => prev.map((s) => s.id === id ? { ...s, ...updated } : s));
      setEditId(null);
      toast.success("Sport updated!");
    } catch {
      toast.error("Failed to update sport");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (sport: Sport) => {
    try {
      const res = await fetch(`/api/sports/${sport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !sport.enabled }),
      });
      if (!res.ok) throw new Error("Failed");
      setSports((prev) => prev.map((s) => s.id === sport.id ? { ...s, enabled: !s.enabled } : s));
    } catch {
      toast.error("Failed to toggle sport");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sport? Existing events will lose their sport association.")) return;
    try {
      const res = await fetch(`/api/sports/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setSports((prev) => prev.filter((s) => s.id !== id));
      toast.success("Sport deleted");
    } catch {
      toast.error("Failed to delete sport");
    }
  };

  const startEdit = (sport: Sport) => {
    setEditId(sport.id);
    setEditName(sport.name);
    setEditIcon(sport.icon);
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const updated = [...sports];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    const reordered = updated.map((s, i) => ({ ...s, displayOrder: i }));
    setSports(reordered);
    await Promise.all(
      reordered.map((s) =>
        fetch(`/api/sports/${s.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: s.displayOrder }),
        })
      )
    );
  };

  const moveDown = async (index: number) => {
    if (index === sports.length - 1) return;
    const updated = [...sports];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    const reordered = updated.map((s, i) => ({ ...s, displayOrder: i }));
    setSports(reordered);
    await Promise.all(
      reordered.map((s) =>
        fetch(`/api/sports/${s.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: s.displayOrder }),
        })
      )
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Sports list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Supported Sports ({sports.length})</CardTitle>
            <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
              <Plus className="w-3.5 h-3.5" /> Add Sport
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {sports.map((sport, index) => (
            <div
              key={sport.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#0B0F14] border border-white/8"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-0.5 text-white/40 hover:text-white/80 disabled:opacity-20 transition-colors"
                  title="Move up"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-2xl w-8 text-center shrink-0">{sport.icon}</span>

              {editId === sport.id ? (
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-40"
                    placeholder="Sport name"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {COMMON_ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setEditIcon(ic)}
                        className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${editIcon === ic ? "bg-[#00FF84]/20 ring-1 ring-[#00FF84]/60" : "bg-white/5 hover:bg-white/10"}`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEdit(sport.id)} disabled={submitting}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{sport.name}</p>
                    <p className="text-[11px] text-white/50">{sport._count.matches} events</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(sport)}
                      title={sport.enabled ? "Disable" : "Enable"}
                      className="transition-colors"
                    >
                      {sport.enabled ? (
                        <ToggleRight className="w-6 h-6 text-[#00FF84]" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-white/40" />
                      )}
                    </button>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${sport.enabled ? "bg-[#00FF84]/10 text-[#00FF84]" : "bg-white/5 text-white/50"}`}>
                      {sport.enabled ? "Active" : "Disabled"}
                    </span>
                    <button
                      onClick={() => startEdit(sport)}
                      className="p-1.5 rounded-lg hover:bg-white/8 text-white/60 hover:text-white transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sport.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/60 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {sports.length === 0 && (
            <p className="text-white/50 text-sm text-center py-6">No sports configured yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Add sport form */}
      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle>Add Sport</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-white/75 mb-1.5 block">Sport Name *</label>
              <Input
                placeholder="e.g. Rugby"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <div>
              <label className="text-sm text-white/75 mb-1.5 block">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {COMMON_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setNewIcon(ic)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${newIcon === ic ? "bg-[#00FF84]/20 ring-1 ring-[#00FF84]/60" : "bg-white/5 hover:bg-white/10"}`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Or paste custom emoji"
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                className="mt-2 max-w-xs"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleAdd} disabled={submitting || !newName.trim()}>
                <Plus className="w-4 h-4" /> Add Sport
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
