import type { Metadata } from "next";
import { Shield, Zap, Globe, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about LiveGoali — your ultimate destination for live football streaming, predictions, and real-time stats.",
};

const values = [
  {
    icon: Zap,
    title: "Real-Time Coverage",
    description: "Live scores, match events, and streaming updates the moment they happen — no delays, no waiting.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Covering top leagues and tournaments worldwide, from the Premier League to the World Cup.",
  },
  {
    icon: Shield,
    title: "Trusted Platform",
    description: "Built with security and reliability at the core so you never miss a moment of the action.",
  },
  {
    icon: Users,
    title: "Fan Community",
    description: "Live chat, predictions, and discussions — connecting millions of football fans in one place.",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center font-black text-[#0B0F14] text-sm">
            LG
          </div>
          <span className="text-2xl font-black">
            <span className="text-gradient">Live</span>
            <span className="text-white">Goali</span>
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">About LiveGoali</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
          LiveGoali is your ultimate destination for live football streaming, AI-powered match predictions,
          real-time statistics, and a passionate global fan community.
        </p>
      </div>

      {/* Mission */}
      <div className="rounded-2xl border border-white/8 bg-[#121821] p-8 mb-10">
        <h2 className="text-2xl font-black text-white mb-3">Our Mission</h2>
        <p className="text-gray-400 leading-relaxed">
          We believe every football fan deserves access to live matches, accurate statistics, and smart
          insights — no matter where they are in the world. LiveGoali was built to make that possible:
          a single platform that brings together live streaming, predictions, lineups, and real-time
          commentary for every match that matters.
        </p>
      </div>

      {/* Values */}
      <h2 className="text-2xl font-black text-white mb-6">What We Stand For</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
        {values.map((v) => (
          <div key={v.title} className="rounded-2xl border border-white/8 bg-[#121821] p-6">
            <div className="w-10 h-10 rounded-xl bg-[#00FF84]/10 flex items-center justify-center mb-4">
              <v.icon className="w-5 h-5 text-[#00FF84]" />
            </div>
            <h3 className="text-white font-bold mb-2">{v.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{v.description}</p>
          </div>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="rounded-2xl border border-[#00FF84]/20 bg-[#00FF84]/5 p-8 text-center">
        <h2 className="text-xl font-black text-white mb-2">Want to get in touch?</h2>
        <p className="text-gray-400 text-sm mb-4">We&apos;d love to hear from you — whether it&apos;s feedback, partnerships, or just to say hello.</p>
        <a
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00FF84] text-[#0B0F14] font-bold text-sm hover:bg-[#00FF84]/90 transition-colors"
        >
          Contact Us
        </a>
      </div>
    </div>
  );
}
