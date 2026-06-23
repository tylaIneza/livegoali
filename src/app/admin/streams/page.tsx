export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Radio, CheckCircle, XCircle, Eye, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddStreamForm } from "@/components/admin/AddStreamForm";
import { formatMatchDate } from "@/lib/utils";

export default async function AdminStreamsPage() {
  const [streams, activeMatches] = await Promise.all([
    prisma.streamSource.findMany({
      include: {
        match: {
          include: {
            homeTeam: { select: { name: true, shortName: true } },
            awayTeam: { select: { name: true, shortName: true } },
            league: { select: { name: true } },
          },
        },
      },
      orderBy: [{ match: { scheduledAt: "desc" } }, { priority: "asc" }],
    }),
    prisma.match.findMany({
      where: { status: { in: ["SCHEDULED", "LIVE", "HALFTIME"] } },
      include: {
        homeTeam: { select: { name: true, shortName: true } },
        awayTeam: { select: { name: true, shortName: true } },
        league: { select: { name: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 50,
    }),
  ]);

  const activeCount = streams.filter((s) => s.isActive).length;

  // Group streams by match
  const byMatch = streams.reduce<Record<string, typeof streams>>((acc, s) => {
    const key = s.matchId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Stream Management</h1>
          <p className="text-white/70 text-sm mt-1">
            {streams.length} total streams ·{" "}
            <span className="text-[#00FF84]">{activeCount} active</span> ·{" "}
            <span className="text-red-400">{streams.length - activeCount} offline</span>
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: streams.length, color: "text-white" },
          { label: "Active", value: activeCount, color: "text-[#00FF84]" },
          { label: "Primary", value: streams.filter((s) => s.isPrimary).length, color: "text-blue-400" },
          { label: "HLS", value: streams.filter((s) => s.type === "HLS").length, color: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/8 bg-[#121821] p-4">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-white/70 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add new stream */}
      <div className="rounded-2xl border border-white/8 bg-[#121821] p-5">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#00FF84]" />
          Add Stream to Match
        </h2>
        <AddStreamForm matches={activeMatches.map((m) => ({
          id: m.id,
          label: `${m.homeTeam.shortName || m.homeTeam.name} vs ${m.awayTeam.shortName || m.awayTeam.name} — ${m.league.name}`,
          status: m.status,
        }))} />
      </div>

      {/* Streams by match */}
      {Object.keys(byMatch).length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-[#121821] py-16 text-center">
          <Radio className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-white font-bold text-lg mb-1">No streams yet</p>
          <p className="text-white/70 text-sm mb-4">
            Use the form above to add a stream URL to any match
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/matches/new">Or create a new match with streams</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">All Streams by Match</h2>
          {Object.values(byMatch).map((matchStreams) => {
            const m = matchStreams[0].match;
            const isLive = m.status === "LIVE" || m.status === "HALFTIME";
            return (
              <div key={m.id} className={`rounded-2xl border overflow-hidden ${isLive ? "border-red-500/20 bg-red-500/3" : "border-white/8 bg-[#121821]"}`}>
                {/* Match header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
                  <div className="flex items-center gap-3">
                    {isLive && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
                        LIVE
                      </span>
                    )}
                    <span className="text-sm font-bold text-white">
                      {m.homeTeam.shortName || m.homeTeam.name} vs {m.awayTeam.shortName || m.awayTeam.name}
                    </span>
                    <span className="text-xs text-white/70">{m.league.name}</span>
                    <span className="text-xs text-white/60">{formatMatchDate(m.scheduledAt)}</span>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                    <Link href={`/admin/matches/${m.id}`}>Edit</Link>
                  </Button>
                </div>

                {/* Stream rows */}
                <div className="divide-y divide-white/4">
                  {matchStreams.map((stream, i) => (
                    <div key={stream.id} className="flex items-center gap-4 px-4 py-3">
                      {/* Priority + status dot */}
                      <div className="flex items-center gap-2 w-12 shrink-0">
                        <div className={`w-2 h-2 rounded-full ${stream.isActive ? "bg-[#00FF84]" : "bg-red-500"}`} />
                        <span className="text-xs text-white/60">#{stream.priority}</span>
                      </div>

                      {/* Type + quality */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={stream.type === "HLS" ? "default" : "secondary"} className="text-[10px] px-1.5">
                          {stream.type}
                        </Badge>
                        <span className="text-xs font-bold text-gray-300">{stream.quality}</span>
                        {stream.isPrimary && (
                          <span className="text-[10px] text-blue-400 font-bold">PRIMARY</span>
                        )}
                      </div>

                      {/* Label */}
                      <span className="text-xs text-white/70 w-24 shrink-0 truncate">
                        {stream.label || `Stream ${i + 1}`}
                      </span>

                      {/* URL */}
                      <span className="text-xs text-white/60 flex-1 truncate font-mono min-w-0">
                        {stream.url}
                      </span>

                      {/* Status badge */}
                      {stream.isActive ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <CheckCircle className="w-3.5 h-3.5 text-[#00FF84]" />
                          <span className="text-[11px] text-[#00FF84] font-medium">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-[11px] text-red-400 font-medium">Off</span>
                        </div>
                      )}

                      {/* Open URL */}
                      <a
                        href={stream.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-white/8 text-white/60 hover:text-white transition-colors shrink-0"
                        title="Test stream URL"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
