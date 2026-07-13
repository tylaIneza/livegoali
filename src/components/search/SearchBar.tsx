"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Trophy } from "lucide-react";
import type { SearchResults } from "@/types";

interface SearchBarProps {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
  className?: string;
}

type FlatResult = { type: "match" | "team" | "league"; id: string; href: string };

export function SearchBar({ variant = "desktop", onNavigate, className }: SearchBarProps) {
  const router = useRouter();
  const uid = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); setActiveIndex(-1); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) { setResults(null); setActiveIndex(-1); return; }
      const data = await res.json();
      setResults(data);
      setActiveIndex(-1);
    } catch {
      setResults(null);
      setActiveIndex(-1);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const hasResults = results && (results.matches.length + results.teams.length + results.leagues.length) > 0;
  const noResults = results && !hasResults && query.length >= 2 && !searching;

  const flatResults = useMemo<FlatResult[]>(() => {
    if (!results) return [];
    return [
      ...results.matches.map((m) => ({
        type: "match" as const,
        id: m.id,
        href: m.status === "LIVE" || m.status === "HALFTIME" ? `/live/${m.id}` : `/match/${m.slug}`,
      })),
      ...results.teams.map((t) => ({ type: "team" as const, id: t.id, href: `/team/${t.slug}` })),
      ...results.leagues.map((l) => ({ type: "league" as const, id: l.id, href: `/league/${l.slug}` })),
    ];
  }, [results]);

  const optionId = useCallback((i: number) => `${uid}-option-${i}`, [uid]);
  const listboxId = `${uid}-listbox`;

  const closeAndReset = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setResults(null);
    setActiveIndex(-1);
    onNavigate?.();
  }, [onNavigate]);

  const handleSelect = useCallback((href: string) => {
    router.push(href);
    closeAndReset();
  }, [router, closeAndReset]);

  useEffect(() => {
    if (activeIndex >= 0) {
      document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, optionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flatResults.length === 0) return;
      setIsOpen(true);
      setActiveIndex((i) => (i + 1) % flatResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flatResults.length === 0) return;
      setIsOpen(true);
      setActiveIndex((i) => (i - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && flatResults[activeIndex]) {
        e.preventDefault();
        handleSelect(flatResults[activeIndex].href);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeAndReset();
      inputRef.current?.blur();
    }
  };

  const isDesktop = variant === "desktop";
  const showDropdown = isOpen && query.length > 0;

  return (
    <div ref={wrapperRef} className={`relative ${isDesktop ? "w-full max-w-xs" : "w-full"} ${className ?? ""}`}>
      <div
        className={`flex items-center gap-2 px-3 rounded-xl border transition-colors ${
          isDesktop
            ? "h-10 bg-white/5 border-white/10 focus-within:border-primary/40"
            : "h-11 bg-card border-white/10 focus-within:border-primary/40"
        }`}
      >
        <Search className="w-4 h-4 text-white/50 shrink-0" />
        <input
          ref={inputRef}
          suppressHydrationWarning
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); setActiveIndex(-1); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={isDesktop ? "Search teams, leagues…" : "Search matches, teams, leagues…"}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none h-full"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults(null); setActiveIndex(-1); inputRef.current?.focus(); }}
            className="text-white/40 hover:text-white shrink-0"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -4 }}
            transition={{ duration: 0.15 }}
            id={listboxId}
            role="listbox"
            className={`glass rounded-xl shadow-xl border border-white/10 overflow-hidden z-50 ${
              isDesktop ? "absolute right-0 top-full mt-2 w-80" : "relative mt-2 w-full"
            }`}
          >
            {searching && (
              <div className="px-4 py-6 text-center text-sm text-white/50">Searching…</div>
            )}

            {noResults && (
              <div className="px-4 py-6 text-center text-sm text-white/50">No results for &quot;{query}&quot;</div>
            )}

            {hasResults && (
              <div className="py-1 max-h-96 overflow-y-auto">
                {results!.matches.length > 0 && (
                  <>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Matches</p>
                    {results!.matches.map((m) => {
                      const flatIndex = flatResults.findIndex((f) => f.type === "match" && f.id === m.id);
                      const href = m.status === "LIVE" || m.status === "HALFTIME" ? `/live/${m.id}` : `/match/${m.slug}`;
                      return (
                        <Link
                          key={m.id}
                          id={optionId(flatIndex)}
                          role="option"
                          aria-selected={flatIndex === activeIndex}
                          href={href}
                          onClick={closeAndReset}
                          className={`flex items-center gap-2 px-3 py-2 transition-colors ${flatIndex === activeIndex ? "bg-primary/10" : "hover:bg-white/5"}`}
                        >
                          <span className="text-xs text-white/60 w-8 shrink-0">
                            {m.status === "LIVE" || m.status === "HALFTIME" ? <span className="text-accent font-bold">LIVE</span> : "vs"}
                          </span>
                          <span className="text-sm text-white truncate">{m.homeTeam.shortName || m.homeTeam.name} vs {m.awayTeam.shortName || m.awayTeam.name}</span>
                          <span className="ml-auto text-xs text-white/40 shrink-0 truncate max-w-[80px]">{m.league.name}</span>
                        </Link>
                      );
                    })}
                  </>
                )}

                {results!.teams.length > 0 && (
                  <>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Teams</p>
                    {results!.teams.map((t) => {
                      const flatIndex = flatResults.findIndex((f) => f.type === "team" && f.id === t.id);
                      return (
                        <Link
                          key={t.id}
                          id={optionId(flatIndex)}
                          role="option"
                          aria-selected={flatIndex === activeIndex}
                          href={`/team/${t.slug}`}
                          onClick={closeAndReset}
                          className={`flex items-center gap-2 px-3 py-2 transition-colors ${flatIndex === activeIndex ? "bg-primary/10" : "hover:bg-white/5"}`}
                        >
                          {t.logo ? (
                            <Image src={t.logo} alt={t.name} width={20} height={20} className="object-contain rounded-sm shrink-0" style={{ width: 20, height: 20 }} />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] text-primary font-bold shrink-0">{t.name[0]}</div>
                          )}
                          <span className="text-sm text-white truncate">{t.name}</span>
                          {t.country && <span className="ml-auto text-xs text-white/40 shrink-0">{t.country}</span>}
                        </Link>
                      );
                    })}
                  </>
                )}

                {results!.leagues.length > 0 && (
                  <>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Leagues</p>
                    {results!.leagues.map((l) => {
                      const flatIndex = flatResults.findIndex((f) => f.type === "league" && f.id === l.id);
                      return (
                        <Link
                          key={l.id}
                          id={optionId(flatIndex)}
                          role="option"
                          aria-selected={flatIndex === activeIndex}
                          href={`/league/${l.slug}`}
                          onClick={closeAndReset}
                          className={`flex items-center gap-2 px-3 py-2 transition-colors ${flatIndex === activeIndex ? "bg-primary/10" : "hover:bg-white/5"}`}
                        >
                          {l.logo ? (
                            <Image src={l.logo} alt={l.name} width={20} height={20} className="object-contain rounded-sm shrink-0" style={{ width: 20, height: 20 }} />
                          ) : (
                            <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
                          )}
                          <span className="text-sm text-white truncate">{l.name}</span>
                          <span className="ml-auto text-xs text-white/40 shrink-0">{l.country}</span>
                        </Link>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
