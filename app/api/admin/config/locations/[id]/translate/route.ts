/**
 * AI 翻译地点
 *
 * POST /api/admin/config/locations/[id]/translate
 * body: { targetLocales: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { getTextProvider } from "@/lib/ai/provider";
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

    const location = await prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      return NextResponse.json({ success: false, error: "地点不存在" }, { status: 404 });
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
        const prompt = `Translate the following location information into ${langName}. Keep the JSON structure:
{
  "name": "${location.name}",
  "description": "${location.description || ""}"
}
Return only valid JSON with the same keys.`;

        const response = await provider.chat({
          messages: [
            { role: "system", content: "You are a translator. Return only valid JSON, no explanations." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          maxTokens: 400,
        });

        const translated = parseJson(response.content || "");
        if (!translated) {
          throw new Error("AI 返回内容解析失败");
        }

        await prisma.locationTranslation.upsert({
          where: { locationId_locale: { locationId: id, locale } },
          update: {
            name: translated.name || location.name,
            description: translated.description || location.description,
          },
          create: {
            locationId: id,
            locale,
            name: translated.name || location.name,
            slug: translated.slug || translated.name || location.name,
            description: translated.description || location.description,
          },
        });

        results[locale] = { success: true };
      } catch (error) {
        console.error(`翻译地点失败 ${locale}:`, error);
        results[locale] = { success: false, error: (error as Error).message };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("地点翻译失败:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || "翻译失败" },
      { status: 500 }
    );
  }
}
