/**
 * AI 翻译首页配置 (适配新 Schema)
 *
 * HomeConfig 使用 section + configId 关联翻译
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { getTextProvider } from "@/lib/ai/provider";
import { getAppliedPrompt } from "@/lib/ai/prompt-manager";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  LOCALE_NAMES_EN,
  type Locale,
} from "@/lib/i18n/config";

const DEFAULT_CONFIGS: Record<string, Record<string, unknown>> = {
  hero: {
    title: "做饭，可以更简单",
    subtitle: "专业团队审核 · 语音+计时辅助 · 让每一步更安心",
    placeholder: "从查找食谱到完成烹饪，我们把步骤与工具都准备好",
    chips: ["团队审核把关", "智能推荐菜谱", "免费好用"],
    primaryCta: { label: "浏览全部食谱 →", href: "/recipe" },
    secondaryCta: { label: "或试试 AI定制你的专属菜谱 →", href: "/ai-custom" },
    imageFloatingText: "专业团队审核 · 步骤可复现",
    statsLabels: {
      generated: "已生成",
      recipes: "菜谱",
      collected: "已收藏",
      times: "次",
    },
  },
};

function resolveLocale(value?: string | null): Locale {
  if (value && SUPPORTED_LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  return DEFAULT_LOCALE;
}

function parseJson(content: string) {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  return JSON.parse(jsonMatch[0]);
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const section = body.section || body.key || "hero";
    const sourceLocale = resolveLocale(body.sourceLocale || DEFAULT_LOCALE);
    const targetLocale = resolveLocale(body.targetLocale);

    if (!targetLocale || targetLocale === sourceLocale) {
      return NextResponse.json({ success: false, error: "目标语言不合法" }, { status: 400 });
    }

    // 查找配置
    const baseConfig = await prisma.homeConfig.findFirst({ where: { section } });
    if (!baseConfig) {
      return NextResponse.json({ success: false, error: "未找到要翻译的配置" }, { status: 404 });
    }

    // 获取源内容
    let sourceContent: Record<string, unknown> = {};
    if (sourceLocale === DEFAULT_LOCALE) {
      sourceContent = {
        title: baseConfig.title,
        subtitle: baseConfig.subtitle,
        content: baseConfig.content,
      };
    } else {
      const translation = await prisma.homeConfigTranslation.findFirst({
        where: { configId: baseConfig.id, locale: sourceLocale },
      });
      if (translation) {
        sourceContent = {
          title: translation.title,
          subtitle: translation.subtitle,
          content: translation.content,
        };
      }
    }

    if (!sourceContent.title && !sourceContent.content) {
      sourceContent = DEFAULT_CONFIGS[section] || {};
    }

    const targetLangName = LOCALE_NAMES_EN[targetLocale] || targetLocale;
    const applied = await getAppliedPrompt("translate_home_config", {
      targetLangName,
      sourceData: JSON.stringify(sourceContent, null, 2),
    });
    if (!applied?.prompt) {
      return NextResponse.json({ success: false, error: "未找到可用的提示词配置" }, { status: 500 });
    }

    const provider = await getTextProvider();

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

    const translated = parseJson(response.content || "");
    if (!translated) {
      return NextResponse.json({ success: false, error: "AI 返回内容解析失败" }, { status: 500 });
    }

    const saved = await prisma.homeConfigTranslation.upsert({
      where: { configId_locale: { configId: baseConfig.id, locale: targetLocale } },
      update: {
        title: (translated.title as string) || null,
        subtitle: (translated.subtitle as string) || null,
        content: translated.content || null,
      },
      create: {
        configId: baseConfig.id,
        locale: targetLocale,
        title: (translated.title as string) || null,
        subtitle: (translated.subtitle as string) || null,
        content: translated.content || null,
      },
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("翻译首页配置失败:", error);
    return NextResponse.json({ success: false, error: "翻译失败" }, { status: 500 });
  }
}
