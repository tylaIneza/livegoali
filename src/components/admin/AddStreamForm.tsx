"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Radio } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  matches: Array<{ id: string; label: string; status: string }>;
}

/** If the user pastes a full <iframe> tag, extract just the src URL */
function extractFromIframe(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.startsWith("<")) return trimmed;
  const match = trimmed.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : trimmed;
}

function isWebpageUrl(url: string): boolean {
  if (!url) return false;
  try {
    const path = new URL(url).pathname.toLowerCase();
    return !(
      path.endsWith(".m3u8") || path.endsWith(".mpd") || path.endsWith(".mp4") ||
      path.endsWith(".webm") || path.endsWith(".ts") ||
      path.includes("/hls/") || path.includes("/dash/") ||
      url.includes(".m3u8") || url.includes(".mpd")
    );
  } catch { return false; }
}

export function AddStreamForm({ matches }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    matchId: "",
    url: "",
    type: "HLS",
    quality: "HD",
    label: "",
    isPrimary: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.matchId || !form.url) {
      toast.error("Select a match and enter a stream URL");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, priority: 1 }),
      });
      if (!res.ok) throw new Error("Failed to add stream");
      toast.success("Stream added successfully!");
      setForm({ matchId: "", url: "", type: "HLS", quality: "HD", label: "", isPrimary: false });
      router.refresh();
    } catch {
      toast.error("Failed to add stream");
    } finally {
      setSaving(false);
    }
  };

  const liveMatches = matches.filter((m) => m.status === "LIVE" || m.status === "HALFTIME");
  const upcomingMatches = matches.filter((m) => m.status === "SCHEDULED");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Match selector */}
        <div className="sm:col-span-2">
          <label className="text-xs text-white/75 mb-1.5 block">Match *</label>
          <select
            value={form.matchId}
            onChange={(e) => setForm((p) => ({ ...p, matchId: e.target.value }))}
            required
            className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50 transition-colors"
          >
            <option value="">Select a match...</option>
            {liveMatches.length > 0 && (
              <optgroup label="🔴 Live Now">
                {liveMatches.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </optgroup>
            )}
            {upcomingMatches.length > 0 && (
              <optgroup label="📅 Upcoming">
                {upcomingMatches.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Stream type */}
        <div>
          <label className="text-xs text-white/75 mb-1.5 block">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50 transition-colors"
          >
            <option value="HLS">HLS (.m3u8)</option>
            <option value="DASH">DASH (.mpd)</option>
            <option value="MP4">MP4</option>
          </select>
        </div>

        {/* Quality */}
        <div>
          <label className="text-xs text-white/75 mb-1.5 block">Quality</label>
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
        </div>
      </div>

      {/* Stream URL */}
      <div>
        <label className="text-xs text-white/75 mb-1.5 block">Stream URL *</label>
        <Input
          type="url"
          placeholder="https://cdn.example.com/live/stream.m3u8"
          value={form.url}
          onChange={(e) => setForm((p) => ({ ...p, url: extractFromIframe(e.target.value) }))}
          required
          className={`font-mono text-xs ${form.url ? "border-[#00FF84]/40" : ""}`}
        />
        {form.url && isWebpageUrl(form.url) ? (
          <p className="text-[11px] text-yellow-400 mt-1 font-medium">
            ⚡ Embed URL — will display as an iframe in the player
          </p>
        ) : form.url ? (
          <p className="text-[11px] text-[#00FF84] mt-1">✓ Direct stream URL detected</p>
        ) : (
          <p className="text-[11px] text-white/60 mt-1">
            Accepts direct .m3u8 / .mpd / .mp4 URLs or embed/iframe page URLs
          </p>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Label */}
        <div className="flex-1">
          <label className="text-xs text-white/75 mb-1.5 block">Label (optional)</label>
          <Input
            placeholder="e.g. Primary HD, Backup 1..."
            value={form.label}
            onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
          />
        </div>

        {/* Primary toggle */}
        <label className="flex items-center gap-2 cursor-pointer mt-5">
          <input
            type="checkbox"
            checked={form.isPrimary}
            onChange={(e) => setForm((p) => ({ ...p, isPrimary: e.target.checked }))}
            className="accent-[#00FF84] w-4 h-4"
          />
          <span className="text-sm text-gray-300">Primary stream</span>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={saving || !form.matchId || !form.url}>
          <Radio className="w-4 h-4" />
          {saving ? "Adding..." : "Add Stream"}
        </Button>
        <p className="text-xs text-white/60">
          The stream will be active immediately after saving
        </p>
      </div>
    </form>
  );
}
