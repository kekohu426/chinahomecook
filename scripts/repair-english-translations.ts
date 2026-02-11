/**
 * Audit and repair English translations that contain CJK characters.
 *
 * Usage:
 *   npx tsx scripts/repair-english-translations.ts
 *   npx tsx scripts/repair-english-translations.ts --fix
 *   npx tsx scripts/repair-english-translations.ts --fix --include-stale --limit=50
 *   npx tsx scripts/repair-english-translations.ts --sanitize
 *   npx tsx scripts/repair-english-translations.ts --mark
 *
 * Flags:
 *   --fix           Re-translate recipes with CJK/dirty English using AI provider.
 *   --sanitize      Strip CJK characters from English translations without AI.
 *   --mark          Mark dirty translations as unreviewed (fallback to placeholder).
 *   --include-stale Also include translations older than recipe.updatedAt.
 *   --limit=NUM     Limit number of recipes to fix.
 *   --report=PATH   Write JSON report (default: reports/translation-cjk-report.json)
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/db/prisma";
import { getTextProvider } from "../lib/ai/provider";
import { getAppliedPrompt } from "../lib/ai/prompt-manager";
import { LOCALE_NAMES_EN } from "../lib/i18n/config";
import { ensureEnglish, titleFromSlug } from "../lib/i18n/english";
import { translateTagName, type TagType } from "../lib/i18n/tag-english";

const CJK_RE = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/;
const CJK_RE_GLOBAL = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/g;
const TARGET_LOCALE = "en";
const SOURCE_LOCALE = "zh";

const args = new Set(process.argv.slice(2));
const shouldFix = args.has("--fix");
const shouldMark = args.has("--mark");
const includeStale = args.has("--include-stale");
const shouldSanitize = args.has("--sanitize");
const limitArg = Array.from(args).find((arg) => arg.startsWith("--limit="));
const reportArg = Array.from(args).find((arg) => arg.startsWith("--report="));
const fixLimit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
const reportPath = reportArg
  ? reportArg.split("=")[1]
  : path.join("reports", "translation-cjk-report.json");

function hasCjk(value: unknown): boolean {
  if (!value) return false;
  if (typeof value === "string") return CJK_RE.test(value);
  try {
    return CJK_RE.test(JSON.stringify(value));
  } catch {
    return false;
  }
}

function sanitizeString(value: string, fallback = ""): string {
  const cleaned = value.replace(CJK_RE_GLOBAL, "").replace(/\s+/g, " ").trim();
  return cleaned || fallback;
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    Object.entries(value).forEach(([key, val]) => {
      result[key] = sanitizeValue(val);
    });
    return result;
  }
  return value;
}

function summarizeSample(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 160);
  try {
    return JSON.stringify(value).slice(0, 160);
  } catch {
    return String(value).slice(0, 160);
  }
}

function toSlug(title: string, fallback: string) {
  const base = (title || fallback || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || fallback.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function resolveTagType(value?: string | null): TagType | undefined {
  if (!value) return undefined;
  const lowered = value.toLowerCase();
  if (
    lowered === "scene" ||
    lowered === "method" ||
    lowered === "taste" ||
    lowered === "crowd" ||
    lowered === "occasion"
  ) {
    return lowered as TagType;
  }
  return undefined;
}

async function auditTranslations() {
  const report: Record<string, any> = {
    generatedAt: new Date().toISOString(),
    locale: TARGET_LOCALE,
    tables: {},
  };

  const tables: Array<{
    name: string;
    fields: string[];
    query: () => Promise<any[]>;
    sample: (row: any) => any;
  }> = [
    {
      name: "recipeTranslation",
      fields: ["title", "description", "summary", "story", "ingredients", "steps"],
      query: () =>
        prisma.recipeTranslation.findMany({
          where: { locale: TARGET_LOCALE },
          include: {
            recipe: {
              select: { id: true, slug: true, title: true, updatedAt: true },
            },
          },
        }),
      sample: (row) => ({
        id: row.id,
        recipeId: row.recipeId,
        recipeSlug: row.recipe?.slug,
        recipeTitle: row.recipe?.title,
        updatedAt: row.updatedAt,
        stale: row.recipe?.updatedAt
          ? new Date(row.recipe.updatedAt).getTime() >
            new Date(row.updatedAt).getTime()
          : false,
        title: row.title,
        summary: summarizeSample(row.summary),
      }),
    },
    {
      name: "cuisineTranslation",
      fields: ["name", "description"],
      query: () =>
        prisma.cuisineTranslation.findMany({
          where: { locale: TARGET_LOCALE },
        }),
      sample: (row) => ({ id: row.id, name: row.name, description: row.description }),
    },
    {
      name: "locationTranslation",
      fields: ["name", "description"],
      query: () =>
        prisma.locationTranslation.findMany({
          where: { locale: TARGET_LOCALE },
        }),
      sample: (row) => ({ id: row.id, name: row.name, description: row.description }),
    },
    {
      name: "tagTranslation",
      fields: ["name"],
      query: () =>
        prisma.tagTranslation.findMany({
          where: { locale: TARGET_LOCALE },
        }),
      sample: (row) => ({ id: row.id, name: row.name }),
    },
    {
      name: "collectionTranslation",
      fields: ["name", "description", "seo"],
      query: () =>
        prisma.collectionTranslation.findMany({
          where: { locale: TARGET_LOCALE },
        }),
      sample: (row) => ({ id: row.id, name: row.name }),
    },
    {
      name: "homeConfigTranslation",
      fields: ["title", "subtitle", "content"],
      query: () =>
        prisma.homeConfigTranslation.findMany({
          where: { locale: TARGET_LOCALE },
        }),
      sample: (row) => ({ id: row.id, title: row.title, subtitle: row.subtitle }),
    },
    {
      name: "homeBrowseItemTranslation",
      fields: ["name", "description"],
      query: () =>
        prisma.homeBrowseItemTranslation.findMany({
          where: { locale: TARGET_LOCALE },
        }),
      sample: (row) => ({ id: row.id, name: row.name, description: row.description }),
    },
    {
      name: "homeThemeCardTranslation",
      fields: ["title"],
      query: () =>
        prisma.homeThemeCardTranslation.findMany({
          where: { locale: TARGET_LOCALE },
        }),
      sample: (row) => ({ id: row.id, title: row.title }),
    },
    {
      name: "homeTestimonialTranslation",
      fields: ["name", "role", "city", "content", "meta"],
      query: () =>
        prisma.homeTestimonialTranslation.findMany({
          where: { locale: TARGET_LOCALE },
        }),
      sample: (row) => ({ id: row.id, name: row.name, content: summarizeSample(row.content) }),
    },
    {
      name: "aboutSectionTranslation",
      fields: ["title", "content"],
      query: () =>
        prisma.aboutSectionTranslation.findMany({
          where: { locale: TARGET_LOCALE },
        }),
      sample: (row) => ({ id: row.id, title: row.title, content: summarizeSample(row.content) }),
    },
    {
      name: "blogPostTranslation",
      fields: ["title", "excerpt", "content"],
      query: () =>
        prisma.blogPostTranslation.findMany({
          where: { locale: TARGET_LOCALE },
        }),
      sample: (row) => ({ id: row.id, title: row.title, excerpt: summarizeSample(row.excerpt) }),
    },
    {
      name: "ingredientTranslation",
      fields: ["name", "unit"],
      query: () =>
        prisma.ingredientTranslation.findMany({
          where: { locale: TARGET_LOCALE },
        }),
      sample: (row) => ({ id: row.id, name: row.name, unit: row.unit }),
    },
  ];

  for (const table of tables) {
    const rows = await table.query();
    const dirty = rows.filter((row) =>
      table.fields.some((field) => hasCjk((row as any)[field]))
    );
    report.tables[table.name] = {
      total: rows.length,
      dirty: dirty.length,
      samples: dirty.slice(0, 8).map(table.sample),
    };
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  return report;
}

async function fixRecipesWithCjk(report: any) {
  const dirtyRecipes = (report.tables?.recipeTranslation?.samples || []) as Array<{
    id: string;
    recipeId: string;
  }>;

  if (dirtyRecipes.length === 0) {
    console.log("No recipe translations with CJK found.");
    return;
  }

  const translations = await prisma.recipeTranslation.findMany({
    where: { locale: TARGET_LOCALE },
    include: {
      recipe: {
        select: { id: true, slug: true, title: true, summary: true, story: true, ingredients: true, steps: true },
      },
    },
  });

  const targets = translations.filter((row) => {
    const dirty = ["title", "description", "summary", "story", "ingredients", "steps"].some(
      (field) => hasCjk((row as any)[field])
    );
    const stale = includeStale && row.recipe?.updatedAt
      ? new Date(row.recipe.updatedAt).getTime() > new Date(row.updatedAt).getTime()
      : false;
    return dirty || stale;
  });

  const limitedTargets = fixLimit ? targets.slice(0, fixLimit) : targets;

  let provider: ReturnType<typeof getTextProvider> | null = null;
  const requestedMode = shouldFix ? "fix" : shouldSanitize ? "sanitize" : "mark";
  let activeMode = requestedMode;

  if (requestedMode === "fix") {
    try {
      provider = getTextProvider();
    } catch (error) {
      console.error("AI provider not configured:", (error as Error).message);
      if (shouldSanitize) {
        activeMode = "sanitize";
        console.log("Falling back to --sanitize.");
      } else if (shouldMark) {
        activeMode = "mark";
        console.log("Falling back to --mark.");
      } else {
        console.log("Run with --sanitize or --mark to repair without AI.");
        return;
      }
    }
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < limitedTargets.length; i++) {
    const row = limitedTargets[i];
    const recipe = row.recipe;
    if (!recipe) continue;

    const label = `${recipe.title} (${row.recipeId})`;
    process.stdout.write(`[${i + 1}/${limitedTargets.length}] ${label}... `);

    if (activeMode === "mark") {
      await prisma.recipeTranslation.update({
        where: { id: row.id },
        data: {
          isReviewed: false,
          reviewNote: "Contains CJK characters in English translation",
        },
      });
      console.log("marked");
      continue;
    }

    if (activeMode === "sanitize") {
      const fallbackTitle = titleFromSlug(recipe.slug || "", recipe.title);
      const title = sanitizeString(row.title || "", fallbackTitle);
      const slug = toSlug(title, row.slug || recipe.slug || recipe.title);
      const updated = {
        title,
        slug,
        description: row.description ? sanitizeString(row.description) : row.description,
        summary: row.summary ? sanitizeValue(row.summary) : row.summary,
        story: row.story ? sanitizeValue(row.story) : row.story,
        ingredients: row.ingredients ? sanitizeValue(row.ingredients) : row.ingredients,
        steps: row.steps ? sanitizeValue(row.steps) : row.steps,
        transMethod: row.transMethod || "sanitized",
        isReviewed: true,
        reviewedAt: new Date(),
        reviewNote: "Sanitized to remove CJK characters",
      };

      await prisma.recipeTranslation.update({
        where: { id: row.id },
        data: updated,
      });
      success++;
      console.log("sanitized");
      continue;
    }

    if (!provider) {
      console.log("skipped (no provider)");
      failed++;
      continue;
    }

    try {
      const sourceData = {
        title: recipe.title,
        summary: recipe.summary,
        story: recipe.story,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
      };
      const applied = await getAppliedPrompt("translate_recipe_full", {
        sourceLangName: LOCALE_NAMES_EN[SOURCE_LOCALE],
        targetLangName: LOCALE_NAMES_EN[TARGET_LOCALE],
        sourceData: JSON.stringify(sourceData, null, 2),
      });
      if (!applied?.prompt) {
        throw new Error("Missing translate_recipe_full prompt");
      }

      const response = await provider.chat({
        messages: [
          ...(applied.systemPrompt
            ? [{ role: "system" as const, content: applied.systemPrompt }]
            : []),
          { role: "user" as const, content: applied.prompt },
        ],
        temperature: 0.3,
        maxTokens: 6000,
      });

      const jsonMatch = (response.content || "").match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      const translated = JSON.parse(jsonMatch[0]);

      const updated = {
        title: translated.title || recipe.title,
        slug: toSlug(translated.title || recipe.title, recipe.title),
        summary: translated.summary || recipe.summary,
        story: translated.story || recipe.story,
        ingredients: translated.ingredients || recipe.ingredients,
        steps: translated.steps || recipe.steps,
        transMethod: "ai_regenerated",
        isReviewed: true,
        reviewedAt: new Date(),
        reviewNote: null,
      };

      const stillDirty = ["title", "summary", "story", "ingredients", "steps"].some(
        (field) => hasCjk((updated as any)[field])
      );

      await prisma.recipeTranslation.update({
        where: { id: row.id },
        data: stillDirty
          ? { ...updated, isReviewed: false, reviewNote: "CJK detected after regeneration" }
          : updated,
      });

      success++;
      console.log(stillDirty ? "retranslated (needs review)" : "retranslated");
    } catch (error) {
      failed++;
      console.log(`failed: ${(error as Error).message}`);
    }

    if (i < limitedTargets.length - 1) {
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  console.log(`\nDone. Success: ${success}, Failed: ${failed}`);
}

async function fixTagTranslations() {
  const rows = await prisma.tagTranslation.findMany({
    where: { locale: TARGET_LOCALE },
    include: { tag: true },
  });

  let updated = 0;
  for (const row of rows) {
    if (!hasCjk(row.name)) continue;
    const tagType = resolveTagType(row.tag?.type);
    const translated = translateTagName({
      name: row.name,
      originalName: row.tag?.name,
      slug: row.tag?.slug || row.slug,
      type: tagType,
      locale: TARGET_LOCALE,
    });
    const fallback = titleFromSlug(row.tag?.slug || row.slug || "tag", "Tag");
    const name = sanitizeString(translated, fallback);
    const slug = toSlug(name, row.tag?.slug || row.slug || "tag");

    await prisma.tagTranslation.update({
      where: { id: row.id },
      data: { name, slug },
    });
    updated += 1;
  }

  console.log(`Tag translations updated: ${updated}`);
}

async function fixCollectionTranslations() {
  const rows = await prisma.collectionTranslation.findMany({
    where: { locale: TARGET_LOCALE },
    include: { collection: true },
  });

  let updated = 0;
  for (const row of rows) {
    const dirty = hasCjk(row.name) || hasCjk(row.description) || hasCjk(row.seo);
    if (!dirty) continue;

    const collection = row.collection;
    const nameCandidate =
      collection?.nameEn ||
      row.name ||
      collection?.name ||
      titleFromSlug(collection?.slug || row.slug || "collection");
    const name = sanitizeString(
      nameCandidate,
      titleFromSlug(collection?.slug || row.slug || "collection")
    );
    const slug = toSlug(name, collection?.slug || row.slug || "collection");
    const description = row.description ? sanitizeString(row.description) : row.description;
    const seo = row.seo ? sanitizeValue(row.seo) : row.seo;

    await prisma.collectionTranslation.update({
      where: { id: row.id },
      data: {
        name,
        slug,
        description: description || null,
        seo,
        transMethod: row.transMethod || "sanitized",
        isReviewed: true,
      },
    });
    updated += 1;
  }

  console.log(`Collection translations updated: ${updated}`);
}

async function fixHomeThemeCardTranslations() {
  const rows = await prisma.homeThemeCardTranslation.findMany({
    where: { locale: TARGET_LOCALE },
    include: { card: true },
  });

  const collectionMap = new Map(
    (
      await prisma.collection.findMany({
        select: {
          slug: true,
          name: true,
          nameEn: true,
          translations: { where: { locale: TARGET_LOCALE }, select: { name: true } },
        },
      })
    ).map((item) => [item.slug, item])
  );

  let updated = 0;
  for (const row of rows) {
    if (!hasCjk(row.title)) continue;
    const card = row.card;
    const collection = card?.tag ? collectionMap.get(card.tag) : null;
    const translated =
      ensureEnglish(collection?.nameEn, "") ||
      ensureEnglish(collection?.translations?.[0]?.name, "") ||
      ensureEnglish(collection?.name, "") ||
      titleFromSlug(card?.tag || "", "Theme");
    const title = sanitizeString(translated, "Theme");

    await prisma.homeThemeCardTranslation.update({
      where: { id: row.id },
      data: { title },
    });
    updated += 1;
  }

  console.log(`Home theme card translations updated: ${updated}`);
}

async function main() {
  console.log("=== English Translation CJK Audit ===");
  const report = await auditTranslations();

  const recipeSummary = report.tables?.recipeTranslation || {};
  console.log(`Recipes: ${recipeSummary.dirty || 0} dirty / ${recipeSummary.total || 0} total`);
  Object.entries(report.tables || {}).forEach(([name, data]: any) => {
    if (name === "recipeTranslation") return;
    console.log(`${name}: ${data.dirty} dirty / ${data.total} total`);
  });

  if (shouldFix || shouldMark || shouldSanitize) {
    if (shouldFix || shouldSanitize) {
      console.log("\n=== Repairing Tag + Theme + Collection Translations ===");
      await fixTagTranslations();
      await fixHomeThemeCardTranslations();
      await fixCollectionTranslations();
    }

    console.log("\n=== Repairing Recipe Translations ===");
    await fixRecipesWithCjk(report);
  } else {
    console.log("\nRun with --fix to re-translate dirty recipes, --sanitize to strip CJK, or --mark to hide them.");
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
