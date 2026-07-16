import Link from "next/link";
import Image from "next/image";
import { Goal } from "lucide-react";
import { LocalTime } from "@/components/LocalTime";
import { getStreamStatus, type NormalizedPPVStream } from "@/lib/ppv-football";

function isValidImageUrl(url: string | null): url is string {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
}

// uri_name is a multi-segment path (e.g. "mls/2026-07-16/mtl-tor") matched by
// a catch-all route — encode each segment individually so a slash inside a
// segment can't be misread as an extra path boundary.
function watchHref(uriName: string): string {
  return `/football/${uriName.split("/").map(encodeURIComponent).join("/")}`;
}

function StatusPill({ status, startsAt }: { status: "LIVE" | "UPCOMING" | "ENDED"; startsAt: number | null }) {
  if (status === "LIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full text-[10px] font-black text-danger bg-danger/15 border border-danger/30 px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-danger live-pulse" /> LIVE
      </span>
    );
  }
  if (status === "UPCOMING") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full text-[10px] font-black text-primary bg-primary/15 border border-primary/30 px-2 py-0.5">
        {startsAt !== null ? <LocalTime iso={new Date(startsAt)} format="full" /> : "UPCOMING"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full text-[10px] font-black text-white/40 bg-white/5 border border-white/10 px-2 py-0.5">
      ENDED
    </span>
  );
}

export function PPVStreamCard({ stream }: { stream: NormalizedPPVStream }) {
  const status = getStreamStatus(stream);

  return (
    <Link
      href={watchHref(stream.uri_name)}
      className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 ${
        status === "LIVE"
          ? "border-danger/25 bg-card shadow-[0_0_30px_rgba(239,68,68,0.08)]"
          : "border-white/8 bg-card hover:border-primary/40"
      }`}
    >
      <div className="p-5 flex flex-col items-center gap-3 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center overflow-hidden group-hover:border-primary/30 transition-all">
            {isValidImageUrl(stream.poster) ? (
              <Image src={stream.poster} alt={stream.name} width={44} height={44} className="object-contain" />
            ) : (
              <Goal className="w-7 h-7 text-white/40" />
            )}
          </div>
          <span className="absolute -top-1 -right-1">
            <StatusPill status={status} startsAt={stream.starts_at} />
          </span>
        </div>

        <div className="min-w-0 w-full">
          <p className="font-bold text-white text-sm truncate group-hover:text-primary transition-colors">{stream.name}</p>
          {stream.tag && <p className="text-xs text-white/40 mt-0.5 truncate">{stream.tag}</p>}
        </div>

        <span className="flex items-center gap-1.5 text-xs font-bold text-primary-foreground bg-primary px-3 py-1.5 rounded-lg w-full justify-center group-hover:bg-primary/90 transition-all active:scale-[0.98]">
          Watch
        </span>
      </div>
    </Link>
  );
}
