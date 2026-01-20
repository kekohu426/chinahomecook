/**
 * AI 生成一级聚合页 /recipe 文案
 *
 * POST /api/admin/recipe-page/ai
 * 返回：{ h1, subtitle, footerText }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { getAppliedPrompt } from "@/lib/ai/prompt-manager";

interface GenerateRequest {
  h1?: string;
  subtitle?: string;
  footerText?: string;
}

interface RecipePageCopy {
  h1: string;
  subtitle: string;
  footerText: string;
}

function extractJson(text: string) {
  let content = text.trim();
  content = content.replace(/^```json\s*/i, "");
  content = content.replace(/^```\s*/i, "");
  content = content.replace(/\s*```$/i, "");
  content = content.trim();

  const jsonStart = content.indexOf("{");
  const jsonEnd = content.lastIndexOf("}");
  if (jsonStart >= 0 && jsonEnd >= 0) {
    content = content.substring(jsonStart, jsonEnd + 1);
  }
  return content;
}

async function generateCopy(
  prompt: string,
  systemPrompt: string | null,
  config: {
    provider?: string | null;
    apiKey?: string | null;
    baseUrl?: string | null;
    model?: string | null;
  }
): Promise<string> {
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
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1200,
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

  return content;
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = (await request.json()) as GenerateRequest;

    const siteConfig = await prisma.siteConfig.findUnique({
      where: { id: "default" },
      select: { siteName: true },
    });
    const siteName = (siteConfig?.siteName as Record<string, string> | null)?.zh;

    const applied = await getAppliedPrompt("recipe_page_copy", {
      siteName: siteName || "",
      currentH1: body.h1 || "",
      currentSubtitle: body.subtitle || "",
      currentFooterText: body.footerText || "",
    });
    if (!applied?.prompt) {
      throw new Error("未找到可用的提示词配置");
    }

    const aiConfig = await prisma.aIConfig.findUnique({
      where: { id: "default" },
    });

    const raw = await generateCopy(applied.prompt, applied.systemPrompt, {
      provider: aiConfig?.textProvider,
      apiKey: aiConfig?.textApiKey,
      baseUrl: aiConfig?.textBaseUrl,
      model: aiConfig?.textModel,
    });

    const parsed = JSON.parse(extractJson(raw)) as Partial<RecipePageCopy>;

    return NextResponse.json({
      success: true,
      data: {
        h1: (parsed.h1 || "").trim(),
        subtitle: (parsed.subtitle || "").trim(),
        footerText: (parsed.footerText || "").trim(),
      },
    });
  } catch (error) {
    console.error("生成 /recipe 文案失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "生成文案失败",
        },
      },
      { status: 500 }
    );
  }
}
