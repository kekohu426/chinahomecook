/**
 * 食材图标匹配工具
 *
 * 提供食材名称到图标的映射功能
 */

export interface IngredientIcon {
  id: string;
  name: string;
  aliases: string[];
  iconUrl: string | null;
  sortOrder: number;
}

/**
 * 匹配食材图标
 *
 * 匹配优先级：
 * 1. 精确匹配食材名称
 * 2. 精确匹配别名
 * 3. 模糊匹配（包含关系）
 *
 * @param ingredientName 食材名称
 * @param icons 图标库数组
 * @returns 匹配到的图标 URL，如果没有匹配则返回 null
 */
export function matchIngredientIcon(
  ingredientName: string,
  icons: IngredientIcon[]
): string | null {
  if (!ingredientName || icons.length === 0) {
    return null;
  }

  const normalizedName = ingredientName.trim().toLowerCase();

  // 1. 精确匹配食材名称
  const exactMatch = icons.find(
    (icon) => icon.name.toLowerCase() === normalizedName
  );
  if (exactMatch) {
    // 如果图标 URL 为空，返回 null（待补充图标）
    return exactMatch.iconUrl || null;
  }

  // 2. 精确匹配别名
  const aliasMatch = icons.find((icon) =>
    icon.aliases.some((alias) => alias.toLowerCase() === normalizedName)
  );
  if (aliasMatch) {
    return aliasMatch.iconUrl || null;
  }

  // 3. 模糊匹配（食材名称包含图标名称）
  const fuzzyMatch = icons.find((icon) =>
    normalizedName.includes(icon.name.toLowerCase())
  );
  if (fuzzyMatch) {
    return fuzzyMatch.iconUrl || null;
  }

  // 4. 模糊匹配（食材名称包含别名）
  const fuzzyAliasMatch = icons.find((icon) =>
    icon.aliases.some((alias) => normalizedName.includes(alias.toLowerCase()))
  );
  if (fuzzyAliasMatch) {
    return fuzzyAliasMatch.iconUrl || null;
  }

  return null;
}

/**
 * 批量匹配食材图标
 *
 * @param ingredientNames 食材名称数组
 * @param icons 图标库数组
 * @returns 食材名称到图标 URL 的映射对象
 */
export function batchMatchIngredientIcons(
  ingredientNames: string[],
  icons: IngredientIcon[]
): Record<string, string | null> {
  const result: Record<string, string | null> = {};

  ingredientNames.forEach((name) => {
    result[name] = matchIngredientIcon(name, icons);
  });

  return result;
}

/**
 * 获取食材图标的统计信息
 *
 * @param ingredientNames 食材名称数组
 * @param icons 图标库数组
 * @returns 统计信息对象
 */
export function getIngredientIconStats(
  ingredientNames: string[],
  icons: IngredientIcon[]
): {
  total: number;
  matched: number;
  unmatched: number;
  matchRate: number;
} {
  const matches = batchMatchIngredientIcons(ingredientNames, icons);
  const matched = Object.values(matches).filter((url) => url !== null).length;
  const total = ingredientNames.length;

  return {
    total,
    matched,
    unmatched: total - matched,
    matchRate: total > 0 ? matched / total : 0,
  };
}
