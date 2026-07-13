export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { TeamMappingsManager } from "./TeamMappingsManager";

export default async function AdminTeamMappingsPage() {
  const [mappings, teams] = await Promise.all([
    prisma.teamMapping.findMany({
      include: { team: { select: { id: true, name: true, logo: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.team.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Livescore Team Mappings</h1>
        <p className="text-white/70 text-sm mt-1">
          Map internal teams to Livescore&apos;s (unofficial) team IDs so live scores can be auto-credited.
        </p>
      </div>
      <TeamMappingsManager mappings={mappings} teams={teams} />
    </div>
  );
}
