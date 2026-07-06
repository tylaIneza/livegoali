export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { ChannelsManager } from "./ChannelsManager";

export default async function AdminChannelsPage() {
  const channels = await prisma.channel.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { sources: { orderBy: { priority: "asc" } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Live TV Channels</h1>
        <p className="text-white/70 text-sm mt-1">Manage 24/7 live TV channels</p>
      </div>
      <ChannelsManager channels={channels} />
    </div>
  );
}
