import Link from "next/link";
import Image from "next/image";
import { Play, Tv } from "lucide-react";

function isValidImageUrl(url: string | null): url is string {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
}

interface Props {
  slug: string;
  name: string;
  logo: string | null;
  description?: string | null;
}

export function ChannelCard({ slug, name, logo, description }: Props) {
  return (
    <Link
      href={`/live-tv/${slug}`}
      className="group relative rounded-2xl overflow-hidden border border-white/8 bg-card hover:border-primary/40 transition-all duration-300"
      style={{ boxShadow: "0 0 30px rgba(37,99,235,0.05)" }}
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-danger/70 to-transparent" />

      <div className="p-5 flex flex-col items-center gap-3 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center overflow-hidden group-hover:border-primary/30 transition-all">
            {isValidImageUrl(logo) ? (
              <Image src={logo} alt={name} width={44} height={44} className="object-contain" />
            ) : (
              <Tv className="w-7 h-7 text-white/40" />
            )}
          </div>
          <span className="absolute -top-1 -right-1 flex items-center gap-1 text-[9px] font-black text-danger bg-danger/15 border border-danger/30 px-1.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-danger live-pulse" /> 24/7
          </span>
        </div>

        <div className="min-w-0 w-full">
          <p className="font-bold text-white text-sm truncate group-hover:text-primary transition-colors">{name}</p>
          {description && <p className="text-xs text-white/40 mt-0.5 truncate">{description}</p>}
        </div>

        <span className="flex items-center gap-1.5 text-xs font-bold text-primary-foreground bg-primary px-3 py-1.5 rounded-lg w-full justify-center group-hover:bg-primary/90 transition-all active:scale-[0.98]">
          <Play className="w-3.5 h-3.5 fill-white" /> Watch
        </span>
      </div>
    </Link>
  );
}
