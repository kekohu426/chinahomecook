/**
 * 批量克隆菜谱脚本
 *
 * 用于测试一级/二级聚合页功能
 * 从一个母本菜谱克隆多条，分配不同的标签/菜系/状态
 *
 * 运行方式：
 * DATABASE_URL="..." npx tsx scripts/seed-clone-recipes.ts
 */

import { prisma } from "../lib/db/prisma";

// ============ 配置区 ============
const CLONE_COUNT = 100; // 克隆数量
const BASE_RECIPE_SLUG = ""; // 留空则自动选择第一条已发布菜谱

// ============ 主逻辑 ============
async function main() {
  console.log("🚀 开始克隆菜谱...\n");

  // 1. 获取母本菜谱
  let baseRecipe;
  if (BASE_RECIPE_SLUG) {
    baseRecipe = await prisma.recipe.findUnique({
      where: { slug: BASE_RECIPE_SLUG },
      include: {
        tags: { include: { tag: true } },
        translations: true,
      },
    });
  } else {
    baseRecipe = await prisma.recipe.findFirst({
      where: { status: "published" },
      include: {
        tags: { include: { tag: true } },
        translations: true,
      },
    });
  }

  if (!baseRecipe) {
    console.error("❌ 未找到母本菜谱，请确保数据库中有已发布的菜谱");
    return;
  }

  console.log(`📋 母本菜谱: ${baseRecipe.title} (${baseRecipe.slug})`);
  console.log(`   状态: ${baseRecipe.status}`);
  console.log(`   菜系ID: ${baseRecipe.cuisineId}`);
  console.log(`   地区ID: ${baseRecipe.locationId}`);
  console.log(`   标签数: ${baseRecipe.tags.length}`);
  console.log(`   翻译数: ${baseRecipe.translations.length}\n`);

  // 2. 获取可用的菜系、地区、标签
  const [cuisines, locations, tags] = await Promise.all([
    prisma.cuisine.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    prisma.location.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    prisma.tag.findMany({ where: { isActive: true }, select: { id: true, name: true, type: true } }),
  ]);

  console.log(`📊 可用数据:`);
  console.log(`   菜系: ${cuisines.length} 个 (${cuisines.map(c => c.name).join(", ")})`);
  console.log(`   地区: ${locations.length} 个 (${locations.map(l => l.name).join(", ")})`);
  console.log(`   标签: ${tags.length} 个\n`);

  // 按类型分组标签
  const tagsByType: Record<string, typeof tags> = {};
  for (const tag of tags) {
    if (!tagsByType[tag.type]) tagsByType[tag.type] = [];
    tagsByType[tag.type].push(tag);
  }
  console.log(`   标签类型: ${Object.keys(tagsByType).join(", ")}\n`);

  // 3. 定义分布策略
  const statuses = ["published", "published", "published", "pending", "draft"]; // 60% published, 20% pending, 20% draft
  const cookTimes = [10, 15, 20, 30, 45, 60];
  const prepTimes = [5, 10, 15, 20];

  // 4. 批量创建克隆
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < CLONE_COUNT; i++) {
    const suffix = `clone-${String(i + 1).padStart(3, "0")}`;
    const title = `${baseRecipe.title} ${suffix}`;
    const slug = `${baseRecipe.slug}-${suffix}`;

    // 检查是否已存在
    const existing = await prisma.recipe.findUnique({ where: { slug } });
    if (existing) {
      skipped++;
      continue;
    }

    // 分配属性
    const status = statuses[i % statuses.length];
    const cuisineId = cuisines.length > 0 ? cuisines[i % cuisines.length].id : baseRecipe.cuisineId;
    const locationId = locations.length > 0 ? locations[i % locations.length].id : baseRecipe.locationId;
    const cookTime = cookTimes[i % cookTimes.length];
    const prepTime = prepTimes[i % prepTimes.length];
    const viewCount = Math.floor(Math.random() * 1000) + i * 10;

    // 分配标签（每种类型轮流选一个）
    const assignedTags: string[] = [];
    for (const [type, typeTags] of Object.entries(tagsByType)) {
      if (typeTags.length > 0) {
        const tagIndex = i % typeTags.length;
        assignedTags.push(typeTags[tagIndex].id);
      }
    }

    try {
      await prisma.recipe.create({
        data: {
          title,
          slug,
          summary: baseRecipe.summary,
          ingredients: baseRecipe.ingredients as object,
          steps: baseRecipe.steps as object,
          coverImage: baseRecipe.coverImage,
          status,
          cuisineId,
          locationId,
          cookTime,
          prepTime,
          servings: baseRecipe.servings,
          difficulty: baseRecipe.difficulty,
          viewCount,
          aiGenerated: false,
          // 创建翻译
          translations: {
            create: baseRecipe.translations.map((t) => ({
              locale: t.locale,
              title: `${t.title} ${suffix}`,
              slug: `${t.slug}-${suffix}`,
              summary: t.summary,
              ingredients: t.ingredients as object | undefined,
              steps: t.steps as object | undefined,
              isReviewed: status === "published",
              transMethod: "clone",
            })),
          },
          // 创建标签关联
          tags: {
            create: assignedTags.map((tagId) => ({ tagId })),
          },
        },
      });

      created++;
      if (created % 10 === 0) {
        console.log(`✅ 已创建 ${created}/${CLONE_COUNT} 条...`);
      }
    } catch (error) {
      console.error(`❌ 创建 ${slug} 失败:`, error);
    }
  }

  console.log(`\n🎉 完成！创建 ${created} 条，跳过 ${skipped} 条（已存在）`);

  // 5. 统计结果
  const stats = await prisma.recipe.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  console.log(`\n📊 当前菜谱统计:`);
  for (const stat of stats) {
    console.log(`   ${stat.status}: ${stat._count._all} 条`);
  }

  // 6. 提示下一步
  console.log(`\n📝 下一步建议:`);
  console.log(`   1. 访问 /admin/collections 创建/编辑集合`);
  console.log(`   2. 调用 /api/admin/collections/refresh-counts 刷新缓存`);
  console.log(`   3. 访问 /recipe 查看一级聚合页`);
  console.log(`   4. 访问 /recipe/cuisine/{slug} 查看二级聚合页`);
  console.log(`\n🧹 清理命令:`);
  console.log(`   npx tsx scripts/seed-clone-recipes.ts --cleanup`);
}

// 清理函数
async function cleanup() {
  console.log("🧹 开始清理克隆数据...\n");

  const result = await prisma.recipe.deleteMany({
    where: { slug: { contains: "-clone-" } },
  });

  console.log(`✅ 已删除 ${result.count} 条克隆菜谱`);
}

// 入口
const isCleanup = process.argv.includes("--cleanup");
if (isCleanup) {
  cleanup().finally(() => prisma.$disconnect());
} else {
  main().finally(() => prisma.$disconnect());
}
