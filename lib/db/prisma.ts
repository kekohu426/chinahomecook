import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool as PgPool } from "pg";
import ws from "ws";

/**
 * Prisma Client 单例
 *
 * 防止开发环境热重载时创建多个实例
 * 支持本地 PostgreSQL 和 Neon PostgreSQL
 */

// Configure WebSocket for Neon in development
if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
  pgPool: PgPool | undefined;
};

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.NEXT_PUBLIC_DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Check if using local PostgreSQL
  const isLocalDB = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

  if (isLocalDB) {
    // For local PostgreSQL, use pg adapter
    if (!globalForPrisma.pgPool) {
      globalForPrisma.pgPool = new PgPool({ connectionString });
    }

    const adapter = new PrismaPg(globalForPrisma.pgPool);

    return new PrismaClient({
      adapter,
      log: [],
    });
  }

  // Use Neon adapter for Neon PostgreSQL
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({ connectionString });
  }

  const adapter = new PrismaNeon(globalForPrisma.pool);

  return new PrismaClient({
    adapter,
    log: [],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
