/**
 * 健康检查 API
 * GET /api/health
 *
 * 检查数据库连接和关键表是否存在
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

interface HealthCheck {
  status: "healthy" | "unhealthy";
  timestamp: string;
  checks: {
    database: {
      status: "ok" | "error";
      message?: string;
    };
    tables: {
      status: "ok" | "error";
      missing?: string[];
    };
  };
}

export async function GET() {
  const result: HealthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: "ok" },
      tables: { status: "ok" },
    },
  };

  // 检查数据库连接
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    result.status = "unhealthy";
    result.checks.database = {
      status: "error",
      message: error instanceof Error ? error.message : "Database connection failed",
    };
    return NextResponse.json(result, { status: 503 });
  }

  // 检查关键表是否存在
  const missingTables: string[] = [];

  try {
    await prisma.recipe.findFirst();
  } catch {
    missingTables.push("Recipe");
  }

  try {
    await prisma.collection.findFirst();
  } catch {
    missingTables.push("Collection");
  }

  try {
    await prisma.aIConfig.findFirst();
  } catch {
    missingTables.push("AIConfig");
  }

  try {
    await prisma.user.findFirst();
  } catch {
    missingTables.push("User");
  }

  if (missingTables.length > 0) {
    result.status = "unhealthy";
    result.checks.tables = {
      status: "error",
      missing: missingTables,
    };
    return NextResponse.json(result, { status: 503 });
  }

  return NextResponse.json(result);
}
