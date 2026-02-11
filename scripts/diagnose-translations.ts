import "dotenv/config";
import { prisma } from "../lib/db/prisma";

async function main() {
  console.log("=== 翻译诊断报告 ===\n");

  // 1. 食谱翻译覆盖率
  const totalRecipes = await prisma.recipe.count({ where: { status: "published" } });
  const enTranslations = await prisma.recipeTranslation.count({ where: { locale: "en" } });
  const reviewedEnTranslations = await prisma.recipeTranslation.count({
    where: { locale: "en", isReviewed: true }
  });

  console.log("【食谱翻译】");
  console.log(`  已发布食谱总数: ${totalRecipes}`);
  console.log(`  有英文翻译: ${enTranslations}`);
  console.log(`  已审核英文翻译: ${reviewedEnTranslations}`);
  console.log(`  翻译覆盖率: ${totalRecipes > 0 ? ((enTranslations / totalRecipes) * 100).toFixed(1) : 0}%`);
  console.log(`  审核通过率: ${enTranslations > 0 ? ((reviewedEnTranslations / enTranslations) * 100).toFixed(1) : 0}%`);
  console.log();

  // 2. 未审核的英文翻译示例
  const unreviewedSamples = await prisma.recipeTranslation.findMany({
    where: { locale: "en", isReviewed: false },
    take: 5,
    select: {
      title: true,
      transMethod: true,
      recipe: { select: { title: true } }
    }
  });

  if (unreviewedSamples.length > 0) {
    console.log("【未审核英文翻译示例】");
    unreviewedSamples.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.recipe.title} → ${t.title} (${t.transMethod || "unknown"})`);
    });
    console.log();
  }

  // 3. 首页配置翻译
  const homeConfigs = await prisma.homeConfig.count({ where: { isActive: true } });
  const homeConfigTrans = await prisma.homeConfigTranslation.count({ where: { locale: "en" } });

  console.log("【首页配置翻译】");
  console.log(`  活跃配置数: ${homeConfigs}`);
  console.log(`  有英文翻译: ${homeConfigTrans}`);
  console.log();

  // 4. 菜系翻译
  const cuisines = await prisma.cuisine.count({ where: { isActive: true } });
  const cuisineTrans = await prisma.cuisineTranslation.count({ where: { locale: "en" } });

  console.log("【菜系翻译】");
  console.log(`  活跃菜系数: ${cuisines}`);
  console.log(`  有英文翻译: ${cuisineTrans}`);
  console.log();

  // 5. 地域翻译
  const locations = await prisma.location.count({ where: { isActive: true } });
  const locationTrans = await prisma.locationTranslation.count({ where: { locale: "en" } });

  console.log("【地域翻译】");
  console.log(`  活跃地域数: ${locations}`);
  console.log(`  有英文翻译: ${locationTrans}`);
  console.log();

  // 6. 诊断结论
  console.log("=== 诊断结论 ===");
  if (reviewedEnTranslations < enTranslations) {
    console.log(`⚠️  有 ${enTranslations - reviewedEnTranslations} 条英文翻译未审核`);
    console.log("   建议: 执行方案 A - 批量审核 AI 翻译");
  }
  if (enTranslations < totalRecipes) {
    console.log(`⚠️  有 ${totalRecipes - enTranslations} 个食谱缺少英文翻译`);
    console.log("   建议: 执行方案 C - 批量生成翻译");
  }
  if (reviewedEnTranslations === totalRecipes) {
    console.log("✅ 所有食谱都有已审核的英文翻译");
  }

  await prisma.$disconnect();
}

main().catch(console.error);
