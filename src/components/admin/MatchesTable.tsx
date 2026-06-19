"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, Edit, Trash, Radio } from "lucide-react";
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
  homeTeam: { name: string; logo: string | null };
  awayTeam: { name: string; logo: string | null };
  league: { name: string };
  streams: { id: string }[];
}

export function MatchesTable({ matches: initial }: { matches: Match[] }) {
  const router = useRouter();
  const [matches, setMatches] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

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

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
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
            <p className="text-gray-400 text-sm mb-6">
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
              {["Match", "League", "Date", "Status", "Streams", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
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
                    <TeamLogo logo={match.homeTeam.logo} name={match.homeTeam.name} />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {match.homeTeam.name} vs {match.awayTeam.name}
                      </p>
                      {(match.status === "LIVE" || match.status === "HALFTIME") && match.matchMinute && (
                        <p className="text-xs text-[#00FF84] font-bold">{match.matchMinute}'</p>
                      )}
                    </div>
                    <TeamLogo logo={match.awayTeam.logo} name={match.awayTeam.name} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-400">{match.league.name}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-400">{formatMatchDate(match.scheduledAt)}</span>
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
                  <div className="flex items-center gap-1.5">
                    <Radio className={`w-3.5 h-3.5 ${match.streams.length > 0 ? "text-[#00FF84]" : "text-gray-600"}`} />
                    <span className="text-sm text-gray-400">{match.streams.length} active</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <Link href={`/match/${match.slug}`} target="_blank">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
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
    <div className="w-7 h-7 rounded bg-white/5 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
      {name.charAt(0)}
    </div>
  );
}
