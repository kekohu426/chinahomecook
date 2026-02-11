/**
 * AI 翻译关于我们区块
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { getTextProvider } from "@/lib/ai/provider";
import { getAppliedPrompt } from "@/lib/ai/prompt-manager";
import { AIGenerationLogger, calculateCost } from "@/lib/ai/generation-logger";
import {
  DEFAULT_LOCALE,
  LOCALE_NAMES_EN,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n/config";

function resolveLocale(value?: string | null): Locale {
  if (value && SUPPORTED_LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  return DEFAULT_LOCALE;
}

function parseJson(content: string) {
  const jsonMatch = content.match(/\[[\s\S]*\]/) || content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  return JSON.parse(jsonMatch[0]);
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const sourceLocale = resolveLocale(body.sourceLocale || DEFAULT_LOCALE);
    const targetLocale = resolveLocale(body.targetLocale);

    if (!targetLocale || targetLocale === sourceLocale) {
      return NextResponse.json(
        { success: false, error: "目标语言不合法" },
        { status: 400 }
      );
    }

    const sections = await prisma.aboutSection.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        translations: true,
      },
    });

    if (sections.length === 0) {
      return NextResponse.json(
        { success: false, error: "没有可翻译的内容" },
        { status: 404 }
      );
    }

    const sourcePayload = sections.map((section) => {
      if (sourceLocale === DEFAULT_LOCALE) {
        return {
          id: section.id,
          title: section.titleZh,
          content: section.contentZh,
        };
      }
      const translation = section.translations.find(
        (t) => t.locale === sourceLocale
      );
      return {
        id: section.id,
        title: translation?.title || section.titleZh,
        content: translation?.content || section.contentZh,
      };
    });

    const targetLangName = LOCALE_NAMES_EN[targetLocale] || targetLocale;
    const applied = await getAppliedPrompt("translate_home_config", {
      targetLangName,
      sourceData: JSON.stringify(sourcePayload, null, 2),
    });

    if (!applied?.prompt) {
      return NextResponse.json(
        { success: false, error: "未找到可用的翻译提示词" },
        { status: 500 }
      );
    }

    const provider = getTextProvider();
    const logger = new AIGenerationLogger();
    const startTime = Date.now();

    const response = await provider.chat({
      messages: [
        ...(applied.systemPrompt
          ? [{ role: "system" as const, content: applied.systemPrompt }]
          : []),
        { role: "user" as const, content: applied.prompt },
      ],
      temperature: 0.2,
      maxTokens: 2000,
    });

    // 记录AI调用日志
    const durationMs = Date.now() - startTime;
    const modelName = provider.getModel();
    const tokenUsage = response.usage
      ? {
          input: response.usage.promptTokens,
          output: response.usage.completionTokens,
          total: response.usage.totalTokens,
        }
      : undefined;

    logger.logSuccess("translation", modelName, {
      prompt: applied.prompt.substring(0, 1000),
      parameters: { temperature: 0.2, maxTokens: 2000, targetLocale },
      tokenUsage,
      cost: tokenUsage ? calculateCost(modelName, tokenUsage) : undefined,
      durationMs,
      provider: provider.getName(),
      metadata: { entityType: "about_section", targetLocale, sectionCount: sections.length },
    });

    const translated = parseJson(response.content || "");
    if (!translated || !Array.isArray(translated)) {
      return NextResponse.json(
        { success: false, error: "AI 返回内容解析失败" },
        { status: 500 }
      );
    }

    const results = await Promise.all(
      translated.map((item: any) =>
        prisma.aboutSectionTranslation.upsert({
          where: { sectionId_locale: { sectionId: item.id, locale: targetLocale } },
          update: { title: item.title || "", content: item.content || "" },
          create: {
            sectionId: item.id,
            locale: targetLocale,
            title: item.title || "",
            content: item.content || "",
          },
        })
      )
    );

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("翻译关于我们配置失败:", error);
    return NextResponse.json(
      { success: false, error: "翻译失败" },
      { status: 500 }
    );
  }
}
