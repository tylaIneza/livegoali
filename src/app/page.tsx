export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/redis";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AdBanner } from "@/components/AdBanner";
import { HomeRefresher } from "@/components/HomeRefresher";
import { ViewTracker } from "@/components/ViewTracker";
import { Hero } from "@/components/home/Hero";
import { Sidebar } from "@/components/home/Sidebar";
import { LiveCard } from "@/components/home/LiveCard";
import { ScheduleTable } from "@/components/home/ScheduleTable";
import { TrendingNews } from "@/components/home/TrendingNews";
import { UpcomingCard } from "@/components/home/UpcomingCard";
import { SectionHeader } from "@/components/ui/section-header";
import { Radio, Calendar } from "lucide-react";
import { statusFilterToWhere, parseDateParam } from "@/lib/matchFilters";
import { format } from "date-fns";
import type { Metadata } from "next";
import type { HomeMatchItem } from "@/types";

export const metadata: Metadata = {
  title: "LiveGoali — Watch Football Live. Anytime. Anywhere.",
  description: "Watch live football matches streaming now on LiveGoali.",
};

const matchInclude = {
  homeTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
  awayTeam: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
  league: { select: { id: true, name: true, slug: true, logo: true, country: true } },
  sport: { select: { slug: true, name: true, icon: true } },
  streams: { where: { isActive: true }, select: { id: true }, take: 1 },
} as const;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; status?: string }>;
}) {
  const params = await searchParams;
  const scheduleDate = parseDateParam(params.date);
  const dateStr = format(scheduleDate, "yyyy-MM-dd");
  const dayStart = new Date(scheduleDate);
  const dayEnd = new Date(scheduleDate);
  dayEnd.setHours(23, 59, 59, 999);
  const statusWhere = statusFilterToWhere(params.status);
  const activeStatus = ["live", "upcoming", "finished"].includes(params.status ?? "") ? params.status : undefined;
  const isToday = dateStr === format(new Date(), "yyyy-MM-dd");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const liveMatches = (await cacheGet<any>("home:live").then((c: any) => c ?? prisma.match.findMany({
    where: { status: { in: ["LIVE", "HALFTIME"] } },
    include: matchInclude,
    orderBy: [{ isFeatured: "desc" }, { scheduledAt: "asc" }],
  }).then((d) => { cacheSet("home:live", d, 15); return d; })).catch(() => [])) as HomeMatchItem[];

  // A match still marked LIVE is happening *now* regardless of the day it was originally
  // scheduled for — on the "today" view it must surface even if scheduledAt has drifted.
  const includeLiveRegardlessOfDate = isToday && (!activeStatus || activeStatus === "live");
  const dateRangeWhere = {
    scheduledAt: { gte: dayStart, lte: dayEnd },
    ...(statusWhere ? { status: statusWhere } : {}),
  };
  const scheduleWhere = includeLiveRegardlessOfDate
    ? { OR: [{ status: { in: ["LIVE", "HALFTIME"] as ("LIVE" | "HALFTIME")[] } }, dateRangeWhere] }
    : dateRangeWhere;

  const scheduleCacheKey = `home:schedule:${dateStr}:${params.status ?? "all"}`;
  let scheduleMatches = (await cacheGet<any>(scheduleCacheKey) // eslint-disable-line @typescript-eslint/no-explicit-any
    .then((c: any) => c ?? prisma.match.findMany({ // eslint-disable-line @typescript-eslint/no-explicit-any
      where: scheduleWhere,
      include: matchInclude,
      orderBy: { scheduledAt: "asc" },
    }).then((d) => { cacheSet(scheduleCacheKey, d, 20); return d; }))
    .catch(() => [])) as HomeMatchItem[];

  // Upcoming/Finished are real statuses that can legitimately have zero rows on the
  // exact selected day (fixtures aren't evenly spread across every date). Rather than
  // showing an empty box on "today" when the DB does have upcoming/finished matches
  // just on other days, fall back to the nearest ones so the tab reflects real data.
  let scheduleFallback = false;
  if (isToday && scheduleMatches.length === 0 && (activeStatus === "upcoming" || activeStatus === "finished")) {
    const fallbackCacheKey = `home:schedule:fallback:${activeStatus}`;
    const fallbackStatus = activeStatus === "upcoming" ? "SCHEDULED" : "FINISHED";
    const fallbackOrder = activeStatus === "upcoming" ? "asc" : "desc";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fallbackMatches = (await cacheGet<any>(fallbackCacheKey)
      .then((c: any) => c ?? prisma.match.findMany({ // eslint-disable-line @typescript-eslint/no-explicit-any
        where: { status: fallbackStatus },
        include: matchInclude,
        orderBy: { scheduledAt: fallbackOrder },
        take: 20,
      }).then((d) => { cacheSet(fallbackCacheKey, d, 60); return d; }))
      .catch(() => [])) as HomeMatchItem[];
    if (fallbackMatches.length > 0) {
      scheduleMatches = fallbackMatches;
      scheduleFallback = true;
    }
  }

  // Independent from the match queries above — a hiccup here must never blank Live Now/Schedule.
  const [leagues, sports, news, upcomingFeatured] = (await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cacheGet<any>("home:leagues").then((c: any) => c ?? prisma.league.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, country: true, season: true, logo: true, isFeatured: true },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      take: 7,
    }).then((d) => { cacheSet("home:leagues", d, 300); return d; })),
    prisma.sport.findMany({ where: { enabled: true }, orderBy: { displayOrder: "asc" } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cacheGet<any>("home:news").then((c: any) => c ?? prisma.news.findMany({
      where: { isPublished: true },
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }).then((d) => { cacheSet("home:news", d, 120); return d; })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cacheGet<any>("home:upcoming-featured").then((c: any) => c ?? prisma.match.findMany({
      where: { status: "SCHEDULED", isFeatured: true },
      include: matchInclude,
      orderBy: { scheduledAt: "asc" },
      take: 1,
    }).then((d) => { cacheSet("home:upcoming-featured", d, 60); return d; })),
  ]).catch(() => [[], [], [], []])) as [
    Array<{ id: string; name: string; slug: string; logo: string | null }>,
    Array<{ slug: string; name: string; icon: string }>,
    Array<{ id: string; title: string; slug: string; featuredImage: string | null; publishedAt: Date | string | null }>,
    HomeMatchItem[],
  ];

  // Only ever shows a match an admin explicitly marked Featured — no
  // "just pick the first live/upcoming match" guessing, which used to let
  // stale matches keep winning the hero slot by sort order alone.
  const featuredMatch: HomeMatchItem | null =
    liveMatches.find((m) => m.isFeatured) ?? upcomingFeatured[0] ?? null;
  const heroIsLive = !!featuredMatch && (featuredMatch.status === "LIVE" || featuredMatch.status === "HALFTIME");

  return (
    <div className="flex flex-col min-h-screen">
      <ViewTracker type="site" />
      <HomeRefresher />
      <Navbar />
      <div className="max-w-[1600px] mx-auto w-full px-4 pt-2">
        <AdBanner placement="HEADER" className="h-16 sm:h-20" />
      </div>

      <main className="flex-1 pb-16 lg:pb-0">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-[240px_1fr_300px] gap-6">
          {/* Left Sidebar */}
          <Sidebar leagues={leagues} sports={sports} />

          {/* Center Content */}
          <div className="min-w-0 space-y-10">
            <Hero featuredMatch={featuredMatch} isLive={heroIsLive} />

            {/* Live Now — horizontal row */}
            <section>
              <SectionHeader
                icon={Radio}
                iconClassName="bg-danger/15 text-danger"
                title="Live Now"
                subtitle={liveMatches.length > 0 ? `${liveMatches.length} match${liveMatches.length !== 1 ? "es" : ""} in progress` : "No matches live right now"}
                viewAllHref="/live"
              />
              {liveMatches.length === 0 ? (
                <div className="rounded-2xl border border-white/6 bg-card/80 p-10 text-center">
                  <Radio className="w-7 h-7 text-danger/40 mx-auto mb-3" />
                  <p className="text-white font-bold text-sm mb-1">No live matches right now</p>
                  <p className="text-white/50 text-xs">Check today&apos;s schedule below</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveMatches.map((match) => (
                    <LiveCard key={match.id} match={match} />
                  ))}
                </div>
              )}
            </section>

            {/* Today's Matches */}
            <section>
              <SectionHeader
                icon={Calendar}
                title="Today's Matches"
                subtitle={scheduleFallback ? `Nearest ${activeStatus} fixtures` : format(scheduleDate, "EEEE, d MMMM")}
                viewAllHref="/fixtures"
                viewAllLabel="Full Schedule"
              />
              <ScheduleTable matches={scheduleMatches} dateStr={dateStr} activeStatus={activeStatus} />
            </section>
          </div>

          {/* Right Sidebar */}
          <aside className="hidden lg:flex flex-col gap-8 sticky top-20 self-start">
            <TrendingNews articles={news} />
            <UpcomingCard match={upcomingFeatured[0] ?? null} />
          </aside>
        </div>
      </main>

      <div className="max-w-[1600px] mx-auto w-full px-4 pb-2">
        <AdBanner placement="FOOTER" className="h-16 sm:h-20" />
      </div>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
