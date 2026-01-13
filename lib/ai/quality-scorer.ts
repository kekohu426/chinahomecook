/**
 * 质量评分系统
 *
 * 为菜谱和翻译提供自动质量评分功能
 *
 * 评分维度：
 * - 菜谱质量：内容完整性、步骤清晰度、食材合理性、文化内涵、图片质量
 * - 翻译质量：语义准确性、流畅度、术语一致性、格式完整性
 */

import { prisma } from "@/lib/db/prisma";

// 菜谱质量评分维度
export interface RecipeQualityScore {
  // 各维度分数 (0-1)
  completeness: number; // 内容完整性
  stepClarity: number; // 步骤清晰度
  ingredientAccuracy: number; // 食材合理性
  culturalRichness: number; // 文化内涵
  imageQuality: number; // 图片质量

  // 加权总分
  overall: number;

  // 详细说明
  details?: {
    missingFields?: string[];
    issues?: string[];
    suggestions?: string[];
  };
}

// 翻译质量评分维度
export interface TranslationQualityScore {
  semanticAccuracy: number; // 语义准确性
  fluency: number; // 流畅度
  termConsistency: number; // 术语一致性
  formatIntegrity: number; // 格式完整性

  overall: number;

  details?: {
    issues?: string[];
  };
}

// 评分权重配置
const RECIPE_WEIGHTS = {
  completeness: 0.25,
  stepClarity: 0.25,
  ingredientAccuracy: 0.2,
  culturalRichness: 0.15,
  imageQuality: 0.15,
};

const TRANSLATION_WEIGHTS = {
  semanticAccuracy: 0.35,
  fluency: 0.25,
  termConsistency: 0.2,
  formatIntegrity: 0.2,
};

/**
 * 评估菜谱内容完整性
 */
function evaluateCompleteness(recipe: {
  title?: string | null;
  description?: string | null;
  summary?: unknown;
  story?: unknown;
  ingredients?: unknown;
  steps?: unknown;
  coverImage?: string | null;
}): { score: number; missingFields: string[] } {
  const missingFields: string[] = [];
  let score = 1.0;

  // 必填字段检查
  if (!recipe.title) {
    missingFields.push("title");
    score -= 0.2;
  }
  if (!recipe.description) {
    missingFields.push("description");
    score -= 0.1;
  }

  // 摘要检查
  const summary = recipe.summary as Record<string, unknown> | null;
  if (!summary || !summary.oneLine) {
    missingFields.push("summary.oneLine");
    score -= 0.1;
  }

  // 故事检查
  const story = recipe.story as Record<string, unknown> | null;
  if (!story || !story.content) {
    missingFields.push("story.content");
    score -= 0.1;
  }

  // 食材检查
  const ingredients = recipe.ingredients as unknown[] | null;
  if (!ingredients || ingredients.length === 0) {
    missingFields.push("ingredients");
    score -= 0.2;
  }

  // 步骤检查
  const steps = recipe.steps as unknown[] | null;
  if (!steps || steps.length === 0) {
    missingFields.push("steps");
    score -= 0.2;
  }

  // 封面图检查
  if (!recipe.coverImage) {
    missingFields.push("coverImage");
    score -= 0.1;
  }

  return { score: Math.max(0, score), missingFields };
}

/**
 * 评估步骤清晰度
 */
function evaluateStepClarity(steps: unknown): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 1.0;

  if (!Array.isArray(steps) || steps.length === 0) {
    return { score: 0, issues: ["无步骤内容"] };
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i] as Record<string, unknown>;
    const stepNum = i + 1;

    // 检查必填字段
    if (!step.title) {
      issues.push(`步骤${stepNum}缺少标题`);
      score -= 0.1;
    }
    if (!step.action) {
      issues.push(`步骤${stepNum}缺少操作说明`);
      score -= 0.15;
    }

    // 检查操作说明长度
    const action = String(step.action || "");
    if (action.length < 10) {
      issues.push(`步骤${stepNum}操作说明过短`);
      score -= 0.05;
    }

    // 检查是否有视觉提示
    if (!step.visualCue) {
      score -= 0.02;
    }
  }

  // 步骤数量合理性
  if (steps.length < 3) {
    issues.push("步骤过少，可能不完整");
    score -= 0.1;
  } else if (steps.length > 20) {
    issues.push("步骤过多，考虑合并");
    score -= 0.05;
  }

  return { score: Math.max(0, score), issues };
}

