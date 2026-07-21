import type { Metadata } from "next";
import Link from "next/link";
import { BarChart2, Globe, Users, Tv } from "lucide-react";

export const metadata: Metadata = {
  title: "Advertise with Us",
  description: "Reach millions of football fans worldwide. Advertise on LiveGoali.",
};

const placements = [
  { name: "Header Banner", desc: "High-visibility banner at the top of every page", size: "728×90 / Responsive" },
  { name: "Sidebar", desc: "Persistent sidebar placement across match and news pages", size: "300×250" },
  { name: "In-Player", desc: "Shown before or during live stream playback", size: "Video / 640×360" },
  { name: "Footer Banner", desc: "Site-wide footer placement with broad reach", size: "728×90 / Responsive" },
  { name: "Sponsored Content", desc: "Native-style sponsored articles and match previews", size: "Custom" },
  { name: "Popup", desc: "Targeted popup for high-impact campaigns", size: "Custom" },
];

const stats = [
  { icon: Globe, label: "Global Reach", value: "Worldwide" },
  { icon: Users, label: "Football Fans", value: "Growing Daily" },
  { icon: Tv, label: "Live Coverage", value: "24/7" },
  { icon: BarChart2, label: "Ad Formats", value: "6 Placements" },
];

export default function AdvertisePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white mb-3">Advertise with LiveGoali</h1>
        <p className="text-white/75 mt-4 leading-relaxed">
          Reach a passionate, engaged global audience of football fans. LiveGoali offers premium advertising placements across live match pages, news, fixtures, and more.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/8 bg-card p-4 text-center">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <s.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-white text-sm font-bold">{s.value}</p>
            <p className="text-white/70 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Ad Placements */}
      <div className="rounded-2xl border border-white/8 bg-card p-6 mb-6">
        <h2 className="text-white font-bold mb-5">Available Ad Placements</h2>
        <div className="space-y-4">
          {placements.map((p, i) => (
            <div key={p.name}>
              {i > 0 && <div className="w-full h-px bg-white/5 mb-4" />}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white text-sm font-semibold">{p.name}</p>
                  <p className="text-white/70 text-xs mt-0.5">{p.desc}</p>
                </div>
                <span className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded-lg shrink-0 font-mono">{p.size}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
        <h2 className="text-xl font-black text-white mb-2">Ready to advertise?</h2>
        <p className="text-white/75 text-sm mb-5">Contact our partnerships team to discuss rates, formats, and campaign options.</p>
        <a
          href="mailto:hello@livegoali.com"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          Get in Touch
        </a>
        <p className="text-white/60 text-xs mt-3">hello@livegoali.com</p>
      </div>

      <div className="mt-8 text-center">
        <p className="text-white/70 text-sm">
          General questions? <Link href="/contact" className="text-primary hover:underline">Visit our Contact page</Link>
        </p>
      </div>
    </div>
  );
}
