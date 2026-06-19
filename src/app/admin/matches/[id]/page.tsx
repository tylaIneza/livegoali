export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditMatchForm } from "@/components/admin/EditMatchForm";

interface Props { params: Promise<{ id: string }> }

export default async function EditMatchPage({ params }: Props) {
  const { id } = await params;

  const [match, leagues, teams] = await Promise.all([
    prisma.match.findUnique({
      where: { id },
      include: {
        streams: { orderBy: { priority: "asc" } },
        homeTeam: { select: { id: true, name: true, logo: true } },
        awayTeam: { select: { id: true, name: true, logo: true } },
      },
    }),
    prisma.league.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.team.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, logo: true } }),
  ]);

  if (!match) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Edit Match</h1>
      <EditMatchForm match={match} leagues={leagues} teams={teams} />
    </div>
  );
}
