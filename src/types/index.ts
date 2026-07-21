import type { UserRole, MatchStatus, StreamType } from "@prisma/client";

export type { UserRole, MatchStatus, StreamType };

export interface MatchWithTeams {
  id: string;
  slug: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  matchMinute: number | null;
  startedAt?: Date | null;
  scheduledAt: Date;
  isFeatured: boolean;
  round?: string | null;
  venue?: string | null;
  participant1?: string | null;
  participant2?: string | null;
  title?: string | null;
  homeTeam: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    shortName: string | null;
  } | null;
  awayTeam: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    shortName: string | null;
  } | null;
  league: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    country: string;
  } | null;
  sport?: { slug: string | null } | null;
  streams?: StreamSourceData[];
}

export interface StreamSourceData {
  id: string;
  url: string;
  type: StreamType;
  quality: string;
  isPrimary: boolean;
  isActive: boolean;
  priority: number;
  label: string | null;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  views: number;
  publishedAt: Date | null;
  createdAt: Date;
  category?: {
    name: string;
    slug: string;
  } | null;
}

export interface LeagueData {
  id: string;
  name: string;
  slug: string;
  country: string;
  logo: string | null;
  season: string;
  isFeatured: boolean;
}

export interface TeamData {
  id: string;
  name: string;
  slug: string;
  shortName: string | null;
  logo: string | null;
  stadium: string | null;
  city: string | null;
  country: string | null;
  coach: string | null;
  league?: {
    name: string;
    slug: string;
    logo: string | null;
  } | null;
}

// Minimal shape covering every field accessed on homepage match objects.
// Non-nested so Redis-deserialized JSON (dates as strings) satisfies it.
export interface HomeMatchItem {
  id: string; slug: string; title: string | null; status: string;
  scheduledAt: Date | string; startedAt: Date | string | null;
  homeScore: number | null; awayScore: number | null;
  matchMinute: number | null; round: string | null;
  participant1: string | null; participant2: string | null;
  isFeatured: boolean; streamUrl: string | null; homeTeamId: string | null;
  venue?: string | null;
  streams: { id: string }[];
  homeTeam: { id: string; name: string; slug: string; logo: string | null; shortName: string | null } | null;
  awayTeam: { id: string; name: string; slug: string; logo: string | null; shortName: string | null } | null;
  league: { id: string; name: string; slug: string; logo: string | null; country: string | null } | null;
  sport: { slug: string; name: string; icon: string | null } | null;
}

export interface SearchResults {
  matches: Array<{
    id: string;
    slug: string;
    status: string;
    homeTeam: { name: string; logo: string | null; shortName: string | null };
    awayTeam: { name: string; logo: string | null; shortName: string | null };
    league: { name: string };
  }>;
  teams: Array<{ id: string; name: string; slug: string; logo: string | null; country: string | null }>;
  leagues: Array<{ id: string; name: string; slug: string; logo: string | null; country: string }>;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      isVIP: boolean;
    };
  }
}
