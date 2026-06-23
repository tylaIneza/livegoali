"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, Radio, Wand2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateSlug } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";

interface StreamInput {
  url: string;
  type: "HLS" | "DASH" | "MP4";
  quality: string;
  label: string;
  isPrimary: boolean;
}

interface Props {
  leagues: Array<{ id: string; name: string; country: string }>;
}

export function CreateMatchForm({ leagues }: Props) {
  const router = useRouter();

  const [leagueId, setLeagueId] = useState("");
  const [homeTeamName, setHomeTeamName] = useState("");
  const [homeTeamLogo, setHomeTeamLogo] = useState("");
  const [awayTeamName, setAwayTeamName] = useState("");
  const [awayTeamLogo, setAwayTeamLogo] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [venue, setVenue] = useState("");
  const [round, setRound] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [enableComments, setEnableComments] = useState(true);
  const [enableChat, setEnableChat] = useState(true);
  const [enablePrediction, setEnablePrediction] = useState(true);

  const [streams, setStreams] = useState<StreamInput[]>([
    { url: "", type: "HLS", quality: "HD", label: "Primary", isPrimary: true },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPrediction, setIsGeneratingPrediction] = useState(false);

  const addStream = () => {
    setStreams((prev) => [
      ...prev,
      { url: "", type: "HLS", quality: "HD", label: `Backup ${prev.length}`, isPrimary: false },
    ]);
  };

  const removeStream = (i: number) => setStreams((prev) => prev.filter((_, idx) => idx !== i));

  const updateStream = (i: number, field: keyof StreamInput, value: string | boolean) => {
    setStreams((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueId || !homeTeamName.trim() || !awayTeamName.trim() || !scheduledAt) {
      toast.error("League, both team names and kickoff time are required");
      return;
    }
    if (homeTeamName.trim().toLowerCase() === awayTeamName.trim().toLowerCase()) {
      toast.error("Home and away teams must be different");
      return;
    }

    setIsSubmitting(true);
    try {
      const slug = generateSlug(`${homeTeamName}-vs-${awayTeamName}-${scheduledAt.slice(0, 10)}`);

      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug, leagueId,
          homeTeamName: homeTeamName.trim(),
          homeTeamLogo: homeTeamLogo.trim() || undefined,
          awayTeamName: awayTeamName.trim(),
          awayTeamLogo: awayTeamLogo.trim() || undefined,
          scheduledAt, venue, round,
          isFeatured, enableComments, enableChat, enablePrediction,
        }),
      });

      if (!res.ok) throw new Error("Failed to create match");
      const match = await res.json();

      // Add streams
      const activeStreams = streams.filter((s) => s.url.trim());
      for (let priority = 0; priority < activeStreams.length; priority++) {
        const streamUrl = activeStreams[priority].url.trim();
        const extracted = extractFromIframe(streamUrl);
        await fetch("/api/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId: match.id, ...activeStreams[priority], url: extracted, priority }),
        });
      }

      if (enablePrediction) {
        setIsGeneratingPrediction(true);
        await fetch("/api/predictions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId: match.id, generate: true }),
        });
      }

      toast.success("Match created!");
      router.push("/admin/matches");
    } catch {
      toast.error("Failed to create match");
    } finally {
      setIsSubmitting(false);
      setIsGeneratingPrediction(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Match Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* League */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-white/75">League *</label>
              <Link
                href="/admin/leagues"
                className="flex items-center gap-1 text-xs text-[#00FF84] hover:underline"
              >
                <Settings className="w-3 h-3" />
                Manage Leagues
              </Link>
            </div>
            <select
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
              required
              className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50"
            >
              <option value="">Select league...</option>
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>{l.name} ({l.country})</option>
              ))}
            </select>
          </div>

          {/* Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Home Team */}
            <div className="space-y-2">
              <label className="text-sm text-white/75 block">Home Team *</label>
              <div className="flex items-center gap-3">
                {homeTeamLogo ? (
                  <img src={homeTeamLogo} alt="Home logo" className="w-10 h-10 rounded-lg object-contain bg-white/5 border border-white/10 p-1 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 shrink-0 text-lg">⚽</div>
                )}
                <div className="flex-1 space-y-1.5">
                  <Input placeholder="Team name (e.g. Arsenal) *" value={homeTeamName} onChange={(e) => setHomeTeamName(e.target.value)} required />
                  <Input placeholder="Logo URL (https://...)" value={homeTeamLogo} onChange={(e) => setHomeTeamLogo(e.target.value)} />
                </div>
              </div>
              <p className="text-[11px] text-white/60">Team created automatically if new. Logo saved to team.</p>
            </div>
            {/* Away Team */}
            <div className="space-y-2">
              <label className="text-sm text-white/75 block">Away Team *</label>
              <div className="flex items-center gap-3">
                {awayTeamLogo ? (
                  <img src={awayTeamLogo} alt="Away logo" className="w-10 h-10 rounded-lg object-contain bg-white/5 border border-white/10 p-1 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 shrink-0 text-lg">⚽</div>
                )}
                <div className="flex-1 space-y-1.5">
                  <Input placeholder="Team name (e.g. Chelsea) *" value={awayTeamName} onChange={(e) => setAwayTeamName(e.target.value)} required />
                  <Input placeholder="Logo URL (https://...)" value={awayTeamLogo} onChange={(e) => setAwayTeamLogo(e.target.value)} />
                </div>
              </div>
              <p className="text-[11px] text-white/60">Team created automatically if new. Logo saved to team.</p>
            </div>
          </div>

          {/* Date, Venue, Round */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-white/75 mb-1.5 block">Kickoff Date & Time *</label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm text-white/75 mb-1.5 block">Venue</label>
              <Input placeholder="Stadium name..." value={venue} onChange={(e) => setVenue(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-white/75 mb-1.5 block">Round</label>
              <Input placeholder="Matchday 1, Group A..." value={round} onChange={(e) => setRound(e.target.value)} />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-4">
            {[
              { label: "Featured Match", value: isFeatured, set: setIsFeatured },
              { label: "Comments", value: enableComments, set: setEnableComments },
              { label: "Live Chat", value: enableChat, set: setEnableChat },
              { label: "Predictions", value: enablePrediction, set: setEnablePrediction },
            ].map((item) => (
              <label key={item.label} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.value}
                  onChange={(e) => item.set(e.target.checked)}
                  className="accent-[#00FF84] w-4 h-4"
                />
                <span className="text-sm text-gray-300">{item.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stream Sources */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#00FF84]" />
              Stream Sources
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addStream}>
              <Plus className="w-3 h-3" /> Add Stream
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {streams.map((stream, i) => (
            <div key={i} className="p-4 rounded-xl border border-white/8 bg-[#0B0F14] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">
                  {i === 0 ? "Primary Stream" : `Backup Stream ${i}`}
                </span>
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => removeStream(i)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/70 hover:text-red-400 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <Input
                    placeholder="https://... or paste <iframe> code"
                    value={stream.url}
                    onChange={(e) => updateStream(i, "url", e.target.value)}
                  />
                </div>
                <select
                  value={stream.type}
                  onChange={(e) => updateStream(i, "type", e.target.value)}
                  className="bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50"
                >
                  <option value="HLS">HLS (.m3u8)</option>
                  <option value="DASH">DASH (.mpd)</option>
                  <option value="MP4">MP4</option>
                </select>
                <select
                  value={stream.quality}
                  onChange={(e) => updateStream(i, "quality", e.target.value)}
                  className="bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50"
                >
                  <option value="4K">4K</option>
                  <option value="FHD">Full HD</option>
                  <option value="HD">HD</option>
                  <option value="SD">SD</option>
                </select>
              </div>
            </div>
          ))}
          {streams.length === 0 && (
            <p className="text-white/70 text-sm text-center py-4">No streams added yet.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            isGeneratingPrediction ? (
              <><Wand2 className="w-4 h-4 animate-spin" /> Generating AI Prediction...</>
            ) : "Creating..."
          ) : (
            <><Plus className="w-4 h-4" /> Create Match</>
          )}
        </Button>
      </div>
    </form>
  );
}

function extractFromIframe(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.startsWith("<")) return trimmed;
  const match = trimmed.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : trimmed;
}
