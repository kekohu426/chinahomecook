import { prisma } from "@/lib/db/prisma";
import { type IngredientIcon } from "@/lib/ingredient-icons";

type IconMeta = {
  iconAliases?: string[];
  iconSortOrder?: number;
};

const normalizeAliases = (aliases?: unknown): string[] =>
  Array.isArray(aliases)
    ? aliases.map((alias) => String(alias).trim()).filter(Boolean)
    : [];

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "") || "icon";

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

/**
 * 检查食材名称是否匹配到任何已存在的记录（通过名称或别名）
 * 与 matchIngredientIcon 不同，这个函数只检查是否匹配，不关心是否有图标
 */
function hasMatchingRecord(
  ingredientName: string,
  icons: IngredientIcon[]
): boolean {
  if (!ingredientName || icons.length === 0) {
    return false;
  }

  const normalizedName = ingredientName.trim().toLowerCase();

  // 1. 精确匹配食材名称
  const exactMatch = icons.find(
    (icon) => icon.name.toLowerCase() === normalizedName
  );
  if (exactMatch) {
    return true;
  }

  // 2. 精确匹配别名
  const aliasMatch = icons.find((icon) =>
    icon.aliases.some((alias) => alias.toLowerCase() === normalizedName)
  );
  if (aliasMatch) {
    return true;
  }

  // 3. 模糊匹配（食材名称包含图标名称）
  const fuzzyMatch = icons.find((icon) =>
    normalizedName.includes(icon.name.toLowerCase())
  );
  if (fuzzyMatch) {
    return true;
  }

  // 4. 模糊匹配（食材名称包含别名）
  const fuzzyAliasMatch = icons.find((icon) =>
    icon.aliases.some((alias) => normalizedName.includes(alias.toLowerCase()))
  );
  if (fuzzyAliasMatch) {
    return true;
  }

  return false;
}

export async function ensureIngredientIconRecords(ingredients: unknown) {
  const ingredientNames = extractIngredientNames(ingredients);
  if (ingredientNames.length === 0) return;

  const uniqueNames = Array.from(new Set(ingredientNames));

  // 获取所有已存在的食材记录（用于匹配检查）
  const allIngredients = await prisma.ingredient.findMany({
    select: { id: true, name: true, iconUrl: true, transStatus: true },
  });

  const icons: IngredientIcon[] = allIngredients.map((item) => {
    const meta = (item.transStatus as IconMeta) || {};
    return {
      id: item.id,
      name: item.name,
      aliases: normalizeAliases(meta.iconAliases),
      iconUrl: item.iconUrl,
      sortOrder: meta.iconSortOrder ?? 0,
    };
  });

  // 筛选出没有匹配到任何记录的食材名称
  const missingNames = uniqueNames.filter((name) => {
    // 检查是否匹配到任何已存在的记录（通过名称或别名）
    return !hasMatchingRecord(name, icons);
  });

  if (missingNames.length === 0) return;

  await prisma.ingredient.createMany({
    data: missingNames.map((name) => ({
      name,
      iconKey: slugify(name),
      iconUrl: null,
      transStatus: {
        iconSource: "auto",
        iconActive: true,
      },
    })),
    skipDuplicates: true,
  });
}
