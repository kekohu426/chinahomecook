/**
 * 食谱导入验证逻辑
 *
 * 复用现有 RecipeSchema 进行验证
 * 支持自动转换常见的格式差异
 */

import { z } from "zod";
import { RecipeSchema, type RecipeData } from "./recipe";

// heat 中文到英文的映射
const heatMap: Record<string, string> = {
  "小火": "low",
  "中小火": "medium-low",
  "中火": "medium",
  "中大火": "medium-high",
  "大火": "high",
  "余温": "low",
};

// iconKey 映射（将非标准值映射到标准值）
const iconKeyMap: Record<string, string> = {
  "duck": "meat",
  "duck_blood": "meat",
  "chicken": "meat",
  "pork": "meat",
  "beef": "meat",
  "lamb": "meat",
  "fish": "seafood",
  "shrimp": "seafood",
  "ginger": "spice",
  "garlic": "spice",
  "scallion": "veg",
  "onion": "veg",
  "dried_chili": "spice",
  "chili": "spice",
  "pepper": "spice",
  "salt": "spice",
  "sugar": "spice",
  "soy_sauce": "sauce",
  "cooking_wine": "sauce",
  "vinegar": "sauce",
  "sesame_oil": "oil",
  "vegetable_oil": "oil",
  "rice": "grain",
  "noodle": "grain",
  "tofu": "bean",
  "egg": "egg",
  "milk": "dairy",
};

/**
 * 预处理食谱数据，自动转换常见格式差异
 */
function preprocessRecipe(rawData: unknown): unknown {
  if (!rawData || typeof rawData !== "object") return rawData;

  let data = rawData as Record<string, unknown>;

  // 如果数据被包裹在 recipe 字段中，提取出来
  if (data.recipe && typeof data.recipe === "object") {
    const recipeData = data.recipe as Record<string, unknown>;
    // 保留顶层的 schemaVersion
    if (data.schemaVersion) {
      recipeData.schemaVersion = data.schemaVersion;
    }
    data = recipeData;
  }

  // 处理 steps 中的 heat 字段
  if (Array.isArray(data.steps)) {
    data.steps = data.steps.map((step: unknown) => {
      if (step && typeof step === "object") {
        const s = step as Record<string, unknown>;
        if (s.heat && typeof s.heat === "string") {
          if (s.heat === "无" || s.heat === "") {
            delete s.heat;
          } else {
            s.heat = heatMap[s.heat] || s.heat;
          }
        }
        return s;
      }
      return step;
    });
  }

  // 处理 ingredients 中的 iconKey 字段
  if (Array.isArray(data.ingredients)) {
    data.ingredients = data.ingredients.map((section: unknown) => {
      if (section && typeof section === "object") {
        const sec = section as Record<string, unknown>;
        if (Array.isArray(sec.items)) {
          sec.items = sec.items.map((item: unknown) => {
            if (item && typeof item === "object") {
              const i = item as Record<string, unknown>;
              if (i.iconKey && typeof i.iconKey === "string") {
                i.iconKey = iconKeyMap[i.iconKey] || i.iconKey;
                // 如果仍然不是有效值，设为 other
                const validIcons = ["meat", "veg", "fruit", "seafood", "grain", "bean", "dairy", "egg", "spice", "sauce", "oil", "tool", "other"];
                if (!validIcons.includes(i.iconKey as string)) {
                  i.iconKey = "other";
                }
              }
              return i;
            }
            return item;
          });
        }
        return sec;
      }
      return section;
    });
  }

  // 补全缺失的必填字段 (Schema 2.0.0 要求)
  // 视觉字段已移除，不再自动补全

  if (!data.tags) {
    // 尝试根据现有字段推断标签，或者给空值如果Schema允许(TagsSchema requires arrays)
    data.tags = {
      scenes: ["家常菜"],
      cookingMethods: ["炒"],
      tastes: ["咸鲜"],
      crowds: ["所有人"],
      occasions: ["正餐"]
    };
  } else {
    // 确保 tags 内部数组存在
    const tags = data.tags as Record<string, unknown>;
    if (!tags.scenes) tags.scenes = ["其他"];
    if (!tags.cookingMethods) tags.cookingMethods = ["其他"];
    if (!tags.tastes) tags.tastes = ["其他"];
    if (!tags.crowds) tags.crowds = ["所有人"];
    if (!tags.occasions) tags.occasions = ["日常"];
  }

  return data;
}

export interface ValidatedRecipe {
  isValid: boolean;
  data: RecipeData | null;
  errors?: string[];
  sourceFile: string;
  rawData: unknown;
}

/**
 * 格式化 Zod 验证错误为用户友好的消息
 */
export function formatZodErrors(error: z.ZodError): string[] {
  const fieldNameMap: Record<string, string> = {
    titleZh: "中文标题",
    titleEn: "英文标题",
    summary: "摘要信息",
    oneLine: "一句话简介",
    healingTone: "治愈文案",
    difficulty: "难度",
    timeTotalMin: "总时间",
    timeActiveMin: "操作时间",
    servings: "份量",
    ingredients: "食材",
    steps: "步骤",
    story: "文化故事",
    nutrition: "营养信息",
    equipment: "设备",
    faq: "常见问题",
    tips: "小贴士",
    troubleshooting: "失败排查",
    seo: "SEO信息",
    tags: "标签",
  };

  // 兼容 Zod 不同版本的错误结构
  // @ts-ignore - 兼容某些 Zod 版本只有 issues 属性
  const errors = error?.errors || error?.issues || [];

  if (!errors || !Array.isArray(errors) || errors.length === 0) {
    if (error?.message) return [error.message];
    return ["数据验证失败，无法获取详细错误信息"];
  }

  return errors.map((err: any) => {
    const path = err.path
      .map((p) => (typeof p === "string" ? fieldNameMap[p] || p : `[${p}]`))
      .join(" → ");

    return path ? `${path}: ${err.message}` : err.message;
  });
}

/**
 * 解析并验证食谱数据数组
 */
export function parseAndValidateRecipes(
  recipes: unknown[],
  sourceFile: string
): ValidatedRecipe[] {
  return recipes.map((recipe) => {
    // 预处理：自动转换格式差异
    const processed = preprocessRecipe(recipe);
    const result = RecipeSchema.safeParse(processed);

    if (result.success) {
      return {
        isValid: true,
        data: result.data,
        sourceFile,
        rawData: processed,
      };
    }

    return {
      isValid: false,
      data: null,
      errors: formatZodErrors(result.error),
      sourceFile,
      rawData: processed,
    };
  });
}

/**
 * 验证单个食谱
 */
export function validateSingleRecipe(recipe: unknown): {
  isValid: boolean;
  data?: RecipeData;
  errors?: string[];
} {
  const result = RecipeSchema.safeParse(recipe);

  if (result.success) {
    return { isValid: true, data: result.data };
  }

  return {
    isValid: false,
    errors: formatZodErrors(result.error),
  };
}

/**
 * 从原始数据中提取显示信息（用于预览）
 */
export function extractDisplayInfo(rawData: unknown): {
  title: string;
  description: string;
  difficulty: string;
  time: string;
} {
  const data = rawData as Record<string, unknown>;
  const summary = data?.summary as Record<string, unknown> | undefined;

  return {
    title: (data?.titleZh as string) || (data?.title as string) || "未知标题",
    description: (summary?.oneLine as string) || (data?.description as string) || "",
    difficulty: (summary?.difficulty as string) || (data?.difficulty as string) || "",
    time: summary?.timeTotalMin ? `${summary.timeTotalMin}分钟` : "",
  };
}
