import Link from "next/link";
import { MessageSquare, Play, Camera, Globe, Tv } from "lucide-react";

const footerLinks = {
  Platform: [
    { href: "/", label: "Live Matches" },
    { href: "/fixtures", label: "Fixtures" },
    { href: "/predictions", label: "Predictions" },
    { href: "/news", label: "Football News" },
    { href: "/leagues", label: "Leagues" },
  ],
  Leagues: [
    { href: "/league/premier-league", label: "Premier League" },
    { href: "/league/la-liga", label: "La Liga" },
    { href: "/league/bundesliga", label: "Bundesliga" },
    { href: "/league/serie-a", label: "Serie A" },
    { href: "/league/ligue-1", label: "Ligue 1" },
    { href: "/league/champions-league", label: "Champions League" },
  ],
  Company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    { href: "/advertise", label: "Advertise" },
    { href: "/careers", label: "Careers" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/cookies", label: "Cookie Policy" },
    { href: "/dmca", label: "DMCA" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#0B0F14]/60 backdrop-blur-md border-t border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center font-black text-[#0B0F14] text-sm">
                LG
              </div>
              <span className="text-xl font-black">
                <span className="text-gradient">Live</span>
                <span className="text-white">Goali</span>
              </span>
            </Link>
            <p className="text-white/75 text-sm leading-relaxed mb-6 max-w-xs">
              Watch Football Live. Anytime. Anywhere. Your ultimate destination for live football streaming, predictions, and statistics.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: MessageSquare, href: "#" },
                { icon: Play, href: "#" },
                { icon: Camera, href: "#" },
                { icon: Globe, href: "#" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-lg bg-[#1F2937] flex items-center justify-center text-white/75 hover:text-[#00FF84] hover:bg-[#00FF84]/10 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-white font-bold text-sm mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/75 hover:text-[#00FF84] transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/70 text-sm">
            © {new Date().getFullYear()} LiveGoali. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <Tv className="w-4 h-4 text-[#00FF84]" />
            <span>Watch Football Live. Anytime. Anywhere.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
