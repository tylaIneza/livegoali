export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { SportsManager } from "./SportsManager";

export default async function AdminSportsPage() {
  const sports = await prisma.sport.findMany({
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { matches: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Sports Management</h1>
        <p className="text-white/70 text-sm mt-1">Manage supported sports and their display order</p>
      </div>
      <SportsManager initialSports={sports} />
    </div>
  );
}
