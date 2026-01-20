/**
 * AI SEO 内容生成 API
 *
 * POST /api/admin/collections/[id]/ai/seo
 * 一键生成聚合页的所有 SEO 相关内容
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { getAppliedPrompt } from "@/lib/ai/prompt-manager";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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
  systemPrompt: string | null,
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
          ...(systemPrompt
            ? [{ role: "system", content: systemPrompt }]
            : []),
          { role: "user", content: prompt },
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

    // 规范化 JSON 标点（AI 可能输出全角标点或反引号）
    let jsonStr = jsonMatch[0];

    // 处理反引号包裹的多行字符串（AI 有时会用反引号代替双引号）
    // 匹配 "key": `value` 模式，将反引号替换为双引号
    jsonStr = jsonStr.replace(
      /:\s*`([^`]*)`/g,
      (_: string, value: string) => `: "${value.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
    );

    // 只替换 JSON 结构标点，保留字符串内容中的全角字符
    jsonStr = jsonStr
      .replace(/：(?=\s*["\[\{`])/g, ':')  // 全角冒号 -> 半角（仅在值前）
      .replace(/，(?=\s*["\[\{`])/g, ',')  // 全角逗号 -> 半角（仅在值前）
      .replace(/，(?=\s*\})/g, ',')       // 对象结尾前的逗号
      .replace(/，(?=\s*\])/g, ',')       // 数组结尾前的逗号
      .replace(/｛/g, '{')
      .replace(/｝/g, '}')
      .replace(/［/g, '[')
      .replace(/］/g, ']')
      .replace(/＂/g, '"')
      .replace(/"/g, '"')
      .replace(/"/g, '"');

    return JSON.parse(jsonStr);
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

    const applied = await getAppliedPrompt("seo_generate", {
      name: collection.name,
      nameEn: collection.nameEn || collection.name,
      type: collection.type,
      recipeCount: String(collection.cachedPublishedCount),
    });
    if (!applied?.prompt) {
      throw new Error("未找到可用的提示词配置");
    }

    // 调用 AI 生成
    const seoContent = await generateSeoContent(applied.prompt, applied.systemPrompt, {
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
