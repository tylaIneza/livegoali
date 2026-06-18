import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const hashedPassword = await bcrypt.hash("Admin@123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@livegoali.com" },
    update: {},
    create: {
      name: "LiveGoali Admin",
      email: "admin@livegoali.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`✓ Admin user: ${admin.email}`);

  // Leagues
  const leagues = await Promise.all([
    prisma.league.upsert({
      where: { slug: "premier-league" },
      update: {},
      create: { name: "Premier League", slug: "premier-league", country: "England", season: "2024/25", isActive: true, isFeatured: true, logo: "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" },
    }),
    prisma.league.upsert({
      where: { slug: "la-liga" },
      update: {},
      create: { name: "La Liga", slug: "la-liga", country: "Spain", season: "2024/25", isActive: true, isFeatured: true, logo: "https://upload.wikimedia.org/wikipedia/commons/1/13/LaLiga_logo_2023.svg" },
    }),
    prisma.league.upsert({
      where: { slug: "bundesliga" },
      update: {},
      create: { name: "Bundesliga", slug: "bundesliga", country: "Germany", season: "2024/25", isActive: true, isFeatured: true },
    }),
    prisma.league.upsert({
      where: { slug: "serie-a" },
      update: {},
      create: { name: "Serie A", slug: "serie-a", country: "Italy", season: "2024/25", isActive: true, isFeatured: true },
    }),
    prisma.league.upsert({
      where: { slug: "ligue-1" },
      update: {},
      create: { name: "Ligue 1", slug: "ligue-1", country: "France", season: "2024/25", isActive: true, isFeatured: true },
    }),
    prisma.league.upsert({
      where: { slug: "champions-league" },
      update: {},
      create: { name: "Champions League", slug: "champions-league", country: "Europe", season: "2024/25", isActive: true, isFeatured: true },
    }),
    prisma.league.upsert({
      where: { slug: "europa-league" },
      update: {},
      create: { name: "Europa League", slug: "europa-league", country: "Europe", season: "2024/25", isActive: true, isFeatured: true },
    }),
    prisma.league.upsert({
      where: { slug: "caf-champions-league" },
      update: {},
      create: { name: "CAF Champions League", slug: "caf-champions-league", country: "Africa", season: "2024/25", isActive: true, isFeatured: true },
    }),
    prisma.league.upsert({
      where: { slug: "rwanda-premier-league" },
      update: {},
      create: { name: "Rwanda Premier League", slug: "rwanda-premier-league", country: "Rwanda", season: "2024/25", isActive: true, isFeatured: true },
    }),
  ]);
  console.log(`✓ ${leagues.length} leagues created`);

  // Premier League teams
  const plTeams = await Promise.all([
    { name: "Arsenal", slug: "arsenal", shortName: "ARS" },
    { name: "Manchester City", slug: "manchester-city", shortName: "MCI" },
    { name: "Liverpool", slug: "liverpool", shortName: "LIV" },
    { name: "Chelsea", slug: "chelsea", shortName: "CHE" },
    { name: "Manchester United", slug: "manchester-united", shortName: "MNU" },
    { name: "Tottenham Hotspur", slug: "tottenham-hotspur", shortName: "TOT" },
    { name: "Newcastle United", slug: "newcastle-united", shortName: "NEW" },
    { name: "Aston Villa", slug: "aston-villa", shortName: "AVL" },
  ].map((t) =>
    prisma.team.upsert({
      where: { slug: t.slug },
      update: {},
      create: { ...t, country: "England", leagueId: leagues[0].id },
    })
  ));
  console.log(`✓ ${plTeams.length} Premier League teams created`);

  // Sample match
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(15, 0, 0, 0);

  const sampleMatch = await prisma.match.upsert({
    where: { slug: "arsenal-vs-manchester-city-2025" },
    update: {},
    create: {
      slug: "arsenal-vs-manchester-city-2025",
      leagueId: leagues[0].id,
      homeTeamId: plTeams[0].id,
      awayTeamId: plTeams[1].id,
      scheduledAt: tomorrow,
      status: "SCHEDULED",
      isFeatured: true,
      enableComments: true,
      enableChat: true,
      enablePrediction: true,
      venue: "Emirates Stadium",
      round: "Matchday 32",
      season: "2024/25",
    },
  });
  console.log(`✓ Sample match: ${sampleMatch.slug}`);

  // Categories for news
  const categories = await Promise.all([
    { name: "Transfer News", slug: "transfer-news" },
    { name: "Match Reports", slug: "match-reports" },
    { name: "Analysis", slug: "analysis" },
    { name: "Interviews", slug: "interviews" },
    { name: "Injury Updates", slug: "injury-updates" },
  ].map((c) =>
    prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    })
  ));
  console.log(`✓ ${categories.length} categories created`);

  // Sample news
  await prisma.news.upsert({
    where: { slug: "welcome-to-livegoali" },
    update: {},
    create: {
      title: "Welcome to LiveGoali - Your Ultimate Football Platform",
      slug: "welcome-to-livegoali",
      excerpt: "LiveGoali launches as the ultimate destination for live football streaming, AI predictions, and real-time statistics.",
      content: "<p>We are thrilled to announce the launch of LiveGoali, your new home for live football. Watch every match, get AI-powered predictions, and join millions of fans in real-time chat.</p><p>Our platform features premium HD streams, real-time statistics, and the most advanced prediction engine in football.</p>",
      isPublished: true,
      isFeatured: true,
      categoryId: categories[0].id,
      publishedAt: new Date(),
    },
  });
  console.log("✓ Sample news article created");

  // Standings for Arsenal
  await prisma.standing.upsert({
    where: { leagueId_teamId_season: { leagueId: leagues[0].id, teamId: plTeams[0].id, season: "2024/25" } },
    update: {},
    create: {
      leagueId: leagues[0].id,
      teamId: plTeams[0].id,
      season: "2024/25",
      position: 1,
      played: 31,
      won: 22,
      drawn: 5,
      lost: 4,
      goalsFor: 68,
      goalsAgainst: 28,
      goalDifference: 40,
      points: 71,
      form: "WWWDW",
    },
  });

  await prisma.standing.upsert({
    where: { leagueId_teamId_season: { leagueId: leagues[0].id, teamId: plTeams[1].id, season: "2024/25" } },
    update: {},
    create: {
      leagueId: leagues[0].id,
      teamId: plTeams[1].id,
      season: "2024/25",
      position: 2,
      played: 31,
      won: 20,
      drawn: 7,
      lost: 4,
      goalsFor: 71,
      goalsAgainst: 33,
      goalDifference: 38,
      points: 67,
      form: "WDWWW",
    },
  });

  console.log("✓ Sample standings created");
  console.log("\n✅ Seeding complete!");
  console.log("\nAdmin credentials:");
  console.log("  Email: admin@livegoali.com");
  console.log("  Password: Admin@123!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
