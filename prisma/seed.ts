/**
 * Prisma 数据库种子脚本
 *
 * 导入示例食谱数据到数据库
 * 运行：npx prisma db seed
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import sampleRecipe from "../data/sample-recipe.json";

// Load environment variables from .env.local
config({ path: ".env.local" });

// PostgreSQL adapter for Prisma 7 (using standard pg driver)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Please check .env.local file.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 开始填充示例数据...");

  // 清空现有数据
  await prisma.recipe.deleteMany();
  console.log("✅ 已清空现有食谱");

  // 导入示例食谱
  const recipe = await prisma.recipe.create({
    data: {
      title: sampleRecipe.titleZh,
      summary: sampleRecipe.summary as object,
      story: sampleRecipe.story as object,
      ingredients: sampleRecipe.ingredients as object[],
      steps: sampleRecipe.steps as object[],
      styleGuide: sampleRecipe.styleGuide as object,
      imageShots: sampleRecipe.imageShots as object[],
      slug: sampleRecipe.titleEn?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `recipe-${Date.now()}`,
      status: "published",
    },
  });

  console.log(`✅ 已创建食谱: ${recipe.title} (ID: ${recipe.id})`);
  console.log(`   标签: ${(recipe.story as any)?.tags?.join(", ") || "无"}`);
  console.log("🎉 示例数据填充完成！");
}

main()
  .catch((e) => {
    console.error("❌ 种子数据填充失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
