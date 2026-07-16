export const dynamic = "force-dynamic";

import { cache } from "react";
import { Goal } from "lucide-react";
import { getFootballStreams, getStreamStatus, type FootballStreamsResult } from "@/lib/ppv-football";
import { PPVStreamCard } from "@/components/football/PPVStreamCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Football Streams",
  description: "Watch live and upcoming football streams on LiveGoali.",
};

const getStreams = cache(async (): Promise<FootballStreamsResult> => {
  try {
    return await getFootballStreams();
  } catch {
    return { matches: [], stale: true };
  }
});

export default async function FootballPage() {
  const { matches, stale } = await getStreams();

  const live = matches.filter((m) => getStreamStatus(m) === "LIVE");
  const upcoming = matches.filter((m) => getStreamStatus(m) === "UPCOMING");
  const ended = matches.filter((m) => getStreamStatus(m) === "ENDED").slice(0, 8);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Goal className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Football Streams</h1>
            <p className="text-sm text-white/60">Live and upcoming football, streamed free</p>
          </div>
        </div>
        {stale && (
          <p className="text-xs text-white/40 mt-3 ml-13 pl-1">
            Showing cached results — live data is temporarily unavailable.
          </p>
        )}
      </div>

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-white/7 bg-card p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/8 flex items-center justify-center mx-auto mb-4">
            <Goal className="w-7 h-7 text-primary/30" />
          </div>
          <p className="text-white font-bold mb-1">No football streams right now</p>
          <p className="text-white/50 text-sm">Check back soon — the list refreshes every minute.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {live.length > 0 && (
            <section>
              <h2 className="text-base font-black text-white tracking-tight mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-danger live-pulse" /> Live Now
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {live.map((stream) => (
                  <PPVStreamCard key={stream.uri_name} stream={stream} />
                ))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <h2 className="text-base font-black text-white tracking-tight mb-4">Upcoming</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {upcoming.map((stream) => (
                  <PPVStreamCard key={stream.uri_name} stream={stream} />
                ))}
              </div>
            </section>
          )}

          {ended.length > 0 && (
            <section>
              <h2 className="text-base font-black text-white/50 tracking-tight mb-4">Recently Ended</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 opacity-60">
                {ended.map((stream) => (
                  <PPVStreamCard key={stream.uri_name} stream={stream} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
