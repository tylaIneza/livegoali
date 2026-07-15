"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, Edit, Trash, Radio, Check, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMatchDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Match {
  id: string;
  slug: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  matchMinute: number | null;
  scheduledAt: Date;
  title?: string | null;
  participant1?: string | null;
  participant2?: string | null;
  homeTeam?: { name: string; logo: string | null } | null;
  awayTeam?: { name: string; logo: string | null } | null;
  league?: { name: string } | null;
  sport?: { name: string; icon: string } | null;
  streams: { id: string }[];
  source?: string;
  isPublished?: boolean;
}

export function MatchesTable({ matches: initial }: { matches: Match[] }) {
  const router = useRouter();
  const [matches, setMatches] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/matches/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setMatches((prev) => prev.filter((m) => m.id !== id));
      setConfirmId(null);
      toast.success("Match deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete match");
    } finally {
      setDeleting(null);
    }
  };

  const handleTogglePublish = async (id: string, nextValue: boolean) => {
    setPublishing(id);
    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: nextValue }),
      });
      if (!res.ok) throw new Error("Failed");
      setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, isPublished: nextValue } : m)));
      toast.success(nextValue ? "Match published" : "Match unpublished");
      router.refresh();
    } catch {
      toast.error("Failed to update match");
    } finally {
      setPublishing(null);
    }
  };

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 text-white/70">
        <p>No matches yet.</p>
      </div>
    );
  }

  return (
    <>
      {/* Confirm dialog */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#121821] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Delete Match?</h3>
            <p className="text-white/75 text-sm mb-6">
              This will permanently delete the match, all streams, events, comments and predictions. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleting === confirmId}
                onClick={() => handleDelete(confirmId)}
              >
                {deleting === confirmId ? "Deleting…" : "Yes, Delete"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setConfirmId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              {["Match", "League", "Date", "Status", "Source", "Streams", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-white/70 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {matches.map((match) => (
              <tr key={match.id} className="hover:bg-white/2 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {match.homeTeam ? (
                      <TeamLogo logo={match.homeTeam.logo} name={match.homeTeam.name} />
                    ) : (
                      <span className="text-base w-7 text-center">{match.sport?.icon ?? "🏆"}</span>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {match.homeTeam
                          ? `${match.homeTeam.name} vs ${match.awayTeam?.name ?? ""}`
                          : match.participant1 && match.participant2
                            ? `${match.participant1} vs ${match.participant2}`
                            : match.title ?? "Untitled Event"}
                      </p>
                    </div>
                    {match.awayTeam && <TeamLogo logo={match.awayTeam.logo} name={match.awayTeam.name} />}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-white/75">
                    {match.sport ? `${match.sport.icon} ${match.sport.name}` : match.league?.name ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-white/75">{formatMatchDate(match.scheduledAt)}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      match.status === "LIVE" || match.status === "HALFTIME" ? "live"
                        : match.status === "FINISHED" ? "secondary"
                        : "new"
                    }
                  >
                    {match.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1 items-start">
                    <Badge variant={match.source && match.source !== "manual" ? "new" : "secondary"}>
                      {match.source && match.source !== "manual" ? match.source.toUpperCase() : "Manual"}
                    </Badge>
                    {match.isPublished === false && (
                      <span className="text-[10px] font-bold text-warning">Pending approval</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Radio className={`w-3.5 h-3.5 ${match.streams.length > 0 ? "text-[#00FF84]" : "text-white/60"}`} />
                    <span className="text-sm text-white/75">{match.streams.length} active</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {match.isPublished === false ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-[#00FF84] hover:bg-[#00FF84]/10"
                        onClick={() => handleTogglePublish(match.id, true)}
                        disabled={publishing === match.id}
                        title="Publish"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <Link href={match.status === "LIVE" || match.status === "HALFTIME" ? `/live/${match.slug}` : `/match/${match.slug}`} target="_blank">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                    )}
                    {match.source && match.source !== "manual" && match.isPublished !== false && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-warning hover:bg-warning/10"
                        onClick={() => handleTogglePublish(match.id, false)}
                        disabled={publishing === match.id}
                        title="Unpublish"
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <Link href={`/admin/matches/${match.id}`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => setConfirmId(match.id)}
                      disabled={deleting === match.id}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TeamLogo({ logo, name }: { logo: string | null; name: string }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className="w-7 h-7 object-contain rounded shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div className="w-7 h-7 rounded bg-white/5 flex items-center justify-center text-xs font-bold text-white/70 shrink-0">
      {name.charAt(0)}
    </div>
  );
}
