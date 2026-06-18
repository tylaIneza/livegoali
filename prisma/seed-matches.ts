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
    { name: "Liverpool", slug: "liverpool", shortName: "LIV" },
    { name: "Chelsea", slug: "chelsea", shortName: "CHE" },
    { name: "Real Madrid", slug: "real-madrid", shortName: "RMA" },
    { name: "Barcelona", slug: "barcelona", shortName: "BAR" },
    { name: "Bayern Munich", slug: "bayern-munich", shortName: "BAY" },
    { name: "Borussia Dortmund", slug: "borussia-dortmund", shortName: "BVB" },
    { name: "Inter Milan", slug: "inter-milan", shortName: "INT" },
    { name: "AC Milan", slug: "ac-milan", shortName: "MIL" },
    { name: "Paris Saint-Germain", slug: "paris-saint-germain", shortName: "PSG" },
    { name: "Atletico Madrid", slug: "atletico-madrid", shortName: "ATM" },
    { name: "Juventus", slug: "juventus", shortName: "JUV" },
    { name: "Napoli", slug: "napoli", shortName: "NAP" },
  ].map(async (t) => {
    const leagueId =
      ["real-madrid","barcelona","atletico-madrid"].includes(t.slug) ? laliga?.id :
      ["bayern-munich","borussia-dortmund"].includes(t.slug) ? bundesliga?.id :
      ["inter-milan","ac-milan","juventus","napoli"].includes(t.slug) ? serieA?.id :
      ["paris-saint-germain"].includes(t.slug) ? undefined :
      pl?.id;

    return prisma.team.upsert({
      where: { slug: t.slug },
      update: {},
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
    const match = await prisma.match.upsert({
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
        enableComments: true,
        enableChat: true,
        enablePrediction: true,
        round: "Matchday 34",
        season: "2024/25",
      },
    });

    // Add prediction
    await prisma.prediction.upsert({
      where: { matchId: match.id },
      update: {},
      create: {
        matchId: match.id,
        homeWinProb: m.home === "arsenal" ? 55 : m.home === "real-madrid" ? 48 : 65,
        drawProb: 22,
        awayWinProb: m.home === "arsenal" ? 23 : m.home === "real-madrid" ? 30 : 13,
        expectedHomeGoals: 1.8,
        expectedAwayGoals: 1.1,
        confidence: 72,
        aiExplanation: `Based on recent form and head-to-head history, ${homeTeam.name} have the advantage playing at home.`,
        recommendation: "HOME_WIN",
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
    const match = await prisma.match.upsert({
      where: { slug: m.slug },
      update: {},
      create: {
        slug: m.slug,
        leagueId: m.leagueId,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        status: "SCHEDULED",
        scheduledAt: inHours(m.offset),
        enableComments: true,
        enableChat: true,
        enablePrediction: true,
        round: m.round,
        season: "2024/25",
      },
    });

    // Add prediction
    await prisma.prediction.upsert({
      where: { matchId: match.id },
      update: {},
      create: {
        matchId: match.id,
        homeWinProb: Math.floor(35 + Math.random() * 35),
        drawProb: Math.floor(20 + Math.random() * 15),
        awayWinProb: Math.floor(20 + Math.random() * 30),
        expectedHomeGoals: parseFloat((0.9 + Math.random() * 1.5).toFixed(1)),
        expectedAwayGoals: parseFloat((0.7 + Math.random() * 1.2).toFixed(1)),
        confidence: Math.floor(58 + Math.random() * 25),
        aiExplanation: `${homeTeam.name} vs ${awayTeam.name} — prediction based on recent form, H2H, and home advantage.`,
        recommendation: "HOME_WIN",
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
