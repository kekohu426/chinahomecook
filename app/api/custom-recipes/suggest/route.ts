/**
 * Custom recipe suggestions API
 *
 * POST /api/custom-recipes/suggest
 */

import { NextRequest, NextResponse } from "next/server";
import { getTextProvider } from "@/lib/ai/provider";
import { getAppliedPrompt } from "@/lib/ai/prompt-manager";
import { AIGenerationLogger, calculateCost } from "@/lib/ai/generation-logger";
import { ensureEnglish } from "@/lib/i18n/english";

type Suggestion = {
  name: string;
  reason: string;
};

function resolveLocale(
  bodyLocale: unknown,
  headerLocale: string | null
): "zh" | "en" {
  const normalizedBodyLocale =
    typeof bodyLocale === "string" ? bodyLocale.toLowerCase() : "";
  if (normalizedBodyLocale.startsWith("zh")) return "zh";
  if (normalizedBodyLocale.startsWith("en")) return "en";
  return (headerLocale || "").toLowerCase().includes("zh") ? "zh" : "en";
}

function normalizeSuggestions(raw: unknown[], locale: "zh" | "en"): Suggestion[] {
  return raw
    .map((item, index) => {
      if (typeof item === "string") {
        const value = item.trim();
        if (!value) return null;

        if (locale === "en") {
          return {
            name: ensureEnglish(value, `Recipe ${index + 1}`),
            reason: "Recommended for your needs.",
          };
        }

        return {
          name: value,
          reason: "",
        };
      }

      if (!item || typeof item !== "object") return null;

      const suggestion = item as { name?: unknown; reason?: unknown };
      const rawName = typeof suggestion.name === "string" ? suggestion.name.trim() : "";
      const rawReason = typeof suggestion.reason === "string" ? suggestion.reason.trim() : "";

      if (locale === "en") {
        return {
          name: ensureEnglish(rawName, `Recipe ${index + 1}`),
          reason: ensureEnglish(rawReason, "Recommended for your needs."),
        };
      }

      return {
        name: rawName || `食谱 ${index + 1}`,
        reason: rawReason,
      };
    })
    .filter((item): item is Suggestion => {
      return !!item && typeof item.name === "string" && item.name.trim().length > 0;
    });
}

export async function POST(request: NextRequest) {
  let locale: "zh" | "en" = "en";

  try {
    const body = await request.json();
    locale = resolveLocale(body?.locale, request.headers.get("accept-language"));

    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (prompt.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error:
            locale === "zh"
              ? "请输入您的需求（至少2个字符）"
              : "Please enter your request (at least 2 characters).",
        },
        { status: 400 }
      );
    }

    const provider = getTextProvider();
    const logger = new AIGenerationLogger();
    const startTime = Date.now();

    const applied = await getAppliedPrompt("custom_recipe_suggest", {
      userPrompt: prompt,
    });

    const response = await provider.chat({
      messages: [
        ...(applied?.systemPrompt
          ? [{ role: "system" as const, content: applied.systemPrompt }]
          : []),
        ...(locale === "en"
          ? [
              {
                role: "system" as const,
                content:
                  'Return valid JSON only. Use natural English for "suggestions[].name" and "suggestions[].reason".',
              },
            ]
          : []),
        {
          role: "user" as const,
          content: applied?.prompt || `User request: ${prompt}`,
        },
      ],
      temperature: 0.7,
      maxTokens: 1024,
    });

    const durationMs = Date.now() - startTime;
    const modelName = provider.getModel();
    const tokenUsage = response.usage
      ? {
          input: response.usage.promptTokens,
          output: response.usage.completionTokens,
          total: response.usage.totalTokens,
        }
      : undefined;

    logger.logSuccess("dish_recommendation", modelName, {
      prompt: (applied?.prompt || prompt).substring(0, 1000),
      parameters: { temperature: 0.7, maxTokens: 1024 },
      tokenUsage,
      cost: tokenUsage ? calculateCost(modelName, tokenUsage) : undefined,
      durationMs,
      provider: provider.getName(),
      metadata: { type: "custom_recipe_suggest", userPrompt: prompt.substring(0, 200) },
    });

    let suggestions: Suggestion[] = [];
    try {
      const content = response.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("missing_json");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed.suggestions)) {
        throw new Error("invalid_shape");
      }

      suggestions = normalizeSuggestions(parsed.suggestions, locale);
      if (suggestions.length === 0) {
        throw new Error("empty_suggestions");
      }
    } catch (parseError) {
      console.error("Failed to parse AI suggestion response:", parseError);
      return NextResponse.json(
        {
          success: false,
          error:
            locale === "zh"
              ? "AI 响应解析失败，请重试"
              : "Failed to parse AI response. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error("Failed to generate custom recipe suggestions:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          locale === "zh"
            ? "推荐食谱失败，请稍后重试"
            : "Failed to generate suggestions. Please try again later.",
      },
      { status: 500 }
    );
  }
}
