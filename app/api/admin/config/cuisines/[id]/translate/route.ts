/**
 * AI 翻译菜系
 *
 * POST /api/admin/config/cuisines/[id]/translate
 * body: { targetLocales: string[] }
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

function resolveLocales(values: string[] = []): Locale[] {
  return values
    .filter((v) => SUPPORTED_LOCALES.includes(v as Locale))
    .map((v) => v as Locale);
}

function parseJson(content: string) {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const targetLocales = resolveLocales(body.targetLocales || []);

    if (targetLocales.length === 0) {
      return NextResponse.json({ success: false, error: "缺少目标语言" }, { status: 400 });
    }

    const cuisine = await prisma.cuisine.findUnique({
      where: { id },
    });

    if (!cuisine) {
      return NextResponse.json({ success: false, error: "菜系不存在" }, { status: 404 });
    }

    const provider = await getTextProvider();
    const results: Record<string, { success: boolean; error?: string }> = {};

    for (const locale of targetLocales) {
      if (locale === DEFAULT_LOCALE) {
        results[locale] = { success: true };
        continue;
      }

      try {
        const langName = LOCALE_NAMES_EN[locale];
        const applied = await getAppliedPrompt("translate_cuisine", {
          targetLangName: langName,
          name: cuisine.name,
          description: cuisine.description || "",
        });
        if (!applied?.prompt) {
          throw new Error("未找到可用的提示词配置");
        }

        const response = await provider.chat({
          messages: [
            ...(applied.systemPrompt
              ? [{ role: "system" as const, content: applied.systemPrompt }]
              : []),
            { role: "user" as const, content: applied.prompt },
          ],
          temperature: 0.3,
          maxTokens: 400,
        });

        const translated = parseJson(response.content || "");
        if (!translated) {
          throw new Error("AI 返回内容解析失败");
        }

        await prisma.cuisineTranslation.upsert({
          where: { cuisineId_locale: { cuisineId: id, locale } },
          update: {
            name: translated.name || cuisine.name,
            description: translated.description || cuisine.description,
          },
          create: {
            cuisineId: id,
            locale,
            name: translated.name || cuisine.name,
            slug: translated.slug || translated.name || cuisine.name,
            description: translated.description || cuisine.description,
          },
        });

        results[locale] = { success: true };
      } catch (error) {
        console.error(`翻译菜系失败 ${locale}:`, error);
        results[locale] = { success: false, error: (error as Error).message };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("菜系翻译失败:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || "翻译失败" },
      { status: 500 }
    );
  }
}
