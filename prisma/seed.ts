/**
 * Prisma 数据库种子脚本
 *
 * 导入 PRD Schema v1.1.0 符合的示例食谱数据到数据库
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
  console.log("🌱 开始填充 PRD Schema v1.1.0 数据...");

  // 清空现有数据
  await prisma.recipe.deleteMany();
  console.log("✅ 已清空现有食谱");

  // 导入示例食谱（啤酒鸭 - PRD v1.1.0）
  const recipe = await prisma.recipe.create({
    data: {
      schemaVersion: sampleRecipe.schemaVersion,
      titleZh: sampleRecipe.titleZh,
      titleEn: sampleRecipe.titleEn,
      summary: sampleRecipe.summary,
      story: sampleRecipe.story,
      ingredients: sampleRecipe.ingredients,
      steps: sampleRecipe.steps,
      styleGuide: sampleRecipe.styleGuide,
      imageShots: sampleRecipe.imageShots,
      author: "Recipe Zen Team",
      isPublished: true,
    },
  });

  console.log(`✅ 已创建食谱: ${recipe.titleZh} (ID: ${recipe.id})`);
  console.log(`   Schema 版本: ${recipe.schemaVersion}`);
  console.log(`   标签: ${(recipe.story as any).tags.join(", ")}`);
  console.log("🎉 PRD Schema v1.1.0 数据填充完成！");
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
