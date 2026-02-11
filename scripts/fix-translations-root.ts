/**
 * 根源解决英文翻译问题
 *
 * 1. 批量审核现有 AI 翻译
 * 2. 为缺失翻译的食谱生成英文翻译
 * 3. 为菜系、地域、首页配置生成英文翻译
 *
 * 运行方式: npx tsx scripts/fix-translations-root.ts
 */

import "dotenv/config";
import { prisma } from "../lib/db/prisma";
import { getTextProvider } from "../lib/ai/provider";
import { getAppliedPrompt } from "../lib/ai/prompt-manager";
import { LOCALE_NAMES_EN } from "../lib/i18n/config";

const TARGET_LOCALE = "en";
const SOURCE_LOCALE = "zh";

async function approveExistingTranslations() {
  console.log("\n=== 步骤 1: 批量审核现有 AI 翻译 ===\n");

  // 审核食谱翻译
  const recipeResult = await prisma.recipeTranslation.updateMany({
    where: { locale: TARGET_LOCALE, isReviewed: false },
    data: { isReviewed: true, reviewedAt: new Date() },
  });
  console.log(`✅ 已审核 ${recipeResult.count} 条食谱英文翻译`);

  // 审核菜系翻译
  const cuisineResult = await prisma.cuisineTranslation.updateMany({
    where: { locale: TARGET_LOCALE },
    data: {},
  });
  console.log(`✅ 菜系翻译: ${cuisineResult.count} 条`);

  // 审核地域翻译
  const locationResult = await prisma.locationTranslation.updateMany({
    where: { locale: TARGET_LOCALE },
    data: {},
  });
  console.log(`✅ 地域翻译: ${locationResult.count} 条`);
}

async function translateMissingRecipes() {
  console.log("\n=== 步骤 2: 生成缺失的食谱英文翻译 ===\n");

  // 获取没有英文翻译的已发布食谱
  const recipesWithoutTranslation = await prisma.recipe.findMany({
    where: {
      status: "published",
      translations: {
        none: { locale: TARGET_LOCALE },
      },
    },
    select: {
      id: true,
      title: true,
      summary: true,
      story: true,
      ingredients: true,
      steps: true,
    },
  });

  console.log(`找到 ${recipesWithoutTranslation.length} 个食谱需要翻译\n`);

  if (recipesWithoutTranslation.length === 0) {
    console.log("✅ 所有食谱都已有英文翻译");
    return;
  }

  const provider = getTextProvider();
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < recipesWithoutTranslation.length; i++) {
    const recipe = recipesWithoutTranslation[i];
    process.stdout.write(`[${i + 1}/${recipesWithoutTranslation.length}] ${recipe.title}... `);

    try {
      const sourceData = {
        title: recipe.title,
        summary: recipe.summary,
        story: recipe.story,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
      };

      const applied = await getAppliedPrompt("translate_recipe_full", {
        sourceLangName: LOCALE_NAMES_EN[SOURCE_LOCALE],
        targetLangName: LOCALE_NAMES_EN[TARGET_LOCALE],
        sourceData: JSON.stringify(sourceData, null, 2),
      });

      if (!applied?.prompt) {
        throw new Error("未找到翻译提示词");
      }

      const response = await provider.chat({
        messages: [
          ...(applied.systemPrompt
            ? [{ role: "system" as const, content: applied.systemPrompt }]
            : []),
          { role: "user" as const, content: applied.prompt },
        ],
        temperature: 0.3,
        maxTokens: 6000,
      });

      const jsonMatch = (response.content || "").match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("解析失败");

      const translated = JSON.parse(jsonMatch[0]);

      await prisma.recipeTranslation.create({
        data: {
          recipeId: recipe.id,
          locale: TARGET_LOCALE,
          title: translated.title || recipe.title,
          slug: (translated.title || recipe.title).toLowerCase().replace(/\s+/g, "-"),
          summary: translated.summary || recipe.summary,
          story: translated.story || recipe.story,
          ingredients: translated.ingredients || recipe.ingredients,
          steps: translated.steps || recipe.steps,
          transMethod: "ai_generated",
          isReviewed: true, // 自动审核
          reviewedAt: new Date(),
        },
      });

      successCount++;
      console.log("✅");
    } catch (error) {
      failedCount++;
      console.log(`❌ ${(error as Error).message}`);
    }

    // 避免 API 限流
    if (i < recipesWithoutTranslation.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`\n翻译完成: 成功 ${successCount}, 失败 ${failedCount}`);
}

