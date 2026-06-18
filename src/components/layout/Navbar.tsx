"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Search, Bell, User, ChevronDown,
  Shield, LogOut, Settings, Star, Tv, Trophy,
  Newspaper, BarChart3, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const navLinks = [
  { href: "/", label: "Live", icon: Zap, badge: "LIVE" },
  { href: "/fixtures", label: "Fixtures", icon: Tv },
  { href: "/predictions", label: "Predictions", icon: Trophy },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/leagues", label: "Leagues", icon: BarChart3 },
];

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass-dark border-b border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/livegoali.png" alt="LiveGoali" className="w-9 h-9 object-contain group-hover:scale-105 transition-transform duration-200" />
            <span className="text-xl font-black tracking-tight">
              <span className="text-gradient">Live</span>
              <span className="text-white">Goali</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-150 group"
              >
                <link.icon className="w-4 h-4 group-hover:text-[#00FF84] transition-colors" />
                {link.label}
                {link.badge && (
                  <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold live-pulse">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="hidden md:flex p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <Search className="w-5 h-5" />
            </button>

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-all duration-150"
                >
                  <Avatar className="w-8 h-8 ring-2 ring-[#00FF84]/30">
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback>
                      {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {session.user.isVIP && (
                    <Badge variant="premium" className="text-[10px] px-1.5 py-0">VIP</Badge>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-400" />
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
                        <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
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
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
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
            className="md:hidden border-t border-white/8 bg-[#0B0F14]"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  <link.icon className="w-5 h-5 text-[#00FF84]" />
                  <span className="font-medium">{link.label}</span>
                  {link.badge && (
                    <span className="ml-auto text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
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
          ? "text-[#00FF84] hover:bg-[#00FF84]/10"
          : "text-gray-300 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}
