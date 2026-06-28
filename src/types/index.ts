import type { UserRole, MatchStatus, StreamType, PredictionOutcome } from "@prisma/client";

export type { UserRole, MatchStatus, StreamType, PredictionOutcome };

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
  homeTeam: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    shortName: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    shortName: string | null;
  };
  league: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    country: string;
  };
  sport?: { slug: string | null } | null;
  streams?: StreamSourceData[];
  prediction?: PredictionData | null;
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

export interface PredictionData {
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  expectedHomeGoals: number | null;
  expectedAwayGoals: number | null;
  confidence: number;
  aiExplanation: string | null;
  expertAnalysis: string | null;
  recommendation: PredictionOutcome | null;
}

export interface MatchStatisticData {
  homePossession: number | null;
  awayPossession: number | null;
  homeShots: number | null;
  awayShots: number | null;
  homeShotsOnTarget: number | null;
  awayShotsOnTarget: number | null;
  homeCorners: number | null;
  awayCorners: number | null;
  homeYellowCards: number | null;
  awayYellowCards: number | null;
  homeRedCards: number | null;
  awayRedCards: number | null;
  homeOffsides: number | null;
  awayOffsides: number | null;
  homeFouls: number | null;
  awayFouls: number | null;
  homePassAccuracy: number | null;
  awayPassAccuracy: number | null;
  homeXG: number | null;
  awayXG: number | null;
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

export interface CommentData {
  id: string;
  content: string;
  likes: number;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    role: UserRole;
    isVIP: boolean;
  };
  replies?: CommentData[];
  _count?: { replies: number };
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
