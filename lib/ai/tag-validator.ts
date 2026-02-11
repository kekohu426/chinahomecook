/**
 * 标签验证工具
 *
 * 验证 AI 返回的标签 slug 是否存在于数据库的标签字典中
 * 存在的返回对应的 ID，不存在的标记为 unknown
 *
 * 所有标签类型现在使用统一的 Tag 模型，通过 type 字段区分
 */

import { prisma } from "@/lib/db/prisma";

export interface AITagOutput {
  scenes?: string[];
  cookingMethods?: string[];
  tastes?: string[];
  crowds?: string[];
  occasions?: string[];
}

export interface ValidatedTags {
  valid: {
    cuisine?: string; // cuisineId
    primaryScene?: string; // sceneId
    scenes?: string[]; // sceneIds
    primaryMethod?: string; // methodId
    methods?: string[]; // methodIds
    tastes?: string[]; // tasteIds
    crowds?: string[]; // crowdIds
    occasions?: string[]; // occasionIds
  };
  unknown: Array<{
    type: "scene" | "method" | "taste" | "crowd" | "occasion";
    slug: string;
  }>;
}

/**
 * 根据 slug 或 name 查找标签
 * AI 可能返回中文名称或英文 slug，需要同时支持两种匹配方式
 */
async function findTagsBySlugOrName(
  type: string,
  values: string[]
): Promise<{ tags: Array<{ id: string; slug: string; name: string }>; foundValues: Set<string> }> {
  if (!values || values.length === 0) {
    return { tags: [], foundValues: new Set() };
  }

  // 同时匹配 slug 和 name
  const tags = await prisma.tag.findMany({
    where: {
      type,
      OR: [
        { slug: { in: values } },
        { name: { in: values } },
      ],
    },
    select: { id: true, slug: true, name: true },
  });

  // 构建已找到的值集合（包括 slug 和 name）
  const foundValues = new Set<string>();
  for (const tag of tags) {
    foundValues.add(tag.slug);
    foundValues.add(tag.name);
  }

  return { tags, foundValues };
}

/**
 * 验证 AI 返回的标签，返回有效的 ID 列表和未知标签列表
 * 支持 AI 返回中文名称或英文 slug
 */
export async function validateAITags(
  aiTags: AITagOutput,
  cuisineSlug?: string
): Promise<ValidatedTags> {
  const valid: ValidatedTags["valid"] = {};
  const unknown: ValidatedTags["unknown"] = [];

  // 1. 验证菜系
  if (cuisineSlug) {
    const cuisine = await prisma.cuisine.findFirst({
      where: {
        OR: [{ slug: cuisineSlug }, { name: cuisineSlug }],
      },
      select: { id: true },
    });
    if (cuisine) {
      valid.cuisine = cuisine.id;
    }
    // 菜系不存在不计入 unknown（菜系通常是预设的）
  }

  // 2. 验证场景 (scenes) - 使用 Tag 模型，type = "scene"
  if (aiTags.scenes && aiTags.scenes.length > 0) {
    const { tags: scenes, foundValues } = await findTagsBySlugOrName("scene", aiTags.scenes);
    const sceneIds = scenes.map((s) => s.id);

    // 设置主场景（第一个有效的）
    if (sceneIds.length > 0) {
      valid.primaryScene = sceneIds[0];
      valid.scenes = sceneIds;
    }

    // 记录未知的场景
    for (const value of aiTags.scenes) {
      if (!foundValues.has(value)) {
        unknown.push({ type: "scene", slug: value });
      }
    }
  }

  // 3. 验证烹饪方式 (cookingMethods) - 使用 Tag 模型，type = "method"
  if (aiTags.cookingMethods && aiTags.cookingMethods.length > 0) {
    const { tags: methods, foundValues } = await findTagsBySlugOrName("method", aiTags.cookingMethods);
    const methodIds = methods.map((m) => m.id);

    // 设置主烹饪方式（第一个有效的）
    if (methodIds.length > 0) {
      valid.primaryMethod = methodIds[0];
      valid.methods = methodIds;
    }

    // 记录未知的烹饪方式
    for (const value of aiTags.cookingMethods) {
      if (!foundValues.has(value)) {
        unknown.push({ type: "method", slug: value });
      }
    }
  }

  // 4. 验证口味 (tastes) - 使用 Tag 模型，type = "taste"
  if (aiTags.tastes && aiTags.tastes.length > 0) {
    const { tags: tastes, foundValues } = await findTagsBySlugOrName("taste", aiTags.tastes);
    valid.tastes = tastes.map((t) => t.id);

    // 记录未知的口味
    for (const value of aiTags.tastes) {
      if (!foundValues.has(value)) {
        unknown.push({ type: "taste", slug: value });
      }
    }
  }

  // 5. 验证人群 (crowds) - 使用 Tag 模型，type = "crowd"
  if (aiTags.crowds && aiTags.crowds.length > 0) {
    const { tags: crowds, foundValues } = await findTagsBySlugOrName("crowd", aiTags.crowds);
    valid.crowds = crowds.map((c) => c.id);

    // 记录未知的人群
    for (const value of aiTags.crowds) {
      if (!foundValues.has(value)) {
        unknown.push({ type: "crowd", slug: value });
      }
    }
  }

  // 6. 验证场合 (occasions) - 使用 Tag 模型，type = "occasion"
  if (aiTags.occasions && aiTags.occasions.length > 0) {
    const { tags: occasions, foundValues } = await findTagsBySlugOrName("occasion", aiTags.occasions);
    valid.occasions = occasions.map((o) => o.id);

    // 记录未知的场合
    for (const value of aiTags.occasions) {
      if (!foundValues.has(value)) {
        unknown.push({ type: "occasion", slug: value });
      }
    }
  }

  return { valid, unknown };
}

/**
 * 从 AI 返回的原始 tags 对象提取标签数组
 */
export function extractTagsFromAIOutput(tags: {
  scenes?: string[];
  cookingMethods?: string[];
  tastes?: string[];
  crowds?: string[];
  occasions?: string[];
}): AITagOutput {
  return {
    scenes: tags.scenes || [],
    cookingMethods: tags.cookingMethods || [],
    tastes: tags.tastes || [],
    crowds: tags.crowds || [],
    occasions: tags.occasions || [],
  };
}

/**
 * 获取所有标签字典的 slug 列表（用于 Prompt 中提供参考）
 */
export async function getAllTagSlugs(): Promise<{
  scenes: string[];
  methods: string[];
  tastes: string[];
  crowds: string[];
  occasions: string[];
}> {
  // 使用统一的 Tag 模型，按 type 过滤
  const tags = await prisma.tag.findMany({
    where: { isActive: true },
    select: { type: true, slug: true },
    orderBy: { sortOrder: "asc" },
  });

  const result = {
    scenes: [] as string[],
    methods: [] as string[],
    tastes: [] as string[],
    crowds: [] as string[],
    occasions: [] as string[],
  };

  for (const tag of tags) {
    switch (tag.type) {
      case "scene":
        result.scenes.push(tag.slug);
        break;
      case "method":
        result.methods.push(tag.slug);
        break;
      case "taste":
        result.tastes.push(tag.slug);
        break;
      case "crowd":
        result.crowds.push(tag.slug);
        break;
      case "occasion":
        result.occasions.push(tag.slug);
        break;
    }
  }

  return result;
}
