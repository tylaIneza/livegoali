"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Bell, User, ChevronDown,
  Shield, LogOut, Settings, Star,
  Newspaper, BarChart3, MonitorPlay, Goal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/search/SearchBar";
import { NotificationBell } from "@/components/NotificationBell";
import { TelegramIcon, TELEGRAM_URL } from "@/components/icons/TelegramIcon";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/live", label: "Live Matches" },
  { href: "/fixtures", label: "Schedule" },
  { href: "/fixtures?sport=football", label: "Football" },
  { href: "/fixtures?sport=basketball", label: "Basketball" },
  { href: "/fixtures?sport=formula1", label: "Formula 1" },
  { href: "/fixtures?sport=ufc", label: "UFC" },
];

const moreLinks = [
  { href: "/live-tv", label: "Live TV", icon: MonitorPlay },
  { href: "/football", label: "Football Streams", icon: Goal },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/leagues", label: "Leagues", icon: BarChart3 },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 30);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const isActive = (href: string) => {
    const path = href.split("?")[0];
    if (path === "/") return pathname === "/";
    return pathname === path && !href.includes("?");
  };

  return (
    <nav
      className={`sticky top-0 z-50 navbar-transition border-b ${
        scrolled ? "glass-dark border-white/8" : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <img src="/livegoali.png" alt="LiveGoali" className="w-10 h-10 sm:w-12 sm:h-12 object-contain group-hover:scale-105 transition-transform duration-200" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1 shrink-0">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive(link.href) ? "text-white" : "text-gray-300 hover:text-white"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <motion.span
                    layoutId="navbar-active-indicator"
                    className="absolute left-3 right-3 -bottom-[1px] h-0.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            ))}

            {/* More dropdown */}
            <div ref={moreRef} className="relative">
              <button
                onClick={() => setMoreOpen((p) => !p)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-150"
              >
                More <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-48 glass rounded-xl shadow-xl border border-white/10 overflow-hidden p-1"
                  >
                    {moreLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <link.icon className="w-4 h-4" />
                        {link.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Centered Search (desktop) */}
          <div className="hidden md:flex flex-1 justify-center max-w-xs mx-auto">
            <SearchBar variant="desktop" />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Telegram Support */}
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join our Telegram support group"
              className="hidden lg:flex group relative items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2AABEE] to-[#229ED9] pl-2 pr-3 py-2 text-white shadow-[0_0_14px_rgba(42,171,238,0.4)] transition-all duration-200 hover:shadow-[0_0_22px_rgba(42,171,238,0.65)] hover:scale-105 active:scale-95"
            >
              <span className="absolute inset-0 rounded-full bg-[#2AABEE]/40 animate-ping [animation-duration:2.4s] group-hover:hidden" />
              <TelegramIcon className="relative w-4 h-4 shrink-0" />
              <span className="relative text-xs font-bold tracking-wide">Talk to Us</span>
            </a>

            {/* Notifications */}
            <NotificationBell />

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-all duration-150"
                >
                  <Avatar className="w-8 h-8 ring-2 ring-primary/30">
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback>
                      {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {session.user.isVIP && (
                    <Badge variant="premium" className="hidden sm:inline-flex text-[10px] px-1.5 py-0">VIP</Badge>
                  )}
                  <ChevronDown className="hidden sm:block w-4 h-4 text-white/75" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 glass rounded-xl shadow-xl border border-white/10 overflow-hidden"
                    >
                      <div className="p-3 border-b border-white/8">
                        <p className="text-sm font-semibold text-white truncate">
                          {session.user.name}
                        </p>
                        <p className="text-xs text-white/75 truncate">{session.user.email}</p>
                      </div>
                      <div className="p-1">
                        <MenuItem href="/profile" icon={User} label="My Profile" />
                        <MenuItem href="/favorites" icon={Star} label="Favorites" />
                        <MenuItem href="/notifications" icon={Bell} label="Notifications" />
                        {(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") && (
                          <MenuItem href="/admin" icon={Shield} label="Admin Dashboard" highlight />
                        )}
                        <MenuItem href="/settings" icon={Settings} label="Settings" />
                        <div className="border-t border-white/8 mt-1 pt-1">
                          <button
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}

            <button
              className="lg:hidden p-2 rounded-lg text-white/75 hover:text-white hover:bg-white/5"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-white/8 bg-background"
          >
            <div className="px-4 py-4 space-y-1">
              <SearchBar variant="mobile" onNavigate={() => setMobileOpen(false)} className="mb-2" />

              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl border border-[#2AABEE]/30 bg-gradient-to-r from-[#2AABEE]/15 to-[#229ED9]/10 hover:from-[#2AABEE]/25 hover:to-[#229ED9]/15 transition-all"
              >
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2AABEE] to-[#229ED9] flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(42,171,238,0.5)]">
                  <TelegramIcon className="w-4 h-4 text-white" />
                </span>
                <span className="font-semibold text-sm text-white">Telegram Support</span>
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent live-pulse" />
                  LIVE
                </span>
              </a>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
              <div className="border-t border-white/8 mt-1 pt-1">
                {moreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <link.icon className="w-5 h-5 text-primary" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                ))}
              </div>
              {!session && (
                <div className="flex gap-2 pt-2 border-t border-white/8">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link href="/register">Get Started</Link>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function MenuItem({
  href,
  icon: Icon,
  label,
  highlight,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
        highlight
          ? "text-primary hover:bg-primary/10"
          : "text-gray-300 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}
