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
 * 验证 AI 返回的标签，返回有效的 ID 列表和未知标签列表
 */
export async function validateAITags(
  aiTags: AITagOutput,
  cuisineSlug?: string
): Promise<ValidatedTags> {
  const valid: ValidatedTags["valid"] = {};
  const unknown: ValidatedTags["unknown"] = [];

  // 1. 验证菜系
  if (cuisineSlug) {
    const cuisine = await prisma.cuisine.findUnique({
      where: { slug: cuisineSlug },
      select: { id: true },
    });
    if (cuisine) {
      valid.cuisine = cuisine.id;
    }
    // 菜系不存在不计入 unknown（菜系通常是预设的）
  }

  // 2. 验证场景 (scenes) - 使用 Tag 模型，type = "scene"
  if (aiTags.scenes && aiTags.scenes.length > 0) {
    const scenes = await prisma.tag.findMany({
      where: { type: "scene", slug: { in: aiTags.scenes } },
      select: { id: true, slug: true },
    });

    const foundSlugs = new Set(scenes.map((s) => s.slug));
    const sceneIds = scenes.map((s) => s.id);

    // 设置主场景（第一个有效的）
    if (sceneIds.length > 0) {
      valid.primaryScene = sceneIds[0];
      valid.scenes = sceneIds;
    }

    // 记录未知的场景
    for (const slug of aiTags.scenes) {
      if (!foundSlugs.has(slug)) {
        unknown.push({ type: "scene", slug });
      }
    }
  }

  // 3. 验证烹饪方式 (cookingMethods) - 使用 Tag 模型，type = "method"
  if (aiTags.cookingMethods && aiTags.cookingMethods.length > 0) {
    const methods = await prisma.tag.findMany({
      where: { type: "method", slug: { in: aiTags.cookingMethods } },
      select: { id: true, slug: true },
    });

    const foundSlugs = new Set(methods.map((m) => m.slug));
    const methodIds = methods.map((m) => m.id);

    // 设置主烹饪方式（第一个有效的）
    if (methodIds.length > 0) {
      valid.primaryMethod = methodIds[0];
      valid.methods = methodIds;
    }

    // 记录未知的烹饪方式
    for (const slug of aiTags.cookingMethods) {
      if (!foundSlugs.has(slug)) {
        unknown.push({ type: "method", slug });
      }
    }
  }

  // 4. 验证口味 (tastes) - 使用 Tag 模型，type = "taste"
  if (aiTags.tastes && aiTags.tastes.length > 0) {
    const tastes = await prisma.tag.findMany({
      where: { type: "taste", slug: { in: aiTags.tastes } },
      select: { id: true, slug: true },
    });

    const foundSlugs = new Set(tastes.map((t) => t.slug));
    valid.tastes = tastes.map((t) => t.id);

    // 记录未知的口味
    for (const slug of aiTags.tastes) {
      if (!foundSlugs.has(slug)) {
        unknown.push({ type: "taste", slug });
      }
    }
  }

  // 5. 验证人群 (crowds) - 使用 Tag 模型，type = "crowd"
  if (aiTags.crowds && aiTags.crowds.length > 0) {
    const crowds = await prisma.tag.findMany({
      where: { type: "crowd", slug: { in: aiTags.crowds } },
      select: { id: true, slug: true },
    });

    const foundSlugs = new Set(crowds.map((c) => c.slug));
    valid.crowds = crowds.map((c) => c.id);

    // 记录未知的人群
    for (const slug of aiTags.crowds) {
      if (!foundSlugs.has(slug)) {
        unknown.push({ type: "crowd", slug });
      }
    }
  }

  // 6. 验证场合 (occasions) - 使用 Tag 模型，type = "occasion"
  if (aiTags.occasions && aiTags.occasions.length > 0) {
    const occasions = await prisma.tag.findMany({
      where: { type: "occasion", slug: { in: aiTags.occasions } },
      select: { id: true, slug: true },
    });

    const foundSlugs = new Set(occasions.map((o) => o.slug));
    valid.occasions = occasions.map((o) => o.id);

    // 记录未知的场合
    for (const slug of aiTags.occasions) {
      if (!foundSlugs.has(slug)) {
        unknown.push({ type: "occasion", slug });
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
