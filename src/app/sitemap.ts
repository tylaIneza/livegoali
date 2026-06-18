import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://livegoali.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "always", priority: 1 },
    { url: `${baseUrl}/live`, changeFrequency: "always", priority: 0.9 },
    { url: `${baseUrl}/fixtures`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/predictions`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/news`, changeFrequency: "hourly", priority: 0.7 },
    { url: `${baseUrl}/leagues`, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/league/premier-league`, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/league/la-liga`, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/league/champions-league`, changeFrequency: "daily", priority: 0.7 },
  ];

  try {
    const { prisma } = await import("@/lib/prisma");
    const [matches, leagues, teams, news] = await Promise.all([
      prisma.match.findMany({ select: { slug: true, updatedAt: true }, take: 1000 }),
      prisma.league.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.team.findMany({ select: { slug: true, updatedAt: true }, take: 500 }),
      prisma.news.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    ]);

    return [
      ...staticPages,
      ...matches.map((m) => ({ url: `${baseUrl}/match/${m.slug}`, lastModified: m.updatedAt, changeFrequency: "hourly" as const, priority: 0.8 })),
      ...leagues.map((l) => ({ url: `${baseUrl}/league/${l.slug}`, lastModified: l.updatedAt, changeFrequency: "daily" as const, priority: 0.7 })),
      ...teams.map((t) => ({ url: `${baseUrl}/team/${t.slug}`, lastModified: t.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
      ...news.map((n) => ({ url: `${baseUrl}/news/${n.slug}`, lastModified: n.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
    ];
  } catch {
    return staticPages;
  }
}
