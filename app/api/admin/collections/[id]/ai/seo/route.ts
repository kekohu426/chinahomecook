/**
 * AI SEO 内容生成 API
 *
 * POST /api/admin/collections/[id]/ai/seo
 * 一键生成聚合页的所有 SEO 相关内容
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 默认 SEO 提示词模板
const DEFAULT_SEO_PROMPT = `你是一个专业的 SEO 内容专家，为美食网站 Recipe Zen 生成聚合页的 SEO 内容。

请根据以下信息，生成完整的 SEO 内容：

聚合页信息：
- 名称：{name}
- 英文名称：{nameEn}
- 类型：{type}
- 已发布菜谱数量：{recipeCount}

请生成以下内容，严格按照 JSON 格式返回：

{
  "descriptionZh": "页面描述（中文，100-150字，介绍该聚合页的主题和价值）",
  "descriptionEn": "Page description (English, 80-120 words)",
  "titleZh": "SEO标题（中文，25-35字，格式：核心关键词 + 修饰词 + Recipe Zen）",
  "titleEn": "SEO Title (English, 50-60 chars)",
  "metaDescriptionZh": "Meta描述（中文，80-120字，说明页面主题、核心价值、行动号召）",
  "metaDescriptionEn": "Meta description (English, 120-160 chars)",
  "keywords": ["关键词1", "关键词2", "...（8-10个关键词）"],
  "h1Zh": "H1标题（中文，10-20字，清晰直接）",
  "h1En": "H1 Title (English)",
  "subtitleZh": "副标题（中文，15-30字，补充说明页面主题和价值）",
  "subtitleEn": "Subtitle (English)",
  "footerTextZh": "底部介绍文案（中文，500-600字，分3-4段，包含文化背景、烹饪技巧、选购建议、平台特色）"
}

内容要求：
1. 语言温暖友好，有文化内涵
2. 自然融入关键词，不堆砌
3. 提供实际价值，避免空洞营销
4. 符合 Recipe Zen 品牌调性
5. 底部文案每段用 ### 小标题分隔

类型说明：
- cuisine: 菜系类，强调历史文化、代表菜品、味型特征
- ingredient: 食材类，强调营养价值、烹饪方法、选购保存
- scene: 场景类，强调适用场合、搭配建议
- method: 烹饪方式类，强调技法特点、适合食材
- taste: 口味类，强调风味特点、代表菜品
- crowd: 人群类，强调饮食需求、营养搭配
- occasion: 场合类，强调文化意义、传统习俗
- region: 地域类，强调地方特色、美食文化

只返回 JSON，不要其他内容。`;

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { message: "未登录" } },
      { status: 401 }
    );
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: { message: "需要管理员权限" } },
      { status: 403 }
    );
  }
  return null;
}

// 调用 AI 生成内容
async function generateSeoContent(
  prompt: string,
  config: {
    provider?: string | null;
    apiKey?: string | null;
    baseUrl?: string | null;
    model?: string | null;
  }
): Promise<Record<string, unknown>> {
  const provider = config.provider || "glm";
  const apiKey = config.apiKey || process.env.GLM_API_KEY;
  const baseUrl = config.baseUrl || "https://open.bigmodel.cn/api/paas/v4";
  const model = config.model || "glm-4-flash";

  if (!apiKey) {
    throw new Error("未配置 AI API Key");
  }

  let response: Response;

  if (provider === "glm" || provider === "deepseek" || provider === "openai") {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "你是一个专业的 SEO 内容专家，擅长为美食网站生成高质量的 SEO 内容。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });
  } else {
    throw new Error(`不支持的 AI 提供商: ${provider}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI API 错误:", errorText);
    throw new Error(`AI API 调用失败: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI 返回内容为空");
  }

  // 解析 JSON
  try {
    // 尝试提取 JSON 块
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("未找到 JSON 内容");
    }
    return JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error("JSON 解析失败:", content);
    throw new Error("AI 返回内容格式错误");
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;

    // 获取聚合页信息
    const collection = await prisma.collection.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        nameEn: true,
        type: true,
        cachedPublishedCount: true,
      },
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: { message: "聚合页不存在" } },
        { status: 404 }
      );
    }

    // 获取 AI 配置
    const aiConfig = await prisma.aIConfig.findUnique({
      where: { id: "default" },
    });

    // 构建提示词
    const promptTemplate = aiConfig?.seoPrompt || DEFAULT_SEO_PROMPT;
    const prompt = promptTemplate
      .replace(/{name}/g, collection.name)
      .replace(/{nameEn}/g, collection.nameEn || collection.name)
      .replace(/{type}/g, collection.type)
      .replace(/{recipeCount}/g, String(collection.cachedPublishedCount));

    // 调用 AI 生成
    const seoContent = await generateSeoContent(prompt, {
      provider: aiConfig?.textProvider,
      apiKey: aiConfig?.textApiKey,
      baseUrl: aiConfig?.textBaseUrl,
      model: aiConfig?.textModel,
    });

    // 返回生成的内容
    return NextResponse.json({
      success: true,
      data: {
        // 页面描述
        descriptionZh: seoContent.descriptionZh || "",
        descriptionEn: seoContent.descriptionEn || "",
        // SEO 标题
        titleZh: seoContent.titleZh || "",
        titleEn: seoContent.titleEn || "",
        // Meta 描述
        metaDescriptionZh: seoContent.metaDescriptionZh || "",
        metaDescriptionEn: seoContent.metaDescriptionEn || "",
        // 关键词
        keywords: Array.isArray(seoContent.keywords) ? seoContent.keywords : [],
        // H1 标题
        h1Zh: seoContent.h1Zh || "",
        h1En: seoContent.h1En || "",
        // 副标题
        subtitleZh: seoContent.subtitleZh || "",
        subtitleEn: seoContent.subtitleEn || "",
        // 底部文案
        footerTextZh: seoContent.footerTextZh || "",
      },
    });
  } catch (error) {
    console.error("生成 SEO 内容失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "生成 SEO 内容失败",
        },
      },
      { status: 500 }
    );
  }
}
