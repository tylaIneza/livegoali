export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { CreateMatchForm } from "@/components/admin/CreateMatchForm";

export default async function NewMatchPage() {
  const [leagues, sports] = await Promise.all([
    prisma.league.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, country: true },
    }),
    prisma.sport.findMany({
      where: { enabled: true },
      orderBy: { displayOrder: "asc" },
      select: { id: true, name: true, slug: true, icon: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Create Event</h1>
        <p className="text-white/70 text-sm mt-1">Add a new event across any sport</p>
      </div>
      <CreateMatchForm leagues={leagues} sports={sports} />
    </div>
  );
}
