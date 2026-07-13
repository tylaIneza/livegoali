export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FavoritesList } from "@/components/FavoritesList";
import { Star } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favorites",
  description: "Your favorite teams and leagues on LiveGoali.",
};

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/favorites");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      team: { select: { id: true, name: true, slug: true, logo: true, country: true } },
      league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
          <Star className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Favorites</h1>
          <p className="text-sm text-white/60">{favorites.length} saved</p>
        </div>
      </div>

      <FavoritesList initial={favorites} />
    </div>
  );
}
