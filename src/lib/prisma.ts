import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildDatabaseUrl() {
  const base = process.env.DATABASE_URL ?? "";
  if (!base || base.includes("connection_limit")) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}connection_limit=25&pool_timeout=30`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: buildDatabaseUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
