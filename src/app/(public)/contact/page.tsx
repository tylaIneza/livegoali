import type { Metadata } from "next";
import { Mail, MessageSquare, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the LiveGoali team for support, partnerships, or general enquiries.",
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">Contact Us</h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Have a question, found an issue, or want to partner with us? We&apos;re here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {[
          {
            icon: Mail,
            title: "Email Us",
            desc: "For general enquiries and support",
            value: "support@livegoali.com",
            href: "mailto:support@livegoali.com",
          },
          {
            icon: MessageSquare,
            title: "Partnerships",
            desc: "Advertising and business partnerships",
            value: "ads@livegoali.com",
            href: "mailto:ads@livegoali.com",
          },
          {
            icon: Clock,
            title: "Response Time",
            desc: "We typically reply within",
            value: "24–48 hours",
            href: null,
          },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-white/8 bg-[#121821] p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#00FF84]/10 flex items-center justify-center mx-auto mb-4">
              <item.icon className="w-6 h-6 text-[#00FF84]" />
            </div>
            <h3 className="text-white font-bold mb-1">{item.title}</h3>
            <p className="text-gray-500 text-xs mb-3">{item.desc}</p>
            {item.href ? (
              <a href={item.href} className="text-[#00FF84] text-sm font-semibold hover:underline">
                {item.value}
              </a>
            ) : (
              <span className="text-white text-sm font-semibold">{item.value}</span>
            )}
          </div>
        ))}
      </div>

      {/* Contact Form */}
      <div className="rounded-2xl border border-white/8 bg-[#121821] p-8">
        <h2 className="text-xl font-black text-white mb-6">Send us a message</h2>
        <form className="space-y-5" action="mailto:support@livegoali.com" method="get">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Your Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00FF84]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00FF84]/50 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Subject</label>
            <input
              type="text"
              name="subject"
              placeholder="How can we help?"
              className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00FF84]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Message</label>
            <textarea
              name="body"
              rows={5}
              placeholder="Tell us more..."
              className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00FF84]/50 transition-colors resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#00FF84] text-[#0B0F14] font-bold text-sm hover:bg-[#00FF84]/90 transition-colors"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
