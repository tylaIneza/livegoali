export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchCard } from "@/components/match/MatchCard";
import { FavoriteButton } from "@/components/FavoriteButton";
import { MapPin, Users, Calendar, Globe, Shield } from "lucide-react";
import type { Metadata } from "next";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const team = await prisma.team.findUnique({ where: { slug }, select: { name: true, country: true } });
  if (!team) return { title: "Team Not Found" };
  return {
    title: `${team.name} — Fixtures, Results & Info`,
    description: `${team.name} fixtures, recent results, squad, and statistics on LiveGoali.`,
  };
}

export default async function TeamPage({ params }: Props) {
  const { slug } = await params;

  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      league: { select: { id: true, name: true, slug: true, logo: true } },
      players: { orderBy: [{ number: "asc" }, { name: "asc" }], take: 30 },
      standings: { orderBy: { updatedAt: "desc" }, take: 1 },
    },
  });

  if (!team) notFound();

  const session = await auth();
  const isFavorited = session?.user
    ? !!(await prisma.favorite.findFirst({ where: { userId: session.user.id, teamId: team.id } }))
    : false;

  const matchInclude = {
    homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
    awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
    league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
    streams: { where: { isActive: true }, take: 1 },
  } as const;

  const [fixtures, results] = await Promise.all([
    prisma.match.findMany({
      where: {
        status: { in: ["SCHEDULED", "LIVE", "HALFTIME"] },
        OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
      },
      include: matchInclude,
      orderBy: { scheduledAt: "asc" },
      take: 10,
    }),
    prisma.match.findMany({
      where: {
        status: "FINISHED",
        OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
      },
      include: matchInclude,
      orderBy: { scheduledAt: "desc" },
      take: 10,
    }),
  ]);

  const standing = team.standings[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="rounded-2xl border border-white/8 bg-card p-6 mb-6">
        <div className="flex items-center gap-5">
          {team.logo ? (
            <Image src={team.logo} alt={team.name} width={80} height={80} className="object-contain shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center text-4xl shrink-0">
              ⚽
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-black text-white mb-1">{team.name}</h1>
            {team.shortName && team.shortName !== team.name && (
              <p className="text-white/70 text-sm mb-2">{team.shortName}</p>
            )}
            <div className="flex flex-wrap gap-3">
              {team.country && (
                <span className="flex items-center gap-1.5 text-sm text-white/75">
                  <MapPin className="w-3.5 h-3.5 text-white/60" />
                  {team.city ? `${team.city}, ` : ""}{team.country}
                </span>
              )}
              {team.founded && (
                <span className="flex items-center gap-1.5 text-sm text-white/75">
                  <Calendar className="w-3.5 h-3.5 text-white/60" />
                  Founded {team.founded}
                </span>
              )}
              {team.league && (
                <Link href={`/league/${team.league.slug}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <Shield className="w-3.5 h-3.5" />
                  {team.league.name}
                </Link>
              )}
              {team.website && (
                <a href={team.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-white/75 hover:text-primary transition-colors">
                  <Globe className="w-3.5 h-3.5 text-white/60" />
                  Website
                </a>
              )}
            </div>
          </div>
          <FavoriteButton teamId={team.id} initialFavorited={isFavorited} className="shrink-0" />
        </div>

        {/* Stats row */}
        {standing && (
          <div className="mt-5 pt-5 border-t border-white/8 grid grid-cols-4 sm:grid-cols-7 gap-4">
            {[
              { label: "Played", value: standing.played },
              { label: "Won", value: standing.won, color: "text-accent" },
              { label: "Drawn", value: standing.drawn, color: "text-warning" },
              { label: "Lost", value: standing.lost, color: "text-danger" },
              { label: "GF", value: standing.goalsFor },
              { label: "GA", value: standing.goalsAgainst },
              { label: "Points", value: standing.points, color: "text-white", bold: true },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-black ${s.bold ? "text-white" : s.color || "text-gray-300"}`}>{s.value}</p>
                <p className="text-xs text-white/60 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Additional info */}
        {(team.stadium || team.coach) && (
          <div className="mt-4 flex flex-wrap gap-4">
            {team.stadium && (
              <div className="flex items-center gap-2 text-sm text-white/75">
                <span className="text-white/60">Stadium:</span> {team.stadium}
              </div>
            )}
            {team.coach && (
              <div className="flex items-center gap-2 text-sm text-white/75">
                <span className="text-white/60">Coach:</span> {team.coach}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="fixtures">
        <TabsList className="mb-6">
          <TabsTrigger value="fixtures">
            Upcoming Fixtures {fixtures.length > 0 && <span className="ml-1.5 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{fixtures.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="results">
            Last Matches {results.length > 0 && <span className="ml-1.5 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{results.length}</span>}
          </TabsTrigger>
          {team.players.length > 0 && (
            <TabsTrigger value="squad">
              Squad <span className="ml-1.5 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{team.players.length}</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="fixtures">
          {fixtures.length === 0 ? (
            <div className="text-center py-16 text-white/70">
              <p className="text-lg mb-1">No upcoming fixtures</p>
              <p className="text-sm">Check back later for new matches</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fixtures.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results">
          {results.length === 0 ? (
            <div className="text-center py-16 text-white/70">
              <p className="text-lg mb-1">No recent results</p>
              <p className="text-sm">Matches will appear here once played</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          )}
        </TabsContent>

        {team.players.length > 0 && (
          <TabsContent value="squad">
            <div className="rounded-2xl border border-white/8 bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-white/8">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-white">Squad</span>
              </div>
              <div className="divide-y divide-white/5">
                {team.players.map((player) => (
                  <Link
                    key={player.id}
                    href={`/player/${player.slug}`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-white/2 transition-colors"
                  >
                    {player.image ? (
                      <Image src={player.image} alt={player.name} width={36} height={36} className="rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-white/75 shrink-0">
                        {player.number ?? "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{player.name}</p>
                      <p className="text-xs text-white/70">{player.position || "—"}</p>
                    </div>
                    {player.number && (
                      <span className="text-xs font-mono text-white/60">#{player.number}</span>
                    )}
                    {player.nationality && (
                      <span className="text-xs text-white/70 hidden sm:block">{player.nationality}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
