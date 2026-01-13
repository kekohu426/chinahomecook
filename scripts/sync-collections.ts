/**
 * 同步标签字典表到 Collection 表
 *
 * 已适配统一的 Tag 模型
 */

import { prisma } from "../lib/db/prisma";

interface SyncStats {
  cuisines: { created: number; skipped: number };
  tags: { created: number; skipped: number };
  locations: { created: number; skipped: number };
}

async function syncCollections() {
  console.log("=== 开始同步标签到 Collection ===\n");

  const stats: SyncStats = {
    cuisines: { created: 0, skipped: 0 },
    tags: { created: 0, skipped: 0 },
    locations: { created: 0, skipped: 0 },
  };

  // 1. 同步菜系
  const cuisines = await prisma.cuisine.findMany({ where: { isActive: true } });
  console.log(`处理 ${cuisines.length} 个菜系...`);
  for (const cuisine of cuisines) {
    const path = `/recipe/cuisine/${cuisine.slug}`;
    const existing = await prisma.collection.findFirst({
      where: { OR: [{ path }, { cuisineId: cuisine.id }] },
    });
    if (existing) {
      stats.cuisines.skipped++;
      continue;
    }
    await prisma.collection.create({
      data: {
        name: cuisine.name,
        slug: cuisine.slug,
        path,
        type: "cuisine",
        status: "DRAFT",
        cuisineId: cuisine.id,
        rules: { type: "cuisine", value: cuisine.slug },
        targetCount: 20,
        minRequired: 10,
      },
    });
    stats.cuisines.created++;
  }

  // 2. 同步标签 (使用统一 Tag 模型)
  const tagTypes = ["scene", "method", "taste", "crowd", "occasion"];
  for (const tagType of tagTypes) {
    const tags = await prisma.tag.findMany({
      where: { type: tagType, isActive: true },
    });
    console.log(`处理 ${tags.length} 个 ${tagType}...`);
    for (const tag of tags) {
      const path = `/recipe/${tagType}/${tag.slug}`;
      const existing = await prisma.collection.findFirst({
        where: { path },
      });
      if (existing) {
        stats.tags.skipped++;
        continue;
      }
      await prisma.collection.create({
        data: {
          name: tag.name,
          slug: tag.slug,
          path,
          type: tagType,
          status: "DRAFT",
          rules: { type: tagType, value: tag.slug, tagId: tag.id },
          targetCount: 20,
          minRequired: 10,
        },
      });
      stats.tags.created++;
    }
  }

  // 3. 同步地点
  const locations = await prisma.location.findMany({ where: { isActive: true } });
  console.log(`处理 ${locations.length} 个地点...`);
  for (const location of locations) {
    const path = `/recipe/region/${location.slug}`;
    const existing = await prisma.collection.findFirst({ where: { path } });
    if (existing) {
      stats.locations.skipped++;
      continue;
    }
    await prisma.collection.create({
      data: {
        name: location.name,
        slug: location.slug,
        path,
        type: "region",
        status: "DRAFT",
        rules: { type: "location", value: location.slug },
        targetCount: 20,
        minRequired: 10,
      },
    });
    stats.locations.created++;
  }

  // 输出统计
  console.log("\n=== 同步完成 ===\n");
  console.log("创建/跳过统计:");
  console.log(`  Cuisine: 创建 ${stats.cuisines.created}, 跳过 ${stats.cuisines.skipped}`);
  console.log(`  Tags (所有类型): 创建 ${stats.tags.created}, 跳过 ${stats.tags.skipped}`);
  console.log(`  Location: 创建 ${stats.locations.created}, 跳过 ${stats.locations.skipped}`);

  const totalCreated =
    stats.cuisines.created + stats.tags.created + stats.locations.created;
  console.log(`\n总计创建: ${totalCreated} 个 Collection`);

  await prisma.$disconnect();
}

syncCollections().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
