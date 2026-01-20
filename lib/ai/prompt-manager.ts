/**
 * AI 提示词管理器
 *
 * 统一管理所有 AI 提示词的获取和应用
 * 优先从数据库读取，如果不存在则使用默认值
 */

import { prisma } from "@/lib/db/prisma";
import { DEFAULT_PROMPTS, getDefaultPrompt, type PromptDefinition } from "./default-prompts";

type LegacyPromptOverride = {
  prompt?: string;
  systemPrompt?: string | null;
};

async function getLegacyPromptOverrides(): Promise<Record<string, LegacyPromptOverride>> {
  try {
    const config = await prisma.aIConfig.findUnique({
      where: { id: "default" },
      select: {
        recipePrompt: true,
        recipeSystemPrompt: true,
        seoPrompt: true,
        transPrompt: true,
      },
    });

    if (!config) {
      return {};
    }

    const overrides: Record<string, LegacyPromptOverride> = {};

    if (config.recipePrompt?.trim() || config.recipeSystemPrompt?.trim()) {
      overrides.recipe_generate = {
        prompt: config.recipePrompt?.trim() || undefined,
        systemPrompt: config.recipeSystemPrompt?.trim() || undefined,
      };
    }

    if (config.seoPrompt?.trim()) {
      overrides.seo_generate = {
        prompt: config.seoPrompt.trim(),
      };
    }

    if (config.transPrompt?.trim()) {
      overrides.translate_recipe = {
        prompt: config.transPrompt.trim(),
      };
    }

    return overrides;
  } catch (error) {
    console.error("读取旧版提示词失败:", error);
    return {};
  }
}

/**
 * 提示词配置（从数据库或默认值）
 */
export interface PromptConfig {
  key: string;
  name: string;
  description: string | null;
  category: string;
  prompt: string;
  systemPrompt: string | null;
  variables: string[];
  isCustomized: boolean; // 是否已自定义
}

/**
 * 获取单个提示词配置
 * 优先从数据库读取，不存在则返回默认值
 */
export async function getPromptConfig(key: string): Promise<PromptConfig | null> {
  // 先获取默认配置
  const defaultPrompt = getDefaultPrompt(key);
  if (!defaultPrompt) {
    return null;
  }

  try {
    // 尝试从数据库读取
    const dbPrompt = await prisma.aIPrompt.findUnique({
      where: { key },
    });

    if (dbPrompt && dbPrompt.isActive) {
      return {
        key: dbPrompt.key,
        name: dbPrompt.name,
        description: dbPrompt.description,
        category: dbPrompt.category,
        prompt: dbPrompt.prompt,
        systemPrompt: dbPrompt.systemPrompt,
        variables: dbPrompt.variables ? JSON.parse(dbPrompt.variables) : defaultPrompt.variables,
        isCustomized: true,
      };
    }
  } catch (error) {
    console.error(`获取提示词配置失败 [${key}]:`, error);
  }

  const legacyOverrides = await getLegacyPromptOverrides();
  const legacyOverride = legacyOverrides[key];
  if (legacyOverride?.prompt || legacyOverride?.systemPrompt) {
    return {
      key: defaultPrompt.key,
      name: defaultPrompt.name,
      description: defaultPrompt.description,
      category: defaultPrompt.category,
      prompt: legacyOverride.prompt || defaultPrompt.prompt,
      systemPrompt: legacyOverride.systemPrompt ?? (defaultPrompt.systemPrompt || null),
      variables: defaultPrompt.variables,
      isCustomized: true,
    };
  }

  // 返回默认配置
  return {
    key: defaultPrompt.key,
    name: defaultPrompt.name,
    description: defaultPrompt.description,
    category: defaultPrompt.category,
    prompt: defaultPrompt.prompt,
    systemPrompt: defaultPrompt.systemPrompt || null,
    variables: defaultPrompt.variables,
    isCustomized: false,
  };
}

/**
 * 获取所有提示词配置
 */
