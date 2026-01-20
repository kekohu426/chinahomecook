/**
 * 获取未补全食材图标的食谱列表
 *
 * GET /api/admin/ingredient-icons/missing-recipes
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";

type IconMeta = {
  iconAliases?: string[];
};

type IconRecord = {
  name: string;
  aliases: string[];
  iconUrl: string | null;
};

const normalizeAliases = (aliases?: unknown): string[] =>
  Array.isArray(aliases)
    ? aliases.map((alias) => String(alias).trim()).filter(Boolean)
    : [];

const extractIngredientNames = (ingredients: unknown): string[] => {
  if (!Array.isArray(ingredients)) return [];

  const names: string[] = [];
  for (const section of ingredients) {
    if (!section || typeof section !== "object") continue;
    const items = (section as { items?: unknown }).items;
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const name = (item as { name?: unknown }).name;
      if (typeof name !== "string") continue;
      const trimmed = name.trim();
      if (trimmed) names.push(trimmed);
    }
  }

  return names;
};

const findMatchingIcon = (
  ingredientName: string,
  icons: IconRecord[]
): IconRecord | undefined => {
  if (!ingredientName) return undefined;
  const normalizedName = ingredientName.trim().toLowerCase();

  const exactMatch = icons.find(
    (icon) => icon.name.toLowerCase() === normalizedName
  );
  if (exactMatch) return exactMatch;

  const aliasMatch = icons.find((icon) =>
    icon.aliases.some((alias) => alias.toLowerCase() === normalizedName)
  );
  if (aliasMatch) return aliasMatch;

  const fuzzyMatch = icons.find((icon) =>
    normalizedName.includes(icon.name.toLowerCase())
  );
  if (fuzzyMatch) return fuzzyMatch;

  const fuzzyAliasMatch = icons.find((icon) =>
    icon.aliases.some((alias) => normalizedName.includes(alias.toLowerCase()))
  );
  if (fuzzyAliasMatch) return fuzzyAliasMatch;

  return undefined;
};

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const ingredients = await prisma.ingredient.findMany({
      select: { name: true, iconUrl: true, transStatus: true },
    });

    const icons: IconRecord[] = ingredients.map((item) => {
      const meta = (item.transStatus as IconMeta) || {};
      return {
        name: item.name,
        aliases: normalizeAliases(meta.iconAliases),
        iconUrl: item.iconUrl,
      };
    });

    const recipes = await prisma.recipe.findMany({
      select: { id: true, title: true, ingredients: true },
    });

    const result = recipes
      .map((recipe) => {
        const ingredientNames = extractIngredientNames(recipe.ingredients);
        const uniqueNames = Array.from(new Set(ingredientNames));
        const missing = uniqueNames.filter((name) => {
          const matched = findMatchingIcon(name, icons);
          return !matched || !matched.iconUrl;
        });

        if (missing.length === 0) return null;

        return {
          id: recipe.id,
          title: recipe.title,
          missingIngredients: missing,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        count: result.length,
        recipes: result,
      },
    });
  } catch (error) {
    console.error("获取缺失图标食谱失败:", error);
    return NextResponse.json(
      { success: false, error: "获取缺失图标食谱失败" },
      { status: 500 }
    );
  }
}
