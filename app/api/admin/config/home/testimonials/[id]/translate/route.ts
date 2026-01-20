/**
 * HomeTestimonial 翻译 API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { getTextProvider } from "@/lib/ai/provider";
import { getAppliedPrompt } from "@/lib/ai/prompt-manager";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  LOCALE_NAMES_EN,
  type Locale,
} from "@/lib/i18n/config";

type RouteContext = { params: Promise<{ id: string }> };

const resolveLocale = (value?: string | null): Locale =>
  value && SUPPORTED_LOCALES.includes(value as Locale)
    ? (value as Locale)
    : DEFAULT_LOCALE;

function parseJson(content: string) {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  return JSON.parse(jsonMatch[0]);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const sourceLocale = resolveLocale(body.sourceLocale || DEFAULT_LOCALE);
    const targetLocale = resolveLocale(body.targetLocale);

    if (!targetLocale || targetLocale === sourceLocale) {
      return NextResponse.json({ success: false, error: "目标语言不合法" }, { status: 400 });
    }

    const item = await prisma.homeTestimonial.findUnique({
      where: { id },
      include: {
        translations: {
          where: { locale: sourceLocale === DEFAULT_LOCALE ? undefined : sourceLocale },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: "未找到用户证言" }, { status: 404 });
    }

    const sourceTranslation =
      sourceLocale === DEFAULT_LOCALE ? null : item.translations[0] || null;
    const sourceContent = {
      name: sourceTranslation?.name || item.name,
      role: sourceTranslation?.role || item.role,
      city: sourceTranslation?.city || item.city,
      content: sourceTranslation?.content || item.content,
      meta: sourceTranslation?.meta || item.meta,
    };

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
        ...(applied.systemPrompt ? [{ role: "system" as const, content: applied.systemPrompt }] : []),
        { role: "user" as const, content: applied.prompt },
      ],
      temperature: 0.2,
      maxTokens: 2000,
    });

    const translated = parseJson(response.content || "");
    if (!translated) {
      return NextResponse.json({ success: false, error: "AI 返回内容解析失败" }, { status: 500 });
    }

    const saved = await prisma.homeTestimonialTranslation.upsert({
      where: { testimonialId_locale: { testimonialId: id, locale: targetLocale } },
      update: {
        name: (translated.name as string) || null,
        role: (translated.role as string) || null,
        city: (translated.city as string) || null,
        content: (translated.content as string) || null,
        meta: (translated.meta as string) || null,
      },
      create: {
        testimonialId: id,
        locale: targetLocale,
        name: (translated.name as string) || null,
        role: (translated.role as string) || null,
        city: (translated.city as string) || null,
        content: (translated.content as string) || null,
        meta: (translated.meta as string) || null,
      },
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("翻译用户证言失败:", error);
    return NextResponse.json({ success: false, error: "翻译失败" }, { status: 500 });
  }
}
