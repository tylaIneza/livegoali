import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_SPORTS = [
  { name: "Football", slug: "football", icon: "⚽", displayOrder: 0 },
  { name: "Basketball", slug: "basketball", icon: "🏀", displayOrder: 1 },
  { name: "Volleyball", slug: "volleyball", icon: "🏐", displayOrder: 2 },
  { name: "Formula 1", slug: "formula1", icon: "🏎", displayOrder: 3 },
  { name: "UFC Fight Night", slug: "ufc", icon: "🥊", displayOrder: 4 },
  { name: "Boxing", slug: "boxing", icon: "🥊", displayOrder: 5 },
  { name: "Tennis", slug: "tennis", icon: "🎾", displayOrder: 6 },
  { name: "Cricket", slug: "cricket", icon: "🏏", displayOrder: 7 },
];

async function main() {
  console.log("Seeding default sports...");
  for (const sport of DEFAULT_SPORTS) {
    await prisma.sport.upsert({
      where: { slug: sport.slug },
      update: { name: sport.name, icon: sport.icon, displayOrder: sport.displayOrder },
      create: { ...sport, enabled: true },
    });
  }
  console.log(`Seeded ${DEFAULT_SPORTS.length} sports.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
