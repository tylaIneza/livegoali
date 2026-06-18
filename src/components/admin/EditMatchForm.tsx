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
interface Props {
  match: {
    id: string; slug: string; status: string; homeScore: number | null; awayScore: number | null;
    matchMinute: number | null; isFeatured: boolean; enableComments: boolean; enableChat: boolean;
    enablePrediction: boolean; venue: string | null; round: string | null; homeTeamId: string; awayTeamId: string; leagueId: string;
    streams: Stream[];
  };
  leagues: Array<{ id: string; name: string; country: string }>;
  teams: Array<{ id: string; name: string }>;
}

const STATUS_OPTIONS = ["SCHEDULED","LIVE","HALFTIME","FINISHED","POSTPONED","CANCELLED"];

export function EditMatchForm({ match, leagues, teams }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(match.status);
  const [streams, setStreams] = useState<Stream[]>(match.streams);
  const [newStream, setNewStream] = useState({ url: "", type: "HLS", quality: "HD", label: "", isPrimary: false });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
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

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Match status */}
      <Card>
        <CardHeader><CardTitle>Match Status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="w-48">
            <label className="text-xs text-gray-400 mb-1.5 block">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
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
                <p className="text-[10px] text-gray-600 truncate">{s.url}</p>
              </div>
              <button onClick={() => toggleStream(s.id, s.isActive)}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${s.isActive ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-[#00FF84]/10 text-[#00FF84] hover:bg-[#00FF84]/20"}`}>
                {s.isActive ? "Disable" : "Enable"}
              </button>
            </div>
          ))}

          {/* Add new stream */}
          <div className="pt-2 border-t border-white/8">
            <p className="text-xs text-gray-500 mb-2 font-medium">Add New Stream</p>
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
