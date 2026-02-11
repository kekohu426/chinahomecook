/**
 * 业务流程测试脚本
 *
 * 测试 AI 生成食谱和导入食谱两个核心业务流程
 */

import { prisma } from "../lib/db/prisma";
import { generateRecipe } from "../lib/ai/generate-recipe";
import { RecipeSchema } from "../lib/validators/recipe";

async function testAIGenerateRecipe() {
  console.log("\n========== 测试 AI 生成食谱 ==========\n");

  const startTime = Date.now();

  try {
    // 1. 调用 AI 生成
    console.log("1. 调用 generateRecipe 生成 '番茄炒蛋'...");
    const result = await generateRecipe({
      dishName: "番茄炒蛋",
      servings: 2,
      timeBudget: 15,
      cuisine: "家常菜",
    });

    const generateDuration = Date.now() - startTime;
    console.log(`   生成耗时: ${generateDuration}ms`);

    if (!result.success) {
      console.error("   ❌ AI 生成失败:", result.error);
      if (result.issues) {
        console.error("   验证问题:", result.issues);
      }
      // 如果有部分数据，继续测试保存
      if (!result.data) {
        return { success: false, error: result.error };
      }
    } else {
      console.log("   ✅ AI 生成成功");
    }

    const recipeData = result.data;
    console.log(`   菜名: ${recipeData.titleZh}`);
    console.log(`   食材分组数: ${recipeData.ingredients?.length || 0}`);
    console.log(`   步骤数: ${recipeData.steps?.length || 0}`);

    // 2. 保存到数据库
    console.log("\n2. 保存到数据库...");
    const slug = `test-${recipeData.titleZh}-${Date.now()}`;

    const { tags: aiTags, ...recipeDataWithoutTags } = recipeData as any;

    const recipe = await prisma.recipe.create({
      data: {
        title: recipeDataWithoutTags.titleZh,
        slug,
        description: recipeDataWithoutTags.summary?.oneLine || null,
        difficulty: recipeDataWithoutTags.summary?.difficulty || null,
        prepTime: recipeDataWithoutTags.summary?.timeTotalMin || null,
        servings: recipeDataWithoutTags.summary?.servings?.toString() || null,
        summary: recipeDataWithoutTags.summary as object,
        story: (recipeDataWithoutTags.story ?? null) as object,
        ingredients: recipeDataWithoutTags.ingredients as object,
        steps: recipeDataWithoutTags.steps as object,
        nutrition: (recipeDataWithoutTags.nutrition ?? null) as object,
        faq: (recipeDataWithoutTags.faq ?? null) as object,
        tips: (recipeDataWithoutTags.tips ?? null) as object,
        troubleshooting: (recipeDataWithoutTags.troubleshooting ?? null) as object,
        pairing: (recipeDataWithoutTags.pairing ?? null) as object,
        seo: (recipeDataWithoutTags.seo ?? null) as object,
        notes: (recipeDataWithoutTags.notes ?? null) as object,
        aiGenerated: true,
        status: "draft",
        reviewStatus: "pending",
      },
    });

    console.log(`   ✅ 保存成功, ID: ${recipe.id}`);

    // 3. 创建 ImageGenTask
    console.log("\n3. 创建 ImageGenTask...");
    const stepsForTask = (recipeData.steps || []).map((s: any, idx: number) => ({
      number: s.number || idx + 1,
      description: s.description || s.action || '',
      title: s.title,
      action: s.action,
    }));

    const imageShotsForTask = [
      { key: "cover_main", ratio: "16:9" },
      { key: "cover_detail", ratio: "16:9" },
      { key: "cover_inside", ratio: "16:9" },
    ];

    const imageTask = await prisma.imageGenTask.create({
      data: {
        recipeId: recipe.id,
        recipeName: recipeData.titleZh,
        dishStyle: 'dark_and_moody',
        steps: stepsForTask,
        totalSteps: stepsForTask.length,
        imageShots: imageShotsForTask,
        totalShots: imageShotsForTask.length,
        status: 'pending',
      },
    });

    console.log(`   ✅ ImageGenTask 创建成功, ID: ${imageTask.id}`);

    // 4. 验证数据库记录
    console.log("\n4. 验证数据库记录...");
    const savedRecipe = await prisma.recipe.findUnique({
      where: { id: recipe.id },
      include: { imageGenTasks: true },
    });

    if (savedRecipe) {
      console.log(`   ✅ Recipe 验证通过`);
      console.log(`      - title: ${savedRecipe.title}`);
      console.log(`      - status: ${savedRecipe.status}`);
      console.log(`      - aiGenerated: ${savedRecipe.aiGenerated}`);
      console.log(`      - imageGenTasks: ${savedRecipe.imageGenTasks.length} 个`);
    } else {
      console.error("   ❌ Recipe 未找到");
    }

    // 5. 清理测试数据
    console.log("\n5. 清理测试数据...");
    await prisma.imageGenTask.delete({ where: { id: imageTask.id } });
    await prisma.recipe.delete({ where: { id: recipe.id } });
    console.log("   ✅ 测试数据已清理");

    const totalDuration = Date.now() - startTime;
    console.log(`\n========== AI 生成食谱测试完成 (${totalDuration}ms) ==========\n`);

    return { success: true, recipeId: recipe.id };

  } catch (error) {
    console.error("❌ 测试失败:", error);
    return { success: false, error: String(error) };
  }
}

