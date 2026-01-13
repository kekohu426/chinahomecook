/**
 * 检查标签数据脚本
 *
 * 查看 Tag 模型中的标签数据统计
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("📊 标签数据统计\n");

  // 按类型统计标签
  const tags = await prisma.tag.groupBy({
    by: ["type"],
    _count: { id: true },
  });

  console.log("📌 标签类型分布:");
  for (const tag of tags) {
    console.log(`   ${tag.type}: ${tag._count.id} 个`);
  }

  // 统计 RecipeTag 关联
  const recipeTagCount = await prisma.recipeTag.count();
  console.log(`\n🔗 RecipeTag 关联: ${recipeTagCount} 条`);

  // 统计已发布食谱
  const publishedCount = await prisma.recipe.count({
    where: { status: "published" },
  });
  const totalCount = await prisma.recipe.count();
  console.log(`\n📖 食谱统计:`);
  console.log(`   已发布: ${publishedCount}`);
  console.log(`   总数: ${totalCount}`);

  // 统计菜系
  const cuisines = await prisma.cuisine.findMany({
    where: { isActive: true },
    select: { name: true, _count: { select: { recipes: true } } },
    orderBy: { sortOrder: "asc" },
  });

  console.log(`\n🍳 菜系统计:`);
  for (const cuisine of cuisines) {
    console.log(`   ${cuisine.name}: ${cuisine._count.recipes} 个食谱`);
  }

  // 统计地点
  const locations = await prisma.location.findMany({
    where: { isActive: true },
    select: { name: true, _count: { select: { recipes: true } } },
    orderBy: { sortOrder: "asc" },
  });

  console.log(`\n🌍 地点统计:`);
  for (const location of locations) {
    console.log(`   ${location.name}: ${location._count.recipes} 个食谱`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
