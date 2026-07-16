export const dynamic = "force-dynamic";

import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Goal } from "lucide-react";
import { getFootballStreams, getStreamStatus, type FootballStreamsResult } from "@/lib/ppv-football";
import { LiveGoaliPlayer } from "@/components/player/LiveGoaliPlayer";
import { PPVStreamCard } from "@/components/football/PPVStreamCard";
import { LocalTime } from "@/components/LocalTime";
import type { StreamSourceData, StreamType } from "@/types";
import type { Metadata } from "next";

interface Props {
  // uri_name contains slashes (e.g. "mls/2026-07-16/mtl-tor"), so this route
  // is a catch-all segment — Next.js gives us each path segment as an array.
  params: Promise<{ uri_name: string[] }>;
}

function isValidImageUrl(url: string | null): url is string {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
}

const getStreams = cache(async (): Promise<FootballStreamsResult> => {
  try {
    return await getFootballStreams();
  } catch {
    return { matches: [], stale: true };
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uri_name } = await params;
  const joined = uri_name.join("/");
  const { matches } = await getStreams();
  const stream = matches.find((m) => m.uri_name === joined);
  if (!stream) return { title: "Stream Not Found" };
  return {
    title: `${stream.name} — Football Live | LiveGoali`,
    description: `Watch ${stream.name} live on LiveGoali.`,
  };
}

export default async function FootballWatchPage({ params }: Props) {
  const { uri_name } = await params;
  const joined = uri_name.join("/");
  const { matches } = await getStreams();
  const stream = matches.find((m) => m.uri_name === joined);
  if (!stream) notFound();

  const status = getStreamStatus(stream);

  const streamSources: StreamSourceData[] = stream.iframe
    ? [
        {
          id: stream.id,
          url: stream.iframe,
          type: "IFRAME" as StreamType,
          quality: "AUTO",
          isPrimary: true,
          isActive: true,
          priority: 1,
          label: stream.tag ?? null,
        },
      ]
    : [];

  const related = matches
    .filter((m) => m.uri_name !== joined && getStreamStatus(m) === status)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        {/* Header */}
        <div
          className="relative rounded-2xl overflow-hidden border border-white/8 p-5 sm:p-6"
          style={{ background: "linear-gradient(135deg, #0f1923 0%, #0F172A 60%, #0f1923 100%)" }}
        >
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-danger to-transparent" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center overflow-hidden shrink-0">
              {isValidImageUrl(stream.poster) ? (
                <Image src={stream.poster} alt={stream.name} width={40} height={40} className="object-contain" />
              ) : (
                <Goal className="w-6 h-6 text-white/40" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-black text-white text-xl truncate">{stream.name}</h1>
                {status === "LIVE" && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-danger bg-danger/12 border border-danger/25 px-2 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger live-pulse" /> LIVE
                  </span>
                )}
                {status === "UPCOMING" && stream.starts_at !== null && (
                  <span className="text-[10px] font-black text-primary bg-primary/12 border border-primary/25 px-2 py-0.5 rounded-full shrink-0">
                    <LocalTime iso={new Date(stream.starts_at)} format="full" />
                  </span>
                )}
                {status === "ENDED" && (
                  <span className="text-[10px] font-black text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full shrink-0">
                    ENDED
                  </span>
                )}
              </div>
              {stream.tag && <p className="text-sm text-white/50 mt-0.5 truncate">{stream.tag}</p>}
            </div>
          </div>
        </div>

        {/* Player */}
        <div className="rounded-2xl overflow-hidden border border-white/6 shadow-2xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl lg:mx-auto">
          <LiveGoaliPlayer streams={streamSources} matchTitle={stream.name} isLive={status !== "ENDED"} />
        </div>

        {/* Related streams */}
        {related.length > 0 && (
          <section>
            <h2 className="text-base font-black text-white tracking-tight mb-4">More Football Streams</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((s) => (
                <PPVStreamCard key={s.uri_name} stream={s} />
              ))}
            </div>
          </section>
        )}

        <div className="text-center">
          <Link href="/football" className="text-sm text-white/50 hover:text-primary transition-colors font-semibold">
            ← All Football Streams
          </Link>
        </div>
      </div>
    </div>
  );
}