export async function getAllPromptConfigs(): Promise<PromptConfig[]> {
  const configs: PromptConfig[] = [];

  // 获取数据库中的自定义配置
  let dbPrompts: Map<string, any> = new Map();
  try {
    const prompts = await prisma.aIPrompt.findMany({
      where: { isActive: true },
    });
    dbPrompts = new Map(prompts.map((p) => [p.key, p]));
  } catch (error) {
    console.error("获取数据库提示词失败:", error);
  }

  const legacyOverrides = await getLegacyPromptOverrides();

  // 合并默认配置和数据库配置
  for (const defaultPrompt of DEFAULT_PROMPTS) {
    const dbPrompt = dbPrompts.get(defaultPrompt.key);
    const legacyOverride = legacyOverrides[defaultPrompt.key];

    if (dbPrompt) {
      configs.push({
        key: dbPrompt.key,
        name: dbPrompt.name,
        description: dbPrompt.description,
        category: dbPrompt.category,
        prompt: dbPrompt.prompt,
        systemPrompt: dbPrompt.systemPrompt,
        variables: dbPrompt.variables ? JSON.parse(dbPrompt.variables) : defaultPrompt.variables,
        isCustomized: true,
      });
    } else if (legacyOverride?.prompt || legacyOverride?.systemPrompt) {
      configs.push({
        key: defaultPrompt.key,
        name: defaultPrompt.name,
        description: defaultPrompt.description,
        category: defaultPrompt.category,
        prompt: legacyOverride.prompt || defaultPrompt.prompt,
        systemPrompt: legacyOverride.systemPrompt ?? (defaultPrompt.systemPrompt || null),
        variables: defaultPrompt.variables,
        isCustomized: true,
      });
    } else {
      configs.push({
        key: defaultPrompt.key,
        name: defaultPrompt.name,
        description: defaultPrompt.description,
        category: defaultPrompt.category,
        prompt: defaultPrompt.prompt,
        systemPrompt: defaultPrompt.systemPrompt || null,
        variables: defaultPrompt.variables,
        isCustomized: false,
      });
    }
  }

  return configs;
}

/**
 * 保存提示词配置
 */
export async function savePromptConfig(
  key: string,
  data: {
    prompt: string;
    systemPrompt?: string | null;
  }
): Promise<PromptConfig | null> {
  const defaultPrompt = getDefaultPrompt(key);
  if (!defaultPrompt) {
    throw new Error(`未知的提示词 key: ${key}`);
  }

  const dbPrompt = await prisma.aIPrompt.upsert({
    where: { key },
    update: {
      prompt: data.prompt,
      systemPrompt: data.systemPrompt,
      updatedAt: new Date(),
    },
    create: {
      key,
      name: defaultPrompt.name,
      description: defaultPrompt.description,
      category: defaultPrompt.category,
      prompt: data.prompt,
      systemPrompt: data.systemPrompt,
      variables: JSON.stringify(defaultPrompt.variables),
      isActive: true,
    },
  });

  return {
    key: dbPrompt.key,
    name: dbPrompt.name,
    description: dbPrompt.description,
    category: dbPrompt.category,
    prompt: dbPrompt.prompt,
    systemPrompt: dbPrompt.systemPrompt,
    variables: dbPrompt.variables ? JSON.parse(dbPrompt.variables) : defaultPrompt.variables,
    isCustomized: true,
  };
}

/**
 * 重置提示词为默认值
 */
export async function resetPromptConfig(key: string): Promise<PromptConfig | null> {
  const defaultPrompt = getDefaultPrompt(key);
  if (!defaultPrompt) {
    throw new Error(`未知的提示词 key: ${key}`);
  }

  // 删除数据库中的自定义配置
  try {
    await prisma.aIPrompt.delete({
      where: { key },
    });
  } catch (error) {
    // 如果不存在则忽略
  }

  return {
    key: defaultPrompt.key,
    name: defaultPrompt.name,
    description: defaultPrompt.description,
    category: defaultPrompt.category,
    prompt: defaultPrompt.prompt,
    systemPrompt: defaultPrompt.systemPrompt || null,
    variables: defaultPrompt.variables,
    isCustomized: false,
  };
}

/**
 * 应用变量到提示词模板
 */
export function applyVariables(
  template: string,
  variables: Record<string, string | undefined>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value || "");
  }
  return result;
}

/**
 * 获取并应用提示词
 * 便捷方法：获取提示词配置并应用变量
 */
export async function getAppliedPrompt(
  key: string,
  variables: Record<string, string | undefined>
): Promise<{ prompt: string; systemPrompt: string | null } | null> {
  const config = await getPromptConfig(key);
  if (!config) {
    return null;
  }

  return {
    prompt: applyVariables(config.prompt, variables),
    systemPrompt: config.systemPrompt ? applyVariables(config.systemPrompt, variables) : null,
  };
}
