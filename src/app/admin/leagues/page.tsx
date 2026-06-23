export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { LeaguesManager } from "./LeaguesManager";

export default async function AdminLeaguesPage() {
  const leagues = await prisma.league.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { matches: true, teams: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Leagues</h1>
        <p className="text-white/70 text-sm mt-1">Create and manage football leagues</p>
      </div>
      <LeaguesManager leagues={leagues} />
    </div>
  );
}
