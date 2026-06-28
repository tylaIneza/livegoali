"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Radio, Plus, Minus } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Stream {
  id: string; url: string; type: string; quality: string;
  label: string | null; isPrimary: boolean; isActive: boolean; priority: number;
}

function toLocalInputValue(date: Date | string): string {
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

interface Props {
  match: {
    id: string; slug: string; status: string;
    homeScore: number | null; awayScore: number | null;
    matchMinute: number | null; startedAt: Date | null; scheduledAt: Date;
    isFeatured: boolean; enableComments: boolean; enableChat: boolean; enablePrediction: boolean;
    venue: string | null; round: string | null;
    homeTeamId: string | null; awayTeamId: string | null; leagueId: string | null;
    title?: string | null; participant1?: string | null; participant2?: string | null;
    streamUrl?: string | null; streamType?: string; streamQuality?: string;
    streams: Stream[];
    homeTeam?: { id: string; name: string; logo: string | null } | null;
    awayTeam?: { id: string; name: string; logo: string | null } | null;
    sport?: { name: string; icon: string; slug: string } | null;
  };
  leagues: Array<{ id: string; name: string; country: string }>;
  teams: Array<{ id: string; name: string; logo: string | null }>;
}

// Only football has HALFTIME as a meaningful status
const HALFTIME_SPORTS = ["football"];

export function EditMatchForm({ match }: Props) {
  const router = useRouter();

  const sportSlug = match.sport?.slug ?? null;
  const isFootball = sportSlug === "football" || !!match.homeTeamId;
  const hasScore = sportSlug === "football" || (!sportSlug && !!match.homeTeamId);
  const hasHalftime = !sportSlug || HALFTIME_SPORTS.includes(sportSlug);

  const statusOptions = hasHalftime
    ? ["SCHEDULED", "LIVE", "HALFTIME", "FINISHED", "POSTPONED", "CANCELLED"]
    : ["SCHEDULED", "LIVE", "FINISHED", "POSTPONED", "CANCELLED"];

  // Shared state
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(match.status);
  const [scheduledAt, setScheduledAt] = useState(() => toLocalInputValue(match.scheduledAt));
  const [homeScore, setHomeScore] = useState(match.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(match.awayScore ?? 0);
  // Football-only state
  const [streams, setStreams] = useState<Stream[]>(match.streams);
  const [newStream, setNewStream] = useState({ url: "", type: "HLS", quality: "HD", label: "", isPrimary: false });
  const [homeLogo, setHomeLogo] = useState(match.homeTeam?.logo ?? "");
  const [awayLogo, setAwayLogo] = useState(match.awayTeam?.logo ?? "");
  const [savingLogos, setSavingLogos] = useState(false);

  // Non-football state
  const [title, setTitle] = useState(match.title ?? "");
  const [participant1, setParticipant1] = useState(match.participant1 ?? "");
  const [participant2, setParticipant2] = useState(match.participant2 ?? "");
  const [streamUrl, setStreamUrl] = useState(match.streamUrl ?? "");
  const [streamType, setStreamType] = useState(match.streamType ?? "IFRAME");
  const [streamQuality, setStreamQuality] = useState(match.streamQuality ?? "HD");
  const [savingStream, setSavingStream] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, homeScore, awayScore, scheduledAt: new Date(scheduledAt).toISOString() }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Updated!");
      router.refresh();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
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

  const saveEventDetails = async () => {
    setSavingStream(true);
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamUrl: streamUrl.trim() || null,
          streamType,
          streamQuality,
          title: title.trim() || null,
          participant1: participant1.trim() || null,
          participant2: participant2.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Event details saved!");
      router.refresh();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingStream(false);
    }
  };

  // Score labels: use team names for football, participant names for others
  const label1 = isFootball
    ? (match.homeTeam?.name ?? "Home")
    : (participant1 || match.participant1 || "Participant 1");
  const label2 = isFootball
    ? (match.awayTeam?.name ?? "Away")
    : (participant2 || match.participant2 || "Participant 2");

  // Sport display header for non-football
  const sportHeader = match.sport
    ? `${match.sport.icon} ${match.sport.name}`
    : "Event";

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── FOOTBALL ONLY: Team Logos ── */}
      {isFootball && (
        <Card>
          <CardHeader><CardTitle>Team Logos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs text-white/75 font-medium uppercase tracking-wide">
                  Home — {match.homeTeam?.name}
                </p>
                <div className="flex items-center gap-3">
                  {homeLogo ? (
                    <img src={homeLogo} alt="Home"
                      className="w-12 h-12 object-contain rounded-lg bg-white/5 border border-white/10 p-1 shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 shrink-0 text-xl">⚽</div>
                  )}
                  <Input placeholder="Logo URL (https://...)" value={homeLogo} onChange={(e) => setHomeLogo(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-white/75 font-medium uppercase tracking-wide">
                  Away — {match.awayTeam?.name}
                </p>
                <div className="flex items-center gap-3">
                  {awayLogo ? (
                    <img src={awayLogo} alt="Away"
                      className="w-12 h-12 object-contain rounded-lg bg-white/5 border border-white/10 p-1 shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 shrink-0 text-xl">⚽</div>
                  )}
                  <Input placeholder="Logo URL (https://...)" value={awayLogo} onChange={(e) => setAwayLogo(e.target.value)} />
                </div>
              </div>
            </div>
            <Button onClick={saveLogos} disabled={savingLogos} variant="outline" size="sm">
              <Save className="w-4 h-4" />
              {savingLogos ? "Saving…" : "Save Logos"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── NON-FOOTBALL ONLY: Event Details ── */}
      {!isFootball && (
        <Card>
          <CardHeader>
            <CardTitle>{sportHeader} — Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/75 mb-1.5 block">Participant 1</label>
                <Input
                  placeholder={sportSlug === "formula1" ? "e.g. Max Verstappen" : "e.g. Team / Fighter name"}
                  value={participant1}
                  onChange={(e) => setParticipant1(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-white/75 mb-1.5 block">Participant 2</label>
                <Input
                  placeholder={sportSlug === "formula1" ? "e.g. Lewis Hamilton" : "e.g. Team / Fighter name"}
                  value={participant2}
                  onChange={(e) => setParticipant2(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/75 mb-1.5 block">Event Title (optional)</label>
              <Input
                placeholder={
                  sportSlug === "formula1" ? "e.g. Abu Dhabi Grand Prix — Race"
                  : sportSlug === "ufc" ? "e.g. UFC 300: Jones vs Aspinall"
                  : sportSlug === "boxing" ? "e.g. WBC Heavyweight Championship"
                  : "e.g. NBA Finals Game 7"
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Start / Kickoff Time ── */}
      <Card>
        <CardHeader>
          <CardTitle>{isFootball ? "Kickoff Time" : "Start Time"}</CardTitle>
        </CardHeader>
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

      {/* ── Status (football) ── */}
      {isFootball && (
        <Card>
          <CardHeader><CardTitle>Match Status & Score</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="w-48">
              <label className="text-xs text-white/75 mb-1.5 block">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50">
                {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Score */}
            <div>
              <label className="text-xs text-white/75 mb-3 block">Score</label>
              <div className="flex items-center gap-4">
                <ScoreControl label={label1} value={homeScore} onChange={setHomeScore} color="green" />
                <span className="text-2xl font-black text-white/30 mt-4">–</span>
                <ScoreControl label={label2} value={awayScore} onChange={setAwayScore} color="blue" />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Update Match"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Status (non-football, has score) ── */}
      {!isFootball && hasScore && (
        <Card>
          <CardHeader>
            <CardTitle>{sportHeader} — Status & Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="w-48">
              <label className="text-xs text-white/75 mb-1.5 block">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50">
                {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/75 mb-3 block">Score</label>
              <div className="flex items-center gap-4">
                <ScoreControl label={label1} value={homeScore} onChange={setHomeScore} color="green" />
                <span className="text-2xl font-black text-white/30 mt-4">–</span>
                <ScoreControl label={label2} value={awayScore} onChange={setAwayScore} color="blue" />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Update"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Status (no-score sports: F1, UFC, Boxing) ── */}
      {!isFootball && !hasScore && (
        <Card>
          <CardHeader>
            <CardTitle>{sportHeader} — Event Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="w-48">
              <label className="text-xs text-white/75 mb-1.5 block">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50">
                {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <p className="text-[11px] text-white/50 mt-1">
                Set to <strong>LIVE</strong> when the event is underway.
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Update Status"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── FOOTBALL ONLY: Stream Sources ── */}
      {isFootball && (
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
      )}

      {/* ── NON-FOOTBALL ONLY: Global Stream ── */}
      {!isFootball && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#00FF84]" />
              Global Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-white/75 mb-1.5 block">Stream URL / Embed URL</label>
              <Input
                placeholder="https://... or iframe embed URL"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/75 mb-1.5 block">Stream Type</label>
                <select value={streamType} onChange={(e) => setStreamType(e.target.value)}
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50">
                  <option value="IFRAME">Iframe Embed</option>
                  <option value="HLS">HLS (.m3u8)</option>
                  <option value="DASH">DASH (.mpd)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/75 mb-1.5 block">Quality</label>
                <select value={streamQuality} onChange={(e) => setStreamQuality(e.target.value)}
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50">
                  <option value="4K">4K</option><option value="FHD">FHD</option>
                  <option value="HD">HD</option><option value="SD">SD</option>
                </select>
              </div>
            </div>
            <Button onClick={saveEventDetails} disabled={savingStream} variant="outline" size="sm">
              <Save className="w-4 h-4" />
              {savingStream ? "Saving…" : "Save Stream & Details"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" asChild>
        <Link href="/admin/matches">← Back to Matches</Link>
      </Button>
    </div>
  );
}

function ScoreControl({ label, value, onChange, color }: {
  label: string; value: number; onChange: (v: number) => void; color: "green" | "blue";
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[11px] text-white/50 font-medium truncate max-w-[80px] text-center">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 text-white font-bold flex items-center justify-center transition-colors">
          <Minus className="w-3.5 h-3.5" />
        </button>
        <input type="number" min={0} max={99} value={value}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-14 text-center bg-[#0B0F14] border border-white/10 rounded-lg py-2 text-xl font-black text-white focus:outline-none focus:border-[#00FF84]/50 tabular-nums" />
        <button type="button" onClick={() => onChange(value + 1)}
          className={`w-8 h-8 rounded-lg ${color === "green" ? "hover:bg-[#00FF84]/20 text-[#00FF84]" : "hover:bg-blue-500/20 text-blue-400"} bg-white/8 font-bold flex items-center justify-center transition-colors`}>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
