export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchesTable } from "@/components/admin/MatchesTable";

export default async function AdminMatchesPage() {
  const matches = await prisma.match.findMany({
    include: {
      homeTeam: { select: { name: true, logo: true } },
      awayTeam: { select: { name: true, logo: true } },
      league: { select: { name: true } },
      sport: { select: { name: true, icon: true } },
      streams: { where: { isActive: true }, select: { id: true } },
    },
    orderBy: [{ isPublished: "asc" }, { scheduledAt: "desc" }],
    take: 100,
  });

  const pendingCount = matches.filter((m) => !m.isPublished).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Match Management</h1>
          <p className="text-white/70 text-sm mt-1">
            {matches.length} matches total
            {pendingCount > 0 && (
              <span className="text-warning font-semibold"> · {pendingCount} awaiting approval</span>
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/matches/new">
            <Plus className="w-4 h-4" />
            Create Match
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
        <MatchesTable matches={matches} />
      </div>
    </div>
  );
}
