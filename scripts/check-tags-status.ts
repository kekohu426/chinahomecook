/**
 * 检查标签字典和食谱标签关联状态
 *
 * 已适配统一的 Tag 模型
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

async function checkTagsStatus() {
  console.log("=== 1. 标签字典数据完整性 ===\n");

  // 使用统一的 Tag 模型
  const tags = await prisma.tag.groupBy({
    by: ["type"],
    _count: { id: true },
  });

  console.log("标签类型分布:");
  for (const tag of tags) {
    console.log(`  ${tag.type}: ${tag._count.id} 个`);
  }

  // 列出各类型的 slug
  for (const tagType of ["scene", "method", "taste", "crowd", "occasion"]) {
    const tagsOfType = await prisma.tag.findMany({
      where: { type: tagType, isActive: true },
      select: { slug: true, name: true },
    });
    console.log(`\n${tagType}: ${tagsOfType.length} 条`);
    if (tagsOfType.length > 0) {
      console.log(`  slugs: ${tagsOfType.map((t) => t.slug).join(", ")}`);
    } else {
      console.log("  ⚠️ 无数据！聚合页会404");
    }
  }

  // 2. 检查食谱标签关联
  console.log("\n\n=== 2. 食谱-标签关联情况 ===\n");

  const totalRecipes = await prisma.recipe.count();
  const publishedRecipes = await prisma.recipe.count({
    where: { status: "published" },
  });

  console.log(`总食谱数: ${totalRecipes}`);
  console.log(`已发布食谱数: ${publishedRecipes}`);

  // 统计 RecipeTag 关联
  const recipeTagCount = await prisma.recipeTag.count();
  console.log(`\nRecipeTag 关联总数: ${recipeTagCount}`);

  // 按标签类型统计关联
  for (const tagType of ["scene", "method", "taste", "crowd", "occasion"]) {
    const count = await prisma.recipeTag.count({
      where: { tag: { type: tagType } },
    });
    console.log(`  ${tagType} 关联: ${count}`);
  }

  // 3. 检查菜系和地点
  console.log("\n\n=== 3. 菜系/地点统计 ===\n");

  const cuisines = await prisma.cuisine.findMany({
    where: { isActive: true },
    select: { slug: true, name: true, _count: { select: { recipes: true } } },
  });

  console.log(`菜系: ${cuisines.length} 个`);
  for (const c of cuisines) {
    console.log(`  ${c.name} (${c.slug}): ${c._count.recipes} 个食谱`);
  }

  const locations = await prisma.location.findMany({
    where: { isActive: true },
    select: { slug: true, name: true, _count: { select: { recipes: true } } },
  });

  console.log(`\n地点: ${locations.length} 个`);
  for (const l of locations) {
    console.log(`  ${l.name} (${l.slug}): ${l._count.recipes} 个食谱`);
  }

  await prisma.$disconnect();
  await pool.end();
}

checkTagsStatus().catch(console.error);
