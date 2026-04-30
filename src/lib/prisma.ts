import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

declare global {
  var _prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL ?? "";

// Re-use the existing client across hot-reload cycles in development.
// In production a fresh client is fine (single long-lived process).
const prisma: PrismaClient =
  globalThis._prisma ??
  (() => {
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
  })();

if (process.env.NODE_ENV !== "production") {
  globalThis._prisma = prisma;
}

export { prisma };
