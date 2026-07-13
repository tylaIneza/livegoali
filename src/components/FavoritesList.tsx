"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Star, Shield, Trophy } from "lucide-react";

interface FavoriteItem {
  id: string;
  team: { id: string; name: string; slug: string; logo: string | null; country: string | null } | null;
  league: { id: string; name: string; slug: string; logo: string | null; country: string | null } | null;
}

export function FavoritesList({ initial }: { initial: FavoriteItem[] }) {
  const [favorites, setFavorites] = useState(initial);
  const remove = (id: string) => setFavorites((prev) => prev.filter((f) => f.id !== id));

  const teams = favorites.filter((f) => f.team);
  const leagues = favorites.filter((f) => f.league);

  if (favorites.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-card p-16 text-center">
        <Star className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white font-bold mb-1">No favorites yet</p>
        <p className="text-white/60 text-sm">
          Tap the star on a team or league page to follow it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {teams.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold text-white/70 mb-3">
            <Shield className="w-4 h-4" /> Teams
          </h2>
          <div className="rounded-2xl border border-white/8 bg-card overflow-hidden divide-y divide-white/5">
            {teams.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-4">
                {f.team!.logo ? (
                  <Image src={f.team!.logo} alt={f.team!.name} width={36} height={36} className="object-contain shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">⚽</div>
                )}
                <Link href={`/team/${f.team!.slug}`} className="flex-1 min-w-0 hover:text-primary transition-colors">
                  <p className="text-sm font-semibold text-white truncate">{f.team!.name}</p>
                  {f.team!.country && <p className="text-xs text-white/50">{f.team!.country}</p>}
                </Link>
                <FavoriteButton teamId={f.team!.id} initialFavorited className="w-9 h-9" onRemoved={() => remove(f.id)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {leagues.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold text-white/70 mb-3">
            <Trophy className="w-4 h-4" /> Leagues
          </h2>
          <div className="rounded-2xl border border-white/8 bg-card overflow-hidden divide-y divide-white/5">
            {leagues.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-4">
                {f.league!.logo ? (
                  <Image src={f.league!.logo} alt={f.league!.name} width={36} height={36} className="object-contain shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">🏆</div>
                )}
                <Link href={`/league/${f.league!.slug}`} className="flex-1 min-w-0 hover:text-primary transition-colors">
                  <p className="text-sm font-semibold text-white truncate">{f.league!.name}</p>
                  {f.league!.country && <p className="text-xs text-white/50">{f.league!.country}</p>}
                </Link>
                <FavoriteButton leagueId={f.league!.id} initialFavorited className="w-9 h-9" onRemoved={() => remove(f.id)} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
