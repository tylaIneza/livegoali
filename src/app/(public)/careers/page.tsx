import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the LiveGoali team. Help us build the best football platform for fans worldwide.",
};

export default function CareersPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white mb-3">Careers at LiveGoali</h1>
        <p className="text-white/75 mt-4 leading-relaxed">
          We&apos;re a small, passionate team building the best football platform for fans worldwide. If you love football and technology, we&apos;d love to hear from you.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">Who We&apos;re Looking For</h2>
          <p className="text-white/75 text-sm leading-relaxed mb-3">
            LiveGoali is always open to hearing from talented individuals who are passionate about football, technology, and building great user experiences. We look for people who are self-motivated, creative, and eager to make an impact.
          </p>
          <p className="text-white/75 text-sm leading-relaxed">
            We value skills across engineering, design, content, data, and operations. Whether you&apos;re experienced or just starting out, if you have something great to offer, reach out.
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">Current Openings</h2>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <span className="text-2xl">⚽</span>
            </div>
            <p className="text-white font-semibold mb-1">No open positions right now</p>
            <p className="text-white/70 text-sm">We&apos;re not actively hiring at the moment, but we&apos;re always open to great talent.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">Why LiveGoali</h2>
          <ul className="space-y-3 text-white/75 text-sm">
            {[
              "Work on a product used by football fans around the world",
              "Small team with big ambitions — your work makes a real difference",
              "Remote-friendly environment",
              "Passionate about football and technology",
              "Fast-moving, collaborative culture",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-[#00FF84] mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[#00FF84]/20 bg-[#00FF84]/5 p-8 text-center">
          <h2 className="text-xl font-black text-white mb-2">Interested in joining us?</h2>
          <p className="text-white/75 text-sm mb-5">
            Send us your CV and a short note about yourself and what you&apos;d like to work on.
          </p>
          <a
            href="mailto:hello@livegoali.com?subject=Career%20Enquiry"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00FF84] text-[#0B0F14] font-bold text-sm hover:bg-[#00FF84]/90 transition-colors"
          >
            Send Your CV
          </a>
          <p className="text-white/60 text-xs mt-3">hello@livegoali.com</p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-white/70 text-sm">
          Other questions? <Link href="/contact" className="text-[#00FF84] hover:underline">Contact us</Link>
        </p>
      </div>
    </div>
  );
}
