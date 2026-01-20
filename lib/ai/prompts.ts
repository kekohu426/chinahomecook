/**
 * AI 提示词导出
 *
 * 此文件保持向后兼容，实际提示词定义在 default-prompts.ts 中
 * 业务代码应该使用 prompt-manager.ts 来获取提示词
 */

import { getDefaultPrompt } from "./default-prompts";

// 获取菜谱生成提示词
const recipePrompt = getDefaultPrompt("recipe_generate");
export const DEFAULT_RECIPE_PROMPT = recipePrompt?.prompt || "";

// 获取 SEO 生成提示词
const seoPrompt = getDefaultPrompt("seo_generate");
export const DEFAULT_SEO_PROMPT = seoPrompt?.prompt || "";

// 获取合集描述生成提示词
const collectionDescPrompt = getDefaultPrompt("collection_description");
export const DEFAULT_COLLECTION_DESCRIPTION_PROMPT = collectionDescPrompt?.prompt || "";

// 获取定制菜谱推荐提示词
const customRecipeSuggestPrompt = getDefaultPrompt("custom_recipe_suggest");
export const DEFAULT_CUSTOM_RECIPE_SUGGEST_PROMPT = customRecipeSuggestPrompt?.prompt || "";
export const DEFAULT_CUSTOM_RECIPE_SUGGEST_SYSTEM_PROMPT = customRecipeSuggestPrompt?.systemPrompt || "";

// 获取菜名推荐提示词
const dishRecommendPrompt = getDefaultPrompt("dish_recommend");
export const DEFAULT_DISH_RECOMMEND_PROMPT = dishRecommendPrompt?.prompt || "";

// 导出所有默认提示词定义
export {
  DEFAULT_PROMPTS,
  getDefaultPrompt,
  getDefaultPromptsByCategory,
  CATEGORY_LABELS,
  type PromptDefinition,
} from "./default-prompts";
