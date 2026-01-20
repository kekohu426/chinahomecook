import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface RecipeTags {
  scenes?: string[];
  cookingMethods?: string[];
  tastes?: string[];
  crowds?: string[];
  occasions?: string[];
}

/**
 * 根据菜名简单判断生成标签
 */
function generateSimpleTags(title: string): RecipeTags {
  const tags: RecipeTags = {
    scenes: ['家常菜'],
    cookingMethods: [],
    tastes: [],
    crowds: [],
    occasions: ['日常'],
  };

  // 根据菜名关键词判断烹饪方式
  if (title.includes('炒') || title.includes('爆')) {
    tags.cookingMethods?.push('炒');
  }
  if (title.includes('炖') || title.includes('煲')) {
    tags.cookingMethods?.push('炖');
  }
  if (title.includes('蒸')) {
    tags.cookingMethods?.push('蒸');
  }
  if (title.includes('煮') || title.includes('汤')) {
    tags.cookingMethods?.push('煮');
  }
  if (title.includes('烤')) {
    tags.cookingMethods?.push('烤');
  }
  if (title.includes('炸')) {
    tags.cookingMethods?.push('炸');
  }
  if (title.includes('煎')) {
    tags.cookingMethods?.push('煎');
  }
  if (title.includes('焖')) {
    tags.cookingMethods?.push('焖');
  }
  if (title.includes('拌') || title.includes('凉')) {
    tags.cookingMethods?.push('拌');
  }
  if (title.includes('卤')) {
    tags.cookingMethods?.push('卤');
  }

  // 如果没有识别出烹饪方式，给个默认的
  if (tags.cookingMethods?.length === 0) {
    tags.cookingMethods?.push('炒');
  }

  // 根据菜名关键词判断口味
  if (title.includes('辣') || title.includes('麻')) {
    tags.tastes?.push('麻辣');
  }
  if (title.includes('糖醋') || title.includes('酸甜')) {
    tags.tastes?.push('酸甜');
  }
  if (title.includes('清') || title.includes('淡')) {
    tags.tastes?.push('清淡');
  }
  if (title.includes('咸')) {
    tags.tastes?.push('咸鲜');
  }
  if (title.includes('香')) {
    tags.tastes?.push('鲜香');
  }

  // 如果没有识别出口味，给个默认的
  if (tags.tastes?.length === 0) {
    tags.tastes?.push('咸鲜');
  }

  return tags;
}

export async function POST(request: NextRequest) {
  try {
    const { limit = 100 } = await request.json();

    console.log('开始查找没有标签的菜谱...');

    // 查找所有 tags 为 null 的菜谱
    const recipes = await prisma.$queryRaw<Array<{
      id: string;
      title: string;
      tags: any;
    }>>`
      SELECT id, title, tags
      FROM "Recipe"
      WHERE tags IS NULL
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `;

    console.log(`找到 ${recipes.length} 个没有标签的菜谱`);

    if (recipes.length === 0) {
      return NextResponse.json({
        success: true,
        message: '所有菜谱都已有标签！',
        processed: 0,
        successCount: 0,
        failCount: 0,
      });
    }

    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      console.log(`[${i + 1}/${recipes.length}] 处理: ${recipe.title}`);

      try {
        // 生成简单标签
        const tags = generateSimpleTags(recipe.title);
        console.log('  生成的标签:', JSON.stringify(tags, null, 2));

        // 更新数据库
        await prisma.recipe.update({
          where: { id: recipe.id },
          data: { tags: tags as any },
        });

        console.log('  ✅ 更新成功');
        successCount++;
        results.push({
          id: recipe.id,
          title: recipe.title,
          success: true,
          tags,
        });
      } catch (error) {
        console.error('  ❌ 更新失败:', error);
        failCount++;
        results.push({
          id: recipe.id,
          title: recipe.title,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `处理完成：成功 ${successCount}，失败 ${failCount}`,
      processed: recipes.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error('修复标签失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