/**
 * 评估食材合理性
 */
function evaluateIngredientAccuracy(ingredients: unknown): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 1.0;

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return { score: 0, issues: ["无食材信息"] };
  }

  let totalItems = 0;
  let itemsWithAmount = 0;
  let itemsWithUnit = 0;

  for (const section of ingredients) {
    const sec = section as Record<string, unknown>;
    const items = sec.items as unknown[];

    if (!Array.isArray(items)) continue;

    for (const item of items) {
      const ing = item as Record<string, unknown>;
      totalItems++;

      if (!ing.name) {
        issues.push("存在无名称的食材");
        score -= 0.1;
      }

      if (ing.amount !== undefined && ing.amount !== null) {
        itemsWithAmount++;
      }
      if (ing.unit) {
        itemsWithUnit++;
      }
    }
  }

  // 检查用量完整度
  if (totalItems > 0) {
    const amountRatio = itemsWithAmount / totalItems;
    if (amountRatio < 0.5) {
      issues.push("超过一半食材缺少用量");
      score -= 0.2;
    } else if (amountRatio < 0.8) {
      issues.push("部分食材缺少用量");
      score -= 0.1;
    }
  }

  return { score: Math.max(0, score), issues };
}

/**
 * 评估文化内涵
 */
function evaluateCulturalRichness(recipe: {
  story?: unknown;
  summary?: unknown;
}): { score: number; suggestions: string[] } {
  const suggestions: string[] = [];
  let score = 0.5; // 基础分

  const story = recipe.story as Record<string, unknown> | null;
  const summary = recipe.summary as Record<string, unknown> | null;

  // 故事内容丰富度
  if (story) {
    const content = String(story.content || "");
    if (content.length > 200) {
      score += 0.25;
    } else if (content.length > 50) {
      score += 0.1;
    } else {
      suggestions.push("故事内容较短，可添加更多文化背景");
    }

    // 故事标签
    const tags = story.tags as string[] | undefined;
    if (tags && tags.length > 0) {
      score += 0.1;
    }
  } else {
    suggestions.push("缺少文化故事");
  }

  // 治愈系文案
  if (summary?.healingTone) {
    score += 0.15;
  } else {
    suggestions.push("可添加治愈系文案增强情感共鸣");
  }

  return { score: Math.min(1, score), suggestions };
}

/**
 * 评估图片质量（基于是否存在）
 */
function evaluateImageQuality(recipe: {
  coverImage?: string | null;
  steps?: unknown;
}): number {
  let score = 0;

  // 封面图
  if (recipe.coverImage) {
    score += 0.5;
  }

  // 步骤图
  const steps = recipe.steps as Array<Record<string, unknown>> | null;
  if (steps && steps.length > 0) {
    let stepsWithImage = 0;
    for (const step of steps) {
      if (step.imageUrl) {
        stepsWithImage++;
      }
    }
    const imageRatio = stepsWithImage / steps.length;
    score += imageRatio * 0.5;
  }

  return score;
}

/**
 * 计算菜谱质量评分
 */
