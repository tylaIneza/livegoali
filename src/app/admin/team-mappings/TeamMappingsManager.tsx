"use client";

import { useState } from "react";
import { Plus, Trash2, Link2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface TeamOption {
  id: string;
  name: string;
}

interface Mapping {
  id: string;
  livescoreId: string;
  livescoreName: string;
  team: { id: string; name: string; logo: string | null };
}

interface DetectedTeam {
  id: string;
  name: string;
  league: string;
}

const emptyForm = { teamId: "", livescoreId: "", livescoreName: "" };

export function TeamMappingsManager({ mappings: initial, teams }: { mappings: Mapping[]; teams: TeamOption[] }) {
  const [mappings, setMappings] = useState(initial);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [detected, setDetected] = useState<DetectedTeam[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  const mappedLivescoreIds = new Set(mappings.map((m) => m.livescoreId));

  const detectTeams = async () => {
    setDetecting(true);
    setDetectError(null);
    try {
      const res = await fetch("/api/livescore/detected-teams");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch");
      }
      const data = await res.json();
      setDetected(data.teams ?? []);
      if ((data.teams ?? []).length === 0) toast("No matches found on Livescore for today", { icon: "ℹ️" });
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : "Failed to fetch teams from Livescore");
    } finally {
      setDetecting(false);
    }
  };

  const pickDetected = (t: DetectedTeam) => {
    setForm((f) => ({ ...f, livescoreId: t.id, livescoreName: t.name }));
  };

  const createMapping = async () => {
    if (!form.teamId || !form.livescoreId || !form.livescoreName) {
      toast.error("Pick a team and a Livescore team (or fill in the ID/name manually)");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/team-mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create mapping");
      setMappings((prev) => [data, ...prev]);
      setForm(emptyForm);
      toast.success("Mapping created!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create mapping");
    } finally {
      setSaving(false);
    }
  };

  const deleteMapping = async (id: string, name: string) => {
    if (!confirm(`Remove mapping for "${name}"?`)) return;
    try {
      const res = await fetch("/api/team-mappings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setMappings((prev) => prev.filter((m) => m.id !== id));
      toast.success("Mapping removed");
    } catch {
      toast.error("Failed to remove mapping");
    }
  };

  return (
    <div className="space-y-4">
      {/* Detect teams from Livescore */}
      <div className="rounded-2xl border border-white/8 bg-[#121821] p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-[#00FF84]" /> Detect Today&apos;s Livescore Teams
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={detectTeams} disabled={detecting}>
            <RefreshCw className={`w-3 h-3 ${detecting ? "animate-spin" : ""}`} />
            {detecting ? "Fetching..." : "Fetch from Livescore"}
          </Button>
        </div>
        <p className="text-xs text-white/60 mb-3">
          Pulls real team names + IDs from Livescore&apos;s unofficial endpoint for today&apos;s fixtures.
          Click a team below to prefill the mapping form — never type in a Livescore ID from memory.
        </p>
        {detectError && <p className="text-xs text-red-400 mb-3">{detectError}</p>}
        {detected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
            {detected.map((t) => (
              <button
                key={t.id}
                onClick={() => pickDetected(t)}
                disabled={mappedLivescoreIds.has(t.id)}
                title={t.league}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  mappedLivescoreIds.has(t.id)
                    ? "border-white/5 bg-white/3 text-white/30 cursor-not-allowed"
                    : "border-white/10 bg-white/5 text-white/80 hover:border-[#00FF84]/40 hover:text-white"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add mapping */}
      <div className="rounded-2xl border border-white/8 bg-[#121821] p-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <Link2 className="w-4 h-4 text-[#00FF84]" /> Add Mapping
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={form.teamId}
            onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
            className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50 transition-colors"
          >
            <option value="">Select internal team *</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <Input placeholder="Livescore team ID *" value={form.livescoreId} onChange={(e) => setForm((f) => ({ ...f, livescoreId: e.target.value }))} className="font-mono text-xs" />
          <Input placeholder="Livescore team name *" value={form.livescoreName} onChange={(e) => setForm((f) => ({ ...f, livescoreName: e.target.value }))} />
          <Button onClick={createMapping} disabled={saving}>
            <Plus className="w-4 h-4" /> {saving ? "Saving..." : "Add Mapping"}
          </Button>
        </div>
      </div>

      {/* Existing mappings */}
      <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/8">
          <p className="text-sm text-white/75">{mappings.length} team{mappings.length !== 1 ? "s" : ""} mapped</p>
        </div>
        {mappings.length === 0 ? (
          <div className="py-16 text-center text-white/70 text-sm">No mappings yet — nothing will be auto-scored until teams are mapped here.</div>
        ) : (
          <div className="divide-y divide-white/6">
            {mappings.map((m) => (
              <div key={m.id} className="px-5 py-4 flex items-center gap-4">
                {m.team.logo ? (
                  <img src={m.team.logo} alt={m.team.name} className="w-8 h-8 object-contain shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Link2 className="w-4 h-4 text-white/60" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{m.team.name}</p>
                  <p className="text-xs text-white/70 font-mono">Livescore: {m.livescoreName} ({m.livescoreId})</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteMapping(m.id, m.team.name)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
