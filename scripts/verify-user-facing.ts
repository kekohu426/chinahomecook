/**
 * 验证用户端数据展示
 *
 * 已适配新 schema: status 代替 isPublished, Tag 模型代替分离标签表
 */

import * as fs from "fs";
import * as path from "path";

const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex > 0) {
    const key = trimmed.slice(0, eqIndex);
    let value = trimmed.slice(eqIndex + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function main() {
  const { prisma } = await import("../lib/db/prisma");

  console.log("=== 用户端数据验证 ===\n");

  // 1. 验证粤菜聚合页
  const yueCuisine = await prisma.cuisine.findUnique({
    where: { slug: "yue" },
  });

  if (yueCuisine) {
    const yueRecipes = await prisma.recipe.findMany({
      where: { status: "published", cuisineId: yueCuisine.id },
      select: { title: true, coverImage: true },
    });
    console.log(
      `✅ 粤菜聚合页 (/zh/recipe/cuisine/yue): ${yueRecipes.length} 道已发布食谱`
    );
    console.log(`   菜品: ${yueRecipes.map((r) => r.title).join(", ")}`);
    const withImages = yueRecipes.filter((r) => r.coverImage).length;
    console.log(`   有封面图: ${withImages}/${yueRecipes.length}`);
  }

  // 2. 验证川菜聚合页
  const chuanCuisine = await prisma.cuisine.findUnique({
    where: { slug: "chuan" },
  });

  if (chuanCuisine) {
    const chuanRecipes = await prisma.recipe.findMany({
      where: { status: "published", cuisineId: chuanCuisine.id },
      select: { title: true },
    });
    console.log(
      `✅ 川菜聚合页 (/zh/recipe/cuisine/chuan): ${chuanRecipes.length} 道已发布食谱`
    );
    console.log(`   菜品: ${chuanRecipes.map((r) => r.title).join(", ")}`);
  }

  // 3. 验证场景聚合页（晚餐）- 使用 Tag 模型
  const dinnerTag = await prisma.tag.findFirst({
    where: { slug: "dinner", type: "scene" },
  });

  if (dinnerTag) {
    const dinnerRecipes = await prisma.recipe.count({
      where: {
        status: "published",
        tags: { some: { tagId: dinnerTag.id } },
      },
    });
    console.log(
      `\n✅ 晚餐场景页 (/zh/recipe/scene/dinner): ${dinnerRecipes} 道已发布食谱`
    );
  }

  // 4. 验证做法聚合页（炒）- 使用 Tag 模型
  const stirFryTag = await prisma.tag.findFirst({
    where: { slug: "stir-fry", type: "method" },
  });

  if (stirFryTag) {
    const stirFryRecipes = await prisma.recipe.count({
      where: {
        status: "published",
        tags: { some: { tagId: stirFryTag.id } },
      },
    });
    console.log(
      `\n✅ 炒菜做法页 (/zh/recipe/method/stir-fry): ${stirFryRecipes} 道已发布食谱`
    );
  }

  // 5. 验证口味聚合页（辣）- 使用 Tag 模型
  const spicyTag = await prisma.tag.findFirst({
    where: { slug: "spicy", type: "taste" },
  });

  if (spicyTag) {
    const spicyRecipes = await prisma.recipe.count({
      where: {
        status: "published",
        tags: { some: { tagId: spicyTag.id } },
      },
    });
    console.log(
      `\n✅ 辣味口味页 (/zh/recipe/taste/spicy): ${spicyRecipes} 道已发布食谱`
    );
  }

  // 6. 验证已发布食谱总数
  const publishedTotal = await prisma.recipe.count({
    where: { status: "published" },
  });
  console.log(`\n=== 汇总 ===`);
  console.log(`已发布食谱总数: ${publishedTotal}`);

  // 7. 验证食谱标签覆盖率 - 使用 RecipeTag 关联
  const recipesWithTags = await prisma.recipe.count({
    where: {
      status: "published",
      tags: { some: {} },
    },
  });
  console.log(
    `有标签的已发布食谱: ${recipesWithTags} (${
      publishedTotal > 0 ? Math.round((recipesWithTags / publishedTotal) * 100) : 0
    }%)`
  );

  // 8. 验证已发布的聚合页
  const publishedCollections = await prisma.collection.count({
    where: { status: "published" },
  });
  console.log(`已发布聚合页: ${publishedCollections}`);

  console.log("\n✅ 用户端数据验证完成！");
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
