export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/redis";
import { ChannelCard } from "@/components/channel/ChannelCard";
import { Tv } from "lucide-react";
import type { Metadata } from "next";
import type { ChannelCategory } from "@prisma/client";

export const metadata: Metadata = {
  title: "Live TV — 24/7 Channels | LiveGoali",
  description: "Watch 24/7 live TV channels streaming non-stop on LiveGoali.",
};

interface ChannelListItem {
  id: string; slug: string; name: string; logo: string | null;
  description: string | null; category: ChannelCategory;
}

const CATEGORY_LABELS: Record<ChannelCategory, string> = {
  SPORTS: "Sports",
  NEWS: "News",
  ENTERTAINMENT: "Entertainment",
  KIDS: "Kids",
  MUSIC: "Music",
  OTHER: "Other",
};

async function getChannels(): Promise<ChannelListItem[]> {
  const cached = await cacheGet<ChannelListItem[]>("live-tv:channels");
  if (cached) return cached;
  const channels = await prisma.channel.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true, logo: true, description: true, category: true },
    orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { name: "asc" }],
  });
  await cacheSet("live-tv:channels", channels, 30);
  return channels;
}

export default async function LiveTvPage() {
  const channels = await getChannels().catch(() => []);

  const grouped = channels.reduce<Record<string, ChannelListItem[]>>((acc, ch) => {
    (acc[ch.category] ??= []).push(ch);
    return acc;
  }, {});

  return (
    <>
      <div className="relative overflow-hidden border-b border-white/6"
        style={{ background: "linear-gradient(135deg, #110808 0%, #0F172A 40%, #06040f 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-48 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--danger), transparent)" }} />
          <div className="absolute bottom-0 right-1/4 w-64 h-32 rounded-full opacity-10 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--accent), transparent)" }} />
        </div>
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-danger to-transparent" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-danger/20 border border-danger/30 flex items-center justify-center"
                style={{ boxShadow: "0 0 40px rgba(239,68,68,0.25)" }}>
                <Tv className="w-8 h-8 text-danger" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-danger live-pulse" />
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                <span className="flex items-center gap-1.5 text-xs font-black text-danger bg-danger/12 border border-danger/25 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger live-pulse" />
                  24/7
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Live TV Channels</h1>
              <p className="text-white/50 mt-1.5 text-sm sm:text-base">
                Non-stop live channels streaming around the clock — free, no account needed
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {channels.length === 0 ? (
          <div className="rounded-2xl border border-white/6 bg-card/80 p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-danger/8 border border-danger/12 flex items-center justify-center mx-auto mb-5">
              <Tv className="w-9 h-9 text-danger/40" />
            </div>
            <p className="text-white font-black text-xl mb-2">No channels available yet</p>
            <p className="text-white/50 text-sm">Check back soon — new channels are added regularly</p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <section key={category}>
              <h2 className="text-lg font-black text-white tracking-tight mb-4">
                {CATEGORY_LABELS[category as ChannelCategory] ?? category}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((ch) => (
                  <ChannelCard key={ch.id} slug={ch.slug} name={ch.name} logo={ch.logo} description={ch.description} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}
