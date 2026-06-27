"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Trash, Radio, Plus, Minus } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Stream { id: string; url: string; type: string; quality: string; label: string | null; isPrimary: boolean; isActive: boolean; priority: number }
// Convert a UTC Date from the server to a local datetime-local string for the input
function toLocalInputValue(date: Date | string): string {
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

interface Props {
  match: {
    id: string; slug: string; status: string; homeScore: number | null; awayScore: number | null;
    matchMinute: number | null; startedAt: Date | null; scheduledAt: Date; isFeatured: boolean; enableComments: boolean; enableChat: boolean;
    enablePrediction: boolean; venue: string | null; round: string | null; homeTeamId: string; awayTeamId: string; leagueId: string;
    streams: Stream[];
    homeTeam?: { id: string; name: string; logo: string | null } | null;
    awayTeam?: { id: string; name: string; logo: string | null } | null;
  };
  leagues: Array<{ id: string; name: string; country: string }>;
  teams: Array<{ id: string; name: string; logo: string | null }>;
}

const STATUS_OPTIONS = ["SCHEDULED","LIVE","HALFTIME","FINISHED","POSTPONED","CANCELLED"];

export function EditMatchForm({ match, leagues, teams }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(match.status);
  const [scheduledAt, setScheduledAt] = useState(() => toLocalInputValue(match.scheduledAt));
  const [homeScore, setHomeScore] = useState(match.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(match.awayScore ?? 0);
  const [matchMinute, setMatchMinute] = useState(match.matchMinute ?? 0);
  const [recalibrateValue, setRecalibrateValue] = useState("");
  const [recalibrating, setRecalibrating] = useState(false);
  const [streams, setStreams] = useState<Stream[]>(match.streams);
  const [newStream, setNewStream] = useState({ url: "", type: "HLS", quality: "HD", label: "", isPrimary: false });
  const [homeLogo, setHomeLogo] = useState(match.homeTeam?.logo ?? "");
  const [awayLogo, setAwayLogo] = useState(match.awayTeam?.logo ?? "");
  const [savingLogos, setSavingLogos] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, homeScore, awayScore, scheduledAt: new Date(scheduledAt).toISOString() }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Match updated!");
      router.refresh();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleRecalibrate = async () => {
    const m = parseInt(recalibrateValue);
    if (isNaN(m) || m < 0 || m > 120) { toast.error("Enter a valid minute (0–120)"); return; }
    setRecalibrating(true);
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchMinute: m }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Timer recalibrated to ${m}'`);
      setRecalibrateValue("");
      router.refresh();
    } catch {
      toast.error("Failed to recalibrate");
    } finally {
      setRecalibrating(false);
    }
  };

  const addStream = async () => {
    if (!newStream.url) return;
    try {
      const res = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, ...newStream, priority: streams.length }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setStreams((prev) => [...prev, created]);
      setNewStream({ url: "", type: "HLS", quality: "HD", label: "", isPrimary: false });
      toast.success("Stream added!");
    } catch {
      toast.error("Failed to add stream");
    }
  };

  const toggleStream = async (streamId: string, isActive: boolean) => {
    try {
      await fetch("/api/stream", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: streamId, isActive: !isActive }),
      });
      setStreams((prev) => prev.map((s) => s.id === streamId ? { ...s, isActive: !isActive } : s));
    } catch {
      toast.error("Failed");
    }
  };

  const saveLogos = async () => {
    setSavingLogos(true);
    try {
      await Promise.all([
        match.homeTeam && fetch(`/api/teams/${match.homeTeam.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logo: homeLogo || null }),
        }),
        match.awayTeam && fetch(`/api/teams/${match.awayTeam.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logo: awayLogo || null }),
        }),
      ]);
      toast.success("Team logos saved!");
      router.refresh();
    } catch {
      toast.error("Failed to save logos");
    } finally {
      setSavingLogos(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Team Logos */}
      <Card>
        <CardHeader><CardTitle>Team Logos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Home Team */}
            <div className="space-y-2">
              <p className="text-xs text-white/75 font-medium uppercase tracking-wide">Home — {match.homeTeam?.name}</p>
              <div className="flex items-center gap-3">
                {homeLogo ? (
                  <img src={homeLogo} alt="Home" className="w-12 h-12 object-contain rounded-lg bg-white/5 border border-white/10 p-1 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 shrink-0 text-xl">⚽</div>
                )}
                <Input placeholder="Logo URL (https://...)" value={homeLogo} onChange={(e) => setHomeLogo(e.target.value)} />
              </div>
            </div>
            {/* Away Team */}
            <div className="space-y-2">
              <p className="text-xs text-white/75 font-medium uppercase tracking-wide">Away — {match.awayTeam?.name}</p>
              <div className="flex items-center gap-3">
                {awayLogo ? (
                  <img src={awayLogo} alt="Away" className="w-12 h-12 object-contain rounded-lg bg-white/5 border border-white/10 p-1 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 shrink-0 text-xl">⚽</div>
                )}
                <Input placeholder="Logo URL (https://...)" value={awayLogo} onChange={(e) => setAwayLogo(e.target.value)} />
              </div>
            </div>
          </div>
          <Button onClick={saveLogos} disabled={savingLogos} variant="outline" size="sm">
            <Save className="w-4 h-4" />
            {savingLogos ? "Saving logos…" : "Save Logos"}
          </Button>
        </CardContent>
      </Card>

      {/* Kickoff time */}
      <Card>
        <CardHeader><CardTitle>Kickoff Time</CardTitle></CardHeader>
        <CardContent>
          <div className="w-64">
            <label className="text-xs text-white/75 mb-1.5 block">Date & Time (your local time)</label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
            <p className="text-[10px] text-white/40 mt-1">Saved and displayed in your local timezone</p>
          </div>
        </CardContent>
      </Card>

      {/* Match status + score */}
      <Card>
        <CardHeader><CardTitle>Match Status & Score</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {/* Live timer info */}
          {match.startedAt && match.status === "LIVE" && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/8 border border-red-500/20">
              <span className="w-2 h-2 rounded-full bg-red-500 live-pulse shrink-0" />
              <div className="text-xs text-white/80">
                <span className="font-bold text-red-400">Auto-timer running</span>
                {" · "}kicked off at {new Date(match.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {match.matchMinute === 45 && " · 2nd half"}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="w-48">
            <label className="text-xs text-white/75 mb-1.5 block">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <p className="text-[11px] text-white/50 mt-1">
              Setting to <strong>LIVE</strong> auto-starts the timer.{" "}
              LIVE after HALFTIME auto-starts 2nd half from 46'.
            </p>
          </div>

          {/* Score */}
          <div>
            <label className="text-xs text-white/75 mb-3 block">Score</label>
            <div className="flex items-center gap-4">
              {/* Home score */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[11px] text-white/50 font-medium truncate max-w-[80px] text-center">
                  {match.homeTeam?.name ?? "Home"}
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setHomeScore((v) => Math.max(0, v - 1))}
                    className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 text-white font-bold flex items-center justify-center transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number" min={0} max={99}
                    value={homeScore}
                    onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-14 text-center bg-[#0B0F14] border border-white/10 rounded-lg py-2 text-xl font-black text-white focus:outline-none focus:border-[#00FF84]/50 tabular-nums"
                  />
                  <button type="button" onClick={() => setHomeScore((v) => v + 1)}
                    className="w-8 h-8 rounded-lg bg-white/8 hover:bg-[#00FF84]/20 text-[#00FF84] font-bold flex items-center justify-center transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <span className="text-2xl font-black text-white/30 mt-4">–</span>

              {/* Away score */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[11px] text-white/50 font-medium truncate max-w-[80px] text-center">
                  {match.awayTeam?.name ?? "Away"}
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setAwayScore((v) => Math.max(0, v - 1))}
                    className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 text-white font-bold flex items-center justify-center transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number" min={0} max={99}
                    value={awayScore}
                    onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-14 text-center bg-[#0B0F14] border border-white/10 rounded-lg py-2 text-xl font-black text-white focus:outline-none focus:border-[#00FF84]/50 tabular-nums"
                  />
                  <button type="button" onClick={() => setAwayScore((v) => v + 1)}
                    className="w-8 h-8 rounded-lg bg-white/8 hover:bg-[#00FF84]/20 text-[#00FF84] font-bold flex items-center justify-center transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Recalibrate timer */}
          {match.status === "LIVE" && (
            <div>
              <label className="text-xs text-white/75 mb-1.5 block">Recalibrate Timer</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={1} max={120} placeholder="e.g. 67"
                  value={recalibrateValue}
                  onChange={(e) => setRecalibrateValue(e.target.value)}
                  className="w-24 text-center bg-[#0B0F14] border border-white/10 rounded-lg py-2 text-sm font-bold text-white focus:outline-none focus:border-[#00FF84]/50 tabular-nums placeholder:text-white/20"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleRecalibrate} disabled={recalibrating || !recalibrateValue}>
                  {recalibrating ? "Setting…" : "Set Minute"}
                </Button>
              </div>
              <p className="text-[11px] text-white/50 mt-1">Adjusts the live clock to show this minute and keep auto-counting from there.</p>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Update Match"}
          </Button>
        </CardContent>
      </Card>

      {/* Streams */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#00FF84]" />
            Stream Sources ({streams.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {streams.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#0B0F14] border border-white/8">
              <div className={`w-2 h-2 rounded-full shrink-0 ${s.isActive ? "bg-[#00FF84]" : "bg-red-500"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium truncate">{s.label || `Stream ${i + 1}`} — {s.type} {s.quality}</p>
                <p className="text-[10px] text-white/60 truncate">{s.url}</p>
              </div>
              <button onClick={() => toggleStream(s.id, s.isActive)}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${s.isActive ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-[#00FF84]/10 text-[#00FF84] hover:bg-[#00FF84]/20"}`}>
                {s.isActive ? "Disable" : "Enable"}
              </button>
            </div>
          ))}

          {/* Add new stream */}
          <div className="pt-2 border-t border-white/8">
            <p className="text-xs text-white/70 mb-2 font-medium">Add New Stream</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
              <div className="sm:col-span-3">
                <Input placeholder="Stream URL (https://...m3u8)" value={newStream.url} onChange={(e) => setNewStream((p) => ({ ...p, url: e.target.value }))} />
              </div>
              <select value={newStream.type} onChange={(e) => setNewStream((p) => ({ ...p, type: e.target.value }))}
                className="bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50">
                <option value="HLS">HLS</option><option value="DASH">DASH</option><option value="MP4">MP4</option>
              </select>
              <select value={newStream.quality} onChange={(e) => setNewStream((p) => ({ ...p, quality: e.target.value }))}
                className="bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50">
                <option value="4K">4K</option><option value="FHD">FHD</option><option value="HD">HD</option><option value="SD">SD</option>
              </select>
              <Input placeholder="Label (optional)" value={newStream.label} onChange={(e) => setNewStream((p) => ({ ...p, label: e.target.value }))} />
            </div>
            <Button variant="outline" size="sm" onClick={addStream} disabled={!newStream.url}>
              <Plus className="w-3.5 h-3.5" /> Add Stream
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" asChild>
        <Link href="/admin/matches">← Back to Matches</Link>
      </Button>
    </div>
  );
}
