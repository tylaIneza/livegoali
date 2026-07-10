import type { Metadata } from "next";
import { Mail, Briefcase, Shield, Clock, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { TelegramIcon, TELEGRAM_URL } from "@/components/icons/TelegramIcon";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the LiveGoali team for support, partnerships, copyright concerns, or general enquiries.",
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white mb-3">Contact Us</h1>
        <p className="text-white/75 mt-4 leading-relaxed">
          We&apos;d love to hear from you. Whether you have questions, feedback, business inquiries, technical issues, copyright concerns, or suggestions for improving LiveGoali, our team is here to help.
        </p>
      </div>

      <div className="space-y-6">

        {/* Telegram Support Group — fastest way to get help */}
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block overflow-hidden rounded-2xl border border-[#2AABEE]/30 bg-gradient-to-br from-[#17222f] to-[#121821] p-6 transition-all duration-300 hover:border-[#2AABEE]/60 hover:shadow-[0_0_40px_rgba(42,171,238,0.15)]"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full bg-[#2AABEE]/10 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#2AABEE] to-[#229ED9] flex items-center justify-center shadow-[0_0_24px_rgba(42,171,238,0.4)]">
              <TelegramIcon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-white font-bold">Join Our Telegram Support Group</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#00FF84]/10 text-[#00FF84] text-[10px] font-bold px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF84] live-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-white/70 text-sm">
                Get instant help, stream links, and updates directly from our team and community — fastest way to reach us.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-[#2AABEE] shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </a>

        {/* Get in Touch */}
        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-5">Get in Touch</h2>
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#00FF84]/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-[#00FF84]" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold mb-0.5">General Support</p>
                <p className="text-white/70 text-xs mb-1">For general questions, account assistance, or website support</p>
                <a href="mailto:hello@livegoali.com" className="text-[#00FF84] text-sm hover:underline">hello@livegoali.com</a>
              </div>
            </div>

            <div className="w-full h-px bg-white/5" />

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold mb-0.5">Business &amp; Partnerships</p>
                <p className="text-white/70 text-xs mb-1">For advertising opportunities, sponsorships, partnerships, or business-related inquiries</p>
                <a href="mailto:hello@livegoali.com" className="text-[#00FF84] text-sm hover:underline">hello@livegoali.com</a>
              </div>
            </div>

            <div className="w-full h-px bg-white/5" />

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold mb-0.5">Copyright &amp; Legal Requests</p>
                <p className="text-white/70 text-xs mb-1">For copyright concerns, intellectual property issues, or legal inquiries</p>
                <a href="mailto:hello@livegoali.com" className="text-[#00FF84] text-sm hover:underline">hello@livegoali.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* Response Time */}
        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-white font-bold mb-1">Response Time</h2>
              <p className="text-white/75 text-sm leading-relaxed">
                We aim to respond to most inquiries within <span className="text-white font-semibold">24–72 business hours</span>. Response times may vary depending on the nature and volume of requests.
              </p>
            </div>
          </div>
        </div>

        {/* Report Technical Issues */}
        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-white font-bold mb-1">Report Technical Issues</h2>
              <p className="text-white/75 text-sm">If you experience any technical problems while using LiveGoali, please include:</p>
            </div>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-white/75 text-sm ml-14">
            <li>Device type</li>
            <li>Browser name and version</li>
            <li>Description of the issue</li>
            <li>Screenshots (if available)</li>
          </ul>
          <p className="text-white/70 text-xs mt-3 ml-14">This helps us resolve issues more quickly.</p>
        </div>

        {/* Community Guidelines */}
        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">Community Guidelines</h2>
          <p className="text-white/75 text-sm leading-relaxed">
            When contacting us, please communicate respectfully and provide accurate information. Messages containing spam, abusive language, harassment, or fraudulent content may be ignored or blocked.
          </p>
        </div>

        {/* About */}
        <div className="rounded-2xl border border-[#00FF84]/20 bg-[#00FF84]/5 p-6">
          <h2 className="text-white font-bold mb-3">About LiveGoali</h2>
          <p className="text-white/75 text-sm leading-relaxed mb-4">
            LiveGoali is dedicated to providing football fans with live scores, match information, statistics, predictions, news, and football-related content from around the world. We appreciate your support and feedback as we continue to improve our platform.
          </p>
          <p className="text-white/70 text-sm">Thank you for being part of the LiveGoali community.</p>
          <p className="text-white font-bold mt-2">LiveGoali — Football Lives Here.</p>
        </div>

      </div>

      <div className="mt-10 text-center">
        <p className="text-white/70 text-sm">
          Looking for legal information?{" "}
          <Link href="/privacy" className="text-[#00FF84] hover:underline">Privacy Policy</Link>
          {" · "}
          <Link href="/terms" className="text-[#00FF84] hover:underline">Terms of Service</Link>
        </p>
      </div>
    </div>
  );
}
