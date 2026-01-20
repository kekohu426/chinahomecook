/**
 * AI推荐菜名 API
 *
 * POST /api/ai/recommend-recipes
 *
 * 根据锁定的标签和合集信息，AI推荐适合的菜名
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { getAppliedPrompt } from "@/lib/ai/prompt-manager";

// 权限验证
async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "需要管理员权限" }, { status: 403 });
  }
  return null;
}

/**
 * POST /api/ai/recommend-recipes
 *
 * Body:
 * - collectionId?: string - 目标合集ID
 * - lockedTags: { cuisine?: string, location?: string } - 锁定的标签(slug)
 * - count: number - 推荐数量
 * - excludeExisting: boolean - 是否排除已有菜谱
 */
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const {
      collectionId,
      lockedTags = {},
      count = 10,
      excludeExisting = true,
    } = body;

    // 获取已有菜谱标题用于排重
    let existingTitles: string[] = [];
    if (excludeExisting) {
      const existingRecipes = await prisma.recipe.findMany({
        select: { title: true },
        where: {
          status: { in: ["draft", "pending", "published"] },
        },
      });
      existingTitles = existingRecipes.map(r => r.title);
    }

    // 获取菜系和地域信息
    let cuisineName = "";
    let locationName = "";

    if (lockedTags.cuisine) {
      const cuisine = await prisma.cuisine.findUnique({
        where: { slug: lockedTags.cuisine },
      });
      if (cuisine) cuisineName = cuisine.name;
    }

    if (lockedTags.location) {
      const location = await prisma.location.findUnique({
        where: { slug: lockedTags.location },
      });
      if (location) locationName = location.name;
    }

    // 获取AI配置
    const aiConfig = await prisma.aIConfig.findUnique({
      where: { id: "default" },
    });

    if (!aiConfig?.textApiKey || !aiConfig?.textBaseUrl) {
      return NextResponse.json(
        { success: false, error: "AI配置未完成" },
        { status: 500 }
      );
    }

    let collectionName = "通用推荐";
    let collectionType = "custom";
    if (collectionId) {
      const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
        select: { name: true, type: true },
      });
      if (collection) {
        collectionName = collection.name;
        collectionType = collection.type;
      }
    }

    const existingList = existingTitles.slice(0, 50);
    const existingSection = existingList.length
      ? `【已有菜谱（请勿重复推荐）】\n${existingList.join("、")}${existingTitles.length > 50 ? `\n...等共 ${existingTitles.length} 个` : ""}`
      : "";

    const applied = await getAppliedPrompt("dish_recommend", {
      count: String(count),
      collectionName,
      collectionType,
      cuisineLine: cuisineName ? `- 菜系: ${cuisineName}` : "",
      locationLine: locationName ? `- 地区: ${locationName}` : "",
      tagLine: "",
      descriptionLine: "",
      styleLine: "",
      existingSection,
    });
    if (!applied?.prompt) {
      return NextResponse.json(
        { success: false, error: "未找到可用的提示词配置" },
        { status: 500 }
      );
    }

    // 调用AI API
    const response = await fetch(`${aiConfig.textBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${aiConfig.textApiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.textModel || "glm-4-flash",
        messages: [
          ...(applied.systemPrompt
            ? [{ role: "system", content: applied.systemPrompt }]
            : []),
          { role: "user", content: applied.prompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API调用失败:", errorText);
      return NextResponse.json(
        { success: false, error: "AI服务调用失败" },
        { status: 500 }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // 解析AI返回的推荐结果
    const recommendations = parseRecommendations(content, existingTitles);

    return NextResponse.json({
      success: true,
      data: {
        recommendations: recommendations.slice(0, count),
        context: {
          cuisine: cuisineName,
          location: locationName,
          existingCount: existingTitles.length,
        },
      },
    });
  } catch (error) {
    console.error("推荐菜名失败:", error);
    return NextResponse.json(
      { success: false, error: "推荐失败" },
      { status: 500 }
    );
  }
}

/**
/**
 * 解析AI返回的推荐结果
 */
function parseRecommendations(
  content: string,
  existingTitles: string[]
): Array<{
  name: string;
  confidence: number;
  reason: string;
  hasExisting: boolean;
}> {
  try {
    // 尝试提取JSON数组
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("无法解析AI返回:", content);
      return [];
    }

    const items = JSON.parse(jsonMatch[0]);
    const existingSet = new Set(existingTitles.map(t => t.toLowerCase()));

    return items.map((item: any) => ({
      name: item.name || "",
      confidence: Math.min(1, Math.max(0, item.confidence || 0.8)),
      reason: item.reason || "",
      hasExisting: existingSet.has((item.name || "").toLowerCase()),
    }));
  } catch (error) {
    console.error("解析推荐结果失败:", error);
    return [];
  }
}