async function testImportRecipe() {
  console.log("\n========== 测试导入食谱 ==========\n");

  const startTime = Date.now();

  try {
    // 1. 准备测试数据
    console.log("1. 准备测试数据...");
    const testRecipe = {
      titleZh: "测试红烧肉",
      summary: {
        oneLine: "经典的红烧肉，肥而不腻",
        healingTone: "一口下去，满满的幸福感",
        difficulty: "medium",
        timeTotalMin: 90,
        timeActiveMin: 30,
        servings: 4,
      },
      story: "红烧肉是中国传统名菜，历史悠久，风味独特。",
      ingredients: [
        {
          section: "主料",
          items: [
            { name: "五花肉", amount: 500, unit: "克" },
            { name: "冰糖", amount: 30, unit: "克" },
          ],
        },
        {
          section: "调料",
          items: [
            { name: "生抽", amount: 2, unit: "汤匙" },
            { name: "老抽", amount: 1, unit: "汤匙" },
            { name: "料酒", amount: 2, unit: "汤匙" },
          ],
        },
      ],
      steps: [
        {
          id: "step01",
          title: "切块",
          action: "五花肉切成3厘米见方的块",
          heat: "medium",
        },
        {
          id: "step02",
          title: "焯水",
          action: "冷水下锅，加料酒焯水去腥",
          heat: "high",
        },
        {
          id: "step03",
          title: "炒糖色",
          action: "冰糖小火炒至焦糖色",
          heat: "low",
        },
        {
          id: "step04",
          title: "红烧",
          action: "加入五花肉翻炒上色，加生抽老抽和水，小火慢炖1小时",
          heat: "low",
        },
      ],
      tags: {
        scenes: ["家常菜"],
        cookingMethods: ["红烧"],
        tastes: ["咸甜"],
        crowds: ["全家"],
        occasions: ["日常"],
      },
    };

    // 2. 验证 Schema
    console.log("2. 验证 RecipeSchema...");
    const parseResult = RecipeSchema.safeParse(testRecipe);

    if (!parseResult.success) {
      console.error("   ❌ Schema 验证失败:");
      parseResult.error.errors.forEach((e) => {
        console.error(`      - ${e.path.join(".")}: ${e.message}`);
      });
      return { success: false, error: "Schema 验证失败" };
    }

    console.log("   ✅ Schema 验证通过");

    // 3. 保存到数据库
    console.log("\n3. 保存到数据库...");
    const slug = `test-import-${Date.now()}`;

    const recipe = await prisma.recipe.create({
      data: {
        title: testRecipe.titleZh,
        slug,
        description: testRecipe.summary.oneLine,
        difficulty: testRecipe.summary.difficulty,
        prepTime: testRecipe.summary.timeTotalMin,
        servings: String(testRecipe.summary.servings),
        summary: testRecipe.summary,
        story: testRecipe.story,
        ingredients: testRecipe.ingredients,
        steps: testRecipe.steps,
        aiGenerated: true,
        status: "draft",
        reviewStatus: "pending",
      },
    });

    console.log(`   ✅ 保存成功, ID: ${recipe.id}`);

    // 4. 创建 ImageGenTask
    console.log("\n4. 创建 ImageGenTask...");
    const stepsForTask = testRecipe.steps.map((s, idx) => ({
      number: idx + 1,
      description: s.action,
      title: s.title,
      action: s.action,
    }));

    const imageShotsForTask = [
      { key: "cover_main", ratio: "16:9" },
      { key: "cover_detail", ratio: "16:9" },
      { key: "cover_inside", ratio: "16:9" },
    ];

    const imageTask = await prisma.imageGenTask.create({
      data: {
        recipeId: recipe.id,
        recipeName: testRecipe.titleZh,
        dishStyle: "dark_and_moody",
        steps: stepsForTask,
        totalSteps: stepsForTask.length,
        imageShots: imageShotsForTask,
        totalShots: imageShotsForTask.length,
        status: "pending",
      },
    });

    console.log(`   ✅ ImageGenTask 创建成功, ID: ${imageTask.id}`);

    // 5. 验证数据库记录
    console.log("\n5. 验证数据库记录...");
    const savedRecipe = await prisma.recipe.findUnique({
      where: { id: recipe.id },
      include: { imageGenTasks: true },
    });

    if (savedRecipe) {
      console.log(`   ✅ Recipe 验证通过`);
      console.log(`      - title: ${savedRecipe.title}`);
      console.log(`      - ingredients: ${JSON.stringify(savedRecipe.ingredients).length} 字符`);
      console.log(`      - steps: ${JSON.stringify(savedRecipe.steps).length} 字符`);
      console.log(`      - imageGenTasks: ${savedRecipe.imageGenTasks.length} 个`);
    } else {
      console.error("   ❌ Recipe 未找到");
      return { success: false, error: "Recipe 未找到" };
    }

    // 6. 清理测试数据
    console.log("\n6. 清理测试数据...");
    await prisma.imageGenTask.delete({ where: { id: imageTask.id } });
    await prisma.recipe.delete({ where: { id: recipe.id } });
    console.log("   ✅ 测试数据已清理");

    const totalDuration = Date.now() - startTime;
    console.log(`\n========== 导入食谱测试完成 (${totalDuration}ms) ==========\n`);

    return { success: true };

  } catch (error) {
    console.error("❌ 测试失败:", error);
    return { success: false, error: String(error) };
  }
}

async function main() {
  console.log("===================================================");
  console.log("        Recipe Zen 业务流程测试");
  console.log("===================================================");

  try {
    // 测试数据库连接
    console.log("\n检查数据库连接...");
    await prisma.$connect();
    console.log("✅ 数据库连接成功\n");

    // 运行测试
    const importResult = await testImportRecipe();
    const aiResult = await testAIGenerateRecipe();

    // 汇总结果
    console.log("\n===================================================");
    console.log("                   测试汇总");
    console.log("===================================================");
    console.log(`导入食谱测试: ${importResult.success ? "✅ 通过" : "❌ 失败"}`);
    console.log(`AI 生成食谱测试: ${aiResult.success ? "✅ 通过" : "❌ 失败"}`);
    console.log("===================================================\n");

    if (!importResult.success || !aiResult.success) {
      process.exit(1);
    }

  } catch (error) {
    console.error("测试执行失败:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
