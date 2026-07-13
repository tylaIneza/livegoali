import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Each Node process (every PM2 web worker + the socket server) gets its own
// Prisma Client, so total DB connections = connection_limit × process count.
// Default of 15 assumes ecosystem.config.js's process counts (web: cores-1,
// socket: 1) on a 4-vCPU box — 4 processes × 15 = 60, well under MySQL's
// default max_connections (151), with headroom for PM2's zero-downtime
// reload briefly running old+new instances side by side. Override via
// DB_CONNECTION_LIMIT if the process count or max_connections differ.
function buildDatabaseUrl() {
  const base = process.env.DATABASE_URL ?? "";
  if (!base || base.includes("connection_limit")) return base;
  const limit = process.env.DB_CONNECTION_LIMIT ?? "15";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}connection_limit=${limit}&pool_timeout=30`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: buildDatabaseUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
