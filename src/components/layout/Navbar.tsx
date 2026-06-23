"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Search, Bell, User, ChevronDown,
  Shield, LogOut, Settings, Star, Tv, Trophy,
  Newspaper, BarChart3, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type SearchResults = {
  matches: Array<{
    id: string; slug: string; status: string;
    homeTeam: { name: string; logo: string | null; shortName: string | null };
    awayTeam: { name: string; logo: string | null; shortName: string | null };
    league: { name: string };
  }>;
  teams: Array<{ id: string; name: string; slug: string; logo: string | null; country: string | null }>;
  leagues: Array<{ id: string; name: string; slug: string; logo: string | null; country: string }>;
};

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) { setResults(null); return; }
      const data = await res.json();
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [searchOpen]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setQuery("");
        setResults(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const hasResults = results && (results.matches.length + results.teams.length + results.leagues.length) > 0;
  const noResults = results && !hasResults && query.length >= 2 && !searching;

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
            {/* Search */}
            <div ref={searchRef} className="relative hidden md:block">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg text-white/75 hover:text-white hover:bg-white/5 transition-all"
              >
                <Search className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 glass rounded-xl shadow-xl border border-white/10 overflow-hidden z-50"
                  >
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/8">
                      <Search className="w-4 h-4 text-white/60 shrink-0" />
                      <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search matches, teams, leagues…"
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
                      />
                      {query && (
                        <button onClick={() => { setQuery(""); setResults(null); }} className="text-white/40 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {searching && (
                      <div className="px-4 py-6 text-center text-sm text-white/50">Searching…</div>
                    )}

                    {noResults && (
                      <div className="px-4 py-6 text-center text-sm text-white/50">No results for "{query}"</div>
                    )}

                    {hasResults && (
                      <div className="py-1 max-h-96 overflow-y-auto">
                        {results!.matches.length > 0 && (
                          <>
                            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Matches</p>
                            {results!.matches.map(m => (
                              <Link
                                key={m.id}
                                href={m.status === "LIVE" || m.status === "HALFTIME" ? `/live/${m.id}` : `/match/${m.slug}`}
                                onClick={() => { setSearchOpen(false); setQuery(""); setResults(null); }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
                              >
                                <span className="text-xs text-white/60 w-8 shrink-0">{m.status === "LIVE" || m.status === "HALFTIME" ? <span className="text-[#00FF84] font-bold">LIVE</span> : "vs"}</span>
                                <span className="text-sm text-white truncate">{m.homeTeam.shortName || m.homeTeam.name} vs {m.awayTeam.shortName || m.awayTeam.name}</span>
                                <span className="ml-auto text-xs text-white/40 shrink-0 truncate max-w-[80px]">{m.league.name}</span>
                              </Link>
                            ))}
                          </>
                        )}

                        {results!.teams.length > 0 && (
                          <>
                            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Teams</p>
                            {results!.teams.map(t => (
                              <Link
                                key={t.id}
                                href={`/team/${t.slug}`}
                                onClick={() => { setSearchOpen(false); setQuery(""); setResults(null); }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
                              >
                                {t.logo ? (
                                  <Image src={t.logo} alt={t.name} width={20} height={20} className="object-contain rounded-sm shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-[#1F2937] flex items-center justify-center text-[10px] text-[#00FF84] font-bold shrink-0">{t.name[0]}</div>
                                )}
                                <span className="text-sm text-white truncate">{t.name}</span>
                                {t.country && <span className="ml-auto text-xs text-white/40 shrink-0">{t.country}</span>}
                              </Link>
                            ))}
                          </>
                        )}

                        {results!.leagues.length > 0 && (
                          <>
                            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Leagues</p>
                            {results!.leagues.map(l => (
                              <Link
                                key={l.id}
                                href={`/league/${l.slug}`}
                                onClick={() => { setSearchOpen(false); setQuery(""); setResults(null); }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
                              >
                                {l.logo ? (
                                  <Image src={l.logo} alt={l.name} width={20} height={20} className="object-contain rounded-sm shrink-0" />
                                ) : (
                                  <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
                                )}
                                <span className="text-sm text-white truncate">{l.name}</span>
                                <span className="ml-auto text-xs text-white/40 shrink-0">{l.country}</span>
                              </Link>
                            ))}
                          </>
                        )}
                      </div>
                    )}

                    {!query && !results && (
                      <div className="px-4 py-5 text-center text-sm text-white/40">Type to search matches, teams or leagues</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
                  <ChevronDown className="w-4 h-4 text-white/75" />
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
              className="md:hidden p-2 rounded-lg text-white/75 hover:text-white hover:bg-white/5"
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
