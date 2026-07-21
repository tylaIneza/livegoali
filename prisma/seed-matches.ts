import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🏟️  Seeding matches...");

  // Get leagues
  const [pl, laliga, ucl, bundesliga, serieA] = await Promise.all([
    prisma.league.findUnique({ where: { slug: "premier-league" } }),
    prisma.league.findUnique({ where: { slug: "la-liga" } }),
    prisma.league.findUnique({ where: { slug: "champions-league" } }),
    prisma.league.findUnique({ where: { slug: "bundesliga" } }),
    prisma.league.findUnique({ where: { slug: "serie-a" } }),
  ]);

  if (!pl) { console.log("❌ Run seed.ts first"); process.exit(1); }

  // ── Extra PL teams ──────────────────────────────────────────────
  const extraTeams = await Promise.all([
    { name: "Liverpool", slug: "liverpool", shortName: "LIV", logo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg" },
    { name: "Chelsea", slug: "chelsea", shortName: "CHE", logo: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg" },
    { name: "Real Madrid", slug: "real-madrid", shortName: "RMA", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg" },
    { name: "Barcelona", slug: "barcelona", shortName: "BAR", logo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg" },
    { name: "Bayern Munich", slug: "bayern-munich", shortName: "BAY", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg" },
    { name: "Borussia Dortmund", slug: "borussia-dortmund", shortName: "BVB", logo: "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg" },
    { name: "Inter Milan", slug: "inter-milan", shortName: "INT", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg" },
    { name: "AC Milan", slug: "ac-milan", shortName: "MIL", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg" },
    { name: "Paris Saint-Germain", slug: "paris-saint-germain", shortName: "PSG", logo: "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg" },
    { name: "Atletico Madrid", slug: "atletico-madrid", shortName: "ATM", logo: "https://upload.wikimedia.org/wikipedia/en/f/f9/Atletico_Madrid_Logo_2024.svg" },
    { name: "Juventus", slug: "juventus", shortName: "JUV", logo: "https://upload.wikimedia.org/wikipedia/commons/e/ed/Juventus_FC_-_logo_black_%28Italy%2C_2020%29.svg" },
    { name: "Napoli", slug: "napoli", shortName: "NAP", logo: "https://upload.wikimedia.org/wikipedia/commons/4/4d/SSC_Napoli_2025_%28white_and_azure%29.svg" },
  ].map(async (t) => {
    const leagueId =
      ["real-madrid","barcelona","atletico-madrid"].includes(t.slug) ? laliga?.id :
      ["bayern-munich","borussia-dortmund"].includes(t.slug) ? bundesliga?.id :
      ["inter-milan","ac-milan","juventus","napoli"].includes(t.slug) ? serieA?.id :
      ["paris-saint-germain"].includes(t.slug) ? undefined :
      pl?.id;

    return prisma.team.upsert({
      where: { slug: t.slug },
      update: { logo: t.logo },
      create: { ...t, country: "World", leagueId: leagueId ?? null },
    });
  }));
  console.log(`✓ ${extraTeams.length} extra teams`);

  // Helper to find team by slug
  const team = async (slug: string) => {
    const t = await prisma.team.findUnique({ where: { slug } });
    if (!t) throw new Error(`Team not found: ${slug}`);
    return t;
  };

  const now = new Date();
  const inMinutes = (m: number) => new Date(now.getTime() - m * 60 * 1000);
  const inHours = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);

  // ── LIVE MATCHES ────────────────────────────────────────────────
  const liveMatches = [
    {
      slug: "arsenal-vs-chelsea-live",
      leagueId: pl!.id,
      home: "arsenal", away: "chelsea",
      homeScore: 2, awayScore: 1,
      status: "LIVE" as const, minute: 67,
      scheduledAt: inMinutes(70),
      isFeatured: true,
    },
    {
      slug: "real-madrid-vs-barcelona-live",
      leagueId: laliga!.id,
      home: "real-madrid", away: "barcelona",
      homeScore: 1, awayScore: 1,
      status: "LIVE" as const, minute: 54,
      scheduledAt: inMinutes(57),
      isFeatured: false,
    },
    {
      slug: "bayern-vs-dortmund-live",
      leagueId: bundesliga!.id,
      home: "bayern-munich", away: "borussia-dortmund",
      homeScore: 3, awayScore: 0,
      status: "HALFTIME" as const, minute: 45,
      scheduledAt: inMinutes(50),
      isFeatured: false,
    },
  ];

  for (const m of liveMatches) {
    const [homeTeam, awayTeam] = await Promise.all([team(m.home), team(m.away)]);
    await prisma.match.upsert({
      where: { slug: m.slug },
      update: { homeScore: m.homeScore, awayScore: m.awayScore, status: m.status, matchMinute: m.minute },
      create: {
        slug: m.slug,
        leagueId: m.leagueId,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status: m.status,
        matchMinute: m.minute,
        scheduledAt: m.scheduledAt,
        isFeatured: m.isFeatured,
        round: "Matchday 34",
        season: "2024/25",
      },
    });
  }
  console.log(`✓ ${liveMatches.length} live matches created`);

  // ── UPCOMING TODAY & TOMORROW ────────────────────────────────────
  const upcomingMatches = [
    // Today
    { slug: "liverpool-vs-manchester-city", leagueId: pl!.id, home: "liverpool", away: "manchester-city", offset: 3, round: "Matchday 34" },
    { slug: "manchester-united-vs-tottenham", leagueId: pl!.id, home: "manchester-united", away: "tottenham-hotspur", offset: 5, round: "Matchday 34" },
    { slug: "barcelona-vs-atletico-madrid", leagueId: laliga!.id, home: "barcelona", away: "atletico-madrid", offset: 4, round: "Jornada 34" },
    { slug: "inter-milan-vs-juventus", leagueId: serieA!.id, home: "inter-milan", away: "juventus", offset: 6, round: "Giornata 34" },
    // Tomorrow
    { slug: "chelsea-vs-aston-villa", leagueId: pl!.id, home: "chelsea", away: "aston-villa", offset: 24, round: "Matchday 34" },
    { slug: "napoli-vs-ac-milan", leagueId: serieA!.id, home: "napoli", away: "ac-milan", offset: 26, round: "Giornata 34" },
    { slug: "arsenal-vs-newcastle", leagueId: pl!.id, home: "arsenal", away: "newcastle-united", offset: 28, round: "Matchday 34" },
    { slug: "real-madrid-vs-atletico-ucl", leagueId: ucl!.id, home: "real-madrid", away: "atletico-madrid", offset: 27, round: "Semi-Final" },
  ];

  for (const m of upcomingMatches) {
    const [homeTeam, awayTeam] = await Promise.all([team(m.home), team(m.away)]);
    await prisma.match.upsert({
      where: { slug: m.slug },
      update: {},
      create: {
        slug: m.slug,
        leagueId: m.leagueId,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        status: "SCHEDULED",
        scheduledAt: inHours(m.offset),
        round: m.round,
        season: "2024/25",
      },
    });
  }
  console.log(`✓ ${upcomingMatches.length} upcoming matches created`);

  // ── Match events for live matches ────────────────────────────────
  const arsenalChelsea = await prisma.match.findUnique({ where: { slug: "arsenal-vs-chelsea-live" } });
  if (arsenalChelsea) {
    const arsTeam = await team("arsenal");
    const cheTeam = await team("chelsea");
    await prisma.matchEvent.createMany({
      skipDuplicates: true,
      data: [
        { matchId: arsenalChelsea.id, type: "GOAL", minute: 12, playerName: "Saka", teamId: arsTeam.id, description: "Beautiful strike from outside the box!" },
        { matchId: arsenalChelsea.id, type: "GOAL", minute: 35, playerName: "Palmer", teamId: cheTeam.id, description: "Penalty kick converted" },
        { matchId: arsenalChelsea.id, type: "YELLOW_CARD", minute: 41, playerName: "Colwill", teamId: cheTeam.id },
        { matchId: arsenalChelsea.id, type: "GOAL", minute: 58, playerName: "Havertz", teamId: arsTeam.id, description: "Header from corner" },
        { matchId: arsenalChelsea.id, type: "YELLOW_CARD", minute: 63, playerName: "Partey", teamId: arsTeam.id },
      ],
    });
  }

  console.log("✅ Match seeding complete!");
  console.log("\nGo to http://localhost:3000 to see live matches!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
