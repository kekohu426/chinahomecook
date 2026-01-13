/**
 * AI营养估算 API
 *
 * POST /api/ai/estimate-nutrition
 *
 * 根据食材列表和份量，AI估算营养信息
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

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

interface IngredientItem {
  name: string;
  amount: string;
  unit: string;
}

interface IngredientGroup {
  groupName: string;
  items: IngredientItem[];
}

/**
 * POST /api/ai/estimate-nutrition
 *
 * Body:
 * - recipeName: string - 菜谱名称
 * - ingredients: IngredientGroup[] - 食材列表
 * - servings?: number - 份数（默认1）
 */
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const { recipeName, ingredients, servings = 1 } = body;

    if (!recipeName || !ingredients || ingredients.length === 0) {
      return NextResponse.json(
        { success: false, error: "recipeName 和 ingredients 为必填项" },
        { status: 400 }
      );
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

    // 构建提示词
    const prompt = buildNutritionPrompt(recipeName, ingredients, servings);

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
          {
            role: "system",
            content: "你是一位专业的营养师，精通中餐食材的营养成分。请根据提供的食材清单估算菜品的营养信息。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
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

    // 解析AI返回的营养信息
    const nutrition = parseNutritionResult(content);

    return NextResponse.json({
      success: true,
      data: {
        nutrition,
        servings,
        note: "以上数据为AI估算值，仅供参考",
      },
    });
  } catch (error) {
    console.error("营养估算失败:", error);
    return NextResponse.json(
      { success: false, error: "估算失败" },
      { status: 500 }
    );
  }
}

/**
 * 构建营养估算提示词
 */
function buildNutritionPrompt(
  recipeName: string,
  ingredients: IngredientGroup[],
  servings: number
): string {
  // 整理食材列表
  const ingredientList: string[] = [];
  for (const group of ingredients) {
    for (const item of group.items) {
      if (item.name) {
        ingredientList.push(`${item.name} ${item.amount}${item.unit}`);
      }
    }
  }

  return `请估算以下菜品的营养信息：

菜品名称：${recipeName}
份数：${servings}份

食材清单：
${ingredientList.join("\n")}

请按以下JSON格式返回每份的营养数据：
{
  "calories": 热量(kcal),
  "protein": 蛋白质(g),
  "fat": 脂肪(g),
  "carbs": 碳水化合物(g),
  "fiber": 膳食纤维(g),
  "sodium": 钠(mg)
}

要求：
1. 数值请给出合理的估算值，不需要精确到小数
2. 考虑中餐烹饪方式对营养的影响（如油炸会增加脂肪）
3. 只返回JSON对象，不要其他内容`;
}

/**
 * 解析AI返回的营养信息
 */
function parseNutritionResult(content: string): {
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  sodium?: number;
} {
  try {
    // 尝试提取JSON对象
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("无法解析AI返回的营养信息:", content);
      return {};
    }

    const data = JSON.parse(jsonMatch[0]);
    return {
      calories: typeof data.calories === "number" ? Math.round(data.calories) : undefined,
      protein: typeof data.protein === "number" ? Math.round(data.protein) : undefined,
      fat: typeof data.fat === "number" ? Math.round(data.fat) : undefined,
      carbs: typeof data.carbs === "number" ? Math.round(data.carbs) : undefined,
      fiber: typeof data.fiber === "number" ? Math.round(data.fiber) : undefined,
      sodium: typeof data.sodium === "number" ? Math.round(data.sodium) : undefined,
    };
  } catch (error) {
    console.error("解析营养信息失败:", error);
    return {};
  }
}