export async function calculateRecipeQualityScore(
  recipeId: string
): Promise<RecipeQualityScore | null> {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });

  if (!recipe) {
    return null;
  }

  // 各维度评估
  const completenessResult = evaluateCompleteness(recipe);
  const stepClarityResult = evaluateStepClarity(recipe.steps);
  const ingredientResult = evaluateIngredientAccuracy(recipe.ingredients);
  const culturalResult = evaluateCulturalRichness(recipe);
  const imageScore = evaluateImageQuality(recipe);

  // 计算加权总分
  const overall =
    completenessResult.score * RECIPE_WEIGHTS.completeness +
    stepClarityResult.score * RECIPE_WEIGHTS.stepClarity +
    ingredientResult.score * RECIPE_WEIGHTS.ingredientAccuracy +
    culturalResult.score * RECIPE_WEIGHTS.culturalRichness +
    imageScore * RECIPE_WEIGHTS.imageQuality;

  const qualityScore: RecipeQualityScore = {
    completeness: completenessResult.score,
    stepClarity: stepClarityResult.score,
    ingredientAccuracy: ingredientResult.score,
    culturalRichness: culturalResult.score,
    imageQuality: imageScore,
    overall: Math.round(overall * 100) / 100,
    details: {
      missingFields: completenessResult.missingFields,
      issues: [...stepClarityResult.issues, ...ingredientResult.issues],
      suggestions: culturalResult.suggestions,
    },
  };

  // 保存到数据库
  await prisma.recipe.update({
    where: { id: recipeId },
    data: {
      qualityScore: qualityScore as object,
    },
  });

  return qualityScore;
}

/**
 * 评估翻译质量
 */
export function evaluateTranslationQuality(
  source: Record<string, unknown>,
  translated: Record<string, unknown>
): TranslationQualityScore {
  let semanticAccuracy = 1.0;
  let fluency = 0.85; // 默认假设 AI 翻译流畅度较好
  let termConsistency = 1.0;
  let formatIntegrity = 1.0;
  const issues: string[] = [];

  // 格式完整性检查
  const sourceKeys = Object.keys(source);
  const translatedKeys = Object.keys(translated);

  for (const key of sourceKeys) {
    if (!translatedKeys.includes(key)) {
      issues.push(`缺少字段: ${key}`);
      formatIntegrity -= 0.1;
    }
  }

  // 检查数组长度一致性
  if (Array.isArray(source.steps) && Array.isArray(translated.steps)) {
    if (source.steps.length !== translated.steps.length) {
      issues.push("步骤数量不一致");
      formatIntegrity -= 0.2;
      semanticAccuracy -= 0.1;
    }
  }

  if (Array.isArray(source.ingredients) && Array.isArray(translated.ingredients)) {
    // 检查食材部分数量
    const sourceIngLen = source.ingredients.length;
    const transIngLen = translated.ingredients.length;
    if (sourceIngLen !== transIngLen) {
      issues.push("食材分组数量不一致");
      formatIntegrity -= 0.1;
    }
  }

  // 计算总分
  const overall =
    semanticAccuracy * TRANSLATION_WEIGHTS.semanticAccuracy +
    fluency * TRANSLATION_WEIGHTS.fluency +
    termConsistency * TRANSLATION_WEIGHTS.termConsistency +
    Math.max(0, formatIntegrity) * TRANSLATION_WEIGHTS.formatIntegrity;

  return {
    semanticAccuracy,
    fluency,
    termConsistency,
    formatIntegrity: Math.max(0, formatIntegrity),
    overall: Math.round(overall * 100) / 100,
    details: { issues },
  };
}

/**
 * 批量计算菜谱质量评分
 */
export async function batchCalculateRecipeQualityScores(
  recipeIds: string[]
): Promise<Map<string, RecipeQualityScore | null>> {
  const results = new Map<string, RecipeQualityScore | null>();

  for (const id of recipeIds) {
    const score = await calculateRecipeQualityScore(id);
    results.set(id, score);
  }

  return results;
}

/**
 * 获取质量等级标签
 */
export function getQualityLevel(score: number): "excellent" | "good" | "fair" | "poor" {
  if (score >= 0.85) return "excellent";
  if (score >= 0.7) return "good";
  if (score >= 0.5) return "fair";
  return "poor";
}

/**
 * 获取质量等级中文标签
 */
export function getQualityLevelZh(score: number): string {
  const level = getQualityLevel(score);
  const labels = {
    excellent: "优秀",
    good: "良好",
    fair: "一般",
    poor: "较差",
  };
  return labels[level];
}