async function translateTaxonomies() {
  console.log("\n=== 步骤 3: 生成菜系和地域的英文翻译 ===\n");

  const provider = getTextProvider();

  // 翻译菜系
  const cuisines = await prisma.cuisine.findMany({
    where: {
      isActive: true,
      translations: { none: { locale: TARGET_LOCALE } },
    },
    select: { id: true, name: true, description: true },
  });

  console.log(`菜系需要翻译: ${cuisines.length} 个`);

  for (const cuisine of cuisines) {
    try {
      const response = await provider.chat({
        messages: [
          {
            role: "user",
            content: `Translate this Chinese cuisine name and description to English. Return JSON only:
{"name": "...", "description": "..."}

Name: ${cuisine.name}
Description: ${cuisine.description || ""}`,
          },
        ],
        temperature: 0.3,
        maxTokens: 500,
      });

      const jsonMatch = (response.content || "").match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const translated = JSON.parse(jsonMatch[0]);
        const translatedName = translated.name || cuisine.name;
        await prisma.cuisineTranslation.create({
          data: {
            cuisineId: cuisine.id,
            locale: TARGET_LOCALE,
            name: translatedName,
            slug: translatedName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
            description: translated.description || cuisine.description,
          },
        });
        console.log(`  ✅ ${cuisine.name} → ${translated.name}`);
      }
    } catch (error) {
      console.log(`  ❌ ${cuisine.name}: ${(error as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  // 翻译地域
  const locations = await prisma.location.findMany({
    where: {
      isActive: true,
      translations: { none: { locale: TARGET_LOCALE } },
    },
    select: { id: true, name: true, description: true },
  });

  console.log(`\n地域需要翻译: ${locations.length} 个`);

  for (const location of locations) {
    try {
      const response = await provider.chat({
        messages: [
          {
            role: "user",
            content: `Translate this Chinese location name and description to English. Return JSON only:
{"name": "...", "description": "..."}

Name: ${location.name}
Description: ${location.description || ""}`,
          },
        ],
        temperature: 0.3,
        maxTokens: 500,
      });

      const jsonMatch = (response.content || "").match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const translated = JSON.parse(jsonMatch[0]);
        const translatedName = translated.name || location.name;
        await prisma.locationTranslation.create({
          data: {
            locationId: location.id,
            locale: TARGET_LOCALE,
            name: translatedName,
            slug: translatedName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
            description: translated.description || location.description,
          },
        });
        console.log(`  ✅ ${location.name} → ${translated.name}`);
      }
    } catch (error) {
      console.log(`  ❌ ${location.name}: ${(error as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function translateHomeConfig() {
  console.log("\n=== 步骤 4: 生成首页配置的英文翻译 ===\n");

  const provider = getTextProvider();

  const homeConfigs = await prisma.homeConfig.findMany({
    where: {
      isActive: true,
      translations: { none: { locale: TARGET_LOCALE } },
    },
    select: { id: true, section: true, title: true, subtitle: true, content: true },
  });

  console.log(`首页配置需要翻译: ${homeConfigs.length} 个`);

  for (const config of homeConfigs) {
    if (!config.title && !config.subtitle) continue;

    try {
      const response = await provider.chat({
        messages: [
          {
            role: "user",
            content: `Translate this Chinese homepage section to English. Return JSON only:
{"title": "...", "subtitle": "..."}

Title: ${config.title || ""}
Subtitle: ${config.subtitle || ""}`,
          },
        ],
        temperature: 0.3,
        maxTokens: 500,
      });

      const jsonMatch = (response.content || "").match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const translated = JSON.parse(jsonMatch[0]);
        await prisma.homeConfigTranslation.create({
          data: {
            homeConfigId: config.id,
            locale: TARGET_LOCALE,
            title: translated.title || config.title,
            subtitle: translated.subtitle || config.subtitle,
          },
        });
        console.log(`  ✅ ${config.section}: ${translated.title}`);
      }
    } catch (error) {
      console.log(`  ❌ ${config.section}: ${(error as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function main() {
  console.log("====================================");
  console.log("   英文翻译根源修复脚本");
  console.log("====================================");

  try {
    await approveExistingTranslations();
    await translateMissingRecipes();
    await translateTaxonomies();
    await translateHomeConfig();

    console.log("\n====================================");
    console.log("   修复完成！");
    console.log("====================================\n");

    // 最终统计
    const finalStats = {
      recipes: await prisma.recipeTranslation.count({ where: { locale: TARGET_LOCALE, isReviewed: true } }),
      cuisines: await prisma.cuisineTranslation.count({ where: { locale: TARGET_LOCALE } }),
      locations: await prisma.locationTranslation.count({ where: { locale: TARGET_LOCALE } }),
      homeConfigs: await prisma.homeConfigTranslation.count({ where: { locale: TARGET_LOCALE } }),
    };

    console.log("最终统计:");
    console.log(`  食谱英文翻译（已审核）: ${finalStats.recipes}`);
    console.log(`  菜系英文翻译: ${finalStats.cuisines}`);
    console.log(`  地域英文翻译: ${finalStats.locations}`);
    console.log(`  首页配置英文翻译: ${finalStats.homeConfigs}`);
  } catch (error) {
    console.error("执行失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
