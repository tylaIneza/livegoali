export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { LiveGoaliPlayer } from "@/components/player/LiveGoaliPlayer";
import { ViewTracker } from "@/components/ViewTracker";
import { ChannelCard } from "@/components/channel/ChannelCard";
import { Tv, Wifi } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getChannel(slug: string) {
  return prisma.channel.findUnique({
    where: { slug },
    include: { sources: { where: { isActive: true }, orderBy: { priority: "asc" } } },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const channel = await getChannel(slug);
  if (!channel) return { title: "Channel Not Found" };
  return {
    title: `${channel.name} — Live TV | LiveGoali`,
    description: channel.description ?? `Watch ${channel.name} live 24/7 on LiveGoali.`,
  };
}

export default async function LiveTvChannelPage({ params }: Props) {
  const { slug } = await params;
  const channel = await getChannel(slug);
  if (!channel || !channel.isActive) notFound();

  const related = await prisma.channel.findMany({
    where: { isActive: true, category: channel.category, id: { not: channel.id } },
    select: { id: true, slug: true, name: true, logo: true, description: true },
    orderBy: [{ isFeatured: "desc" }, { order: "asc" }],
    take: 8,
  });

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <ViewTracker type="channel" channelId={channel.id} />

      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        {/* Header */}
        <div className="relative rounded-2xl overflow-hidden border border-white/8 p-5 sm:p-6"
          style={{ background: "linear-gradient(135deg, #0f1923 0%, #0B0F14 60%, #0f1923 100%)" }}>
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center overflow-hidden shrink-0">
              {channel.logo ? (
                <Image src={channel.logo} alt={channel.name} width={40} height={40} className="object-contain" />
              ) : (
                <Tv className="w-6 h-6 text-white/40" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-black text-white text-xl truncate">{channel.name}</h1>
                <span className="flex items-center gap-1 text-[10px] font-black text-red-400 bg-red-500/12 border border-red-500/25 px-2 py-0.5 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" /> 24/7 LIVE
                </span>
              </div>
              {channel.description && <p className="text-sm text-white/50 mt-0.5 truncate">{channel.description}</p>}
            </div>
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-black text-white/40 shrink-0">
              <Wifi className="w-3.5 h-3.5" /> Streaming
            </span>
          </div>
        </div>

        {/* Player */}
        <div className="rounded-2xl overflow-hidden border border-white/6 shadow-2xl">
          <LiveGoaliPlayer
            streams={channel.sources}
            matchTitle={channel.name}
            isLive={true}
          />
        </div>

        {/* Related channels */}
        {related.length > 0 && (
          <section>
            <h2 className="text-base font-black text-white tracking-tight mb-4">More Channels</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((ch) => (
                <ChannelCard key={ch.id} slug={ch.slug} name={ch.name} logo={ch.logo} description={ch.description} />
              ))}
            </div>
          </section>
        )}

        <div className="text-center">
          <Link href="/live-tv" className="text-sm text-white/50 hover:text-[#00FF84] transition-colors font-semibold">
            ← All Channels
          </Link>
        </div>
      </div>
    </div>
  );
}
