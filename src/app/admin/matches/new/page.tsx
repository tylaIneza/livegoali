export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { CreateMatchForm } from "@/components/admin/CreateMatchForm";

export default async function NewMatchPage() {
  const leagues = await prisma.league.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, country: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Create Match</h1>
        <p className="text-gray-500 text-sm mt-1">Add a new match with stream sources</p>
      </div>
      <CreateMatchForm leagues={leagues} />
    </div>
  );
}
