/**
 * Collection 自动同步工具
 *
 * 当创建/更新标签时，自动同步对应的 Collection 记录
 */

import { prisma } from "@/lib/db/prisma";

export type TagType =
  | "cuisine"
  | "scene"
  | "method"
  | "taste"
  | "crowd"
  | "occasion"
  | "region";

interface TagInfo {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

/**
 * 根据标签类型获取聚合页路径前缀
 */
function getPathPrefix(type: TagType): string {
  switch (type) {
    case "cuisine":
      return "/recipe/cuisine";
    case "scene":
      return "/recipe/scene";
    case "method":
      return "/recipe/method";
    case "taste":
      return "/recipe/taste";
    case "crowd":
      return "/recipe/crowd";
    case "occasion":
      return "/recipe/occasion";
    case "region":
      return "/recipe/region";
    default:
      return "/recipe";
  }
}

/**
 * 根据标签类型获取 Collection 关联字段名
 */
function getCollectionIdField(type: TagType): string {
  switch (type) {
    case "cuisine":
      return "cuisineId";
    case "scene":
      return "sceneId";
    case "method":
      return "methodId";
    case "taste":
      return "tasteId";
    case "crowd":
      return "crowdId";
    case "occasion":
      return "occasionId";
    default:
      return "";
  }
}

/**
 * 创建标签时自动创建对应的 Collection
 */
export async function createCollectionForTag(
  type: TagType,
  tag: TagInfo
): Promise<void> {
  try {
    const path = `${getPathPrefix(type)}/${tag.slug}`;
    const idField = getCollectionIdField(type);

    // 检查是否已存在
    const existing = await prisma.collection.findFirst({
      where: {
        OR: [{ path }, idField ? { [idField]: tag.id } : { path }],
      },
    });

    if (existing) {
      console.log(`Collection already exists for ${type}/${tag.slug}`);
      return;
    }

    // 创建 Collection
    await prisma.collection.create({
      data: {
        name: tag.name,
        slug: tag.slug,
        path,
        type,
        status: "DRAFT", // 默认草稿状态
        rules: { type, value: tag.slug },
        targetCount: 20,
        minRequired: 10,
        ...(idField ? { [idField]: tag.id } : {}),
      },
    });

    console.log(`Created Collection for ${type}/${tag.slug}`);
  } catch (error) {
    console.error(`Failed to create Collection for ${type}/${tag.slug}:`, error);
    // 不抛出错误，避免阻断标签创建流程
  }
}

/**
 * 更新标签时同步 Collection 信息
 */
export async function syncCollectionForTag(
  type: TagType,
  tagId: string,
  updates: { name?: string; slug?: string }
): Promise<void> {
  try {
    const idField = getCollectionIdField(type);
    if (!idField) return;

    const collection = await prisma.collection.findFirst({
      where: { [idField]: tagId },
    });

    if (!collection) {
      console.log(`No Collection found for ${type}/${tagId}`);
      return;
    }

    const updateData: Record<string, string> = {};
    if (updates.name) {
      updateData.name = updates.name;
    }
    if (updates.slug) {
      updateData.slug = updates.slug;
      updateData.path = `${getPathPrefix(type)}/${updates.slug}`;
      // 更新规则中的 value
      const existingRules =
        typeof collection.rules === "object" && collection.rules !== null
          ? collection.rules
          : {};
      updateData.rules = JSON.stringify({ ...existingRules, value: updates.slug });
    }

    if (Object.keys(updateData).length > 0) {
      // 处理 rules 字段
      const finalData = { ...updateData };
      if (updateData.rules) {
        (finalData as any).rules = JSON.parse(updateData.rules);
      }

      await prisma.collection.update({
        where: { id: collection.id },
        data: finalData,
      });
      console.log(`Synced Collection for ${type}/${tagId}`);
    }
  } catch (error) {
    console.error(`Failed to sync Collection for ${type}/${tagId}:`, error);
  }
}

/**
 * 删除标签时处理 Collection
 * 注意：不自动删除 Collection，而是将其标记为孤立状态
 */
export async function handleCollectionOnTagDelete(
  type: TagType,
  tagId: string
): Promise<void> {
  try {
    const idField = getCollectionIdField(type);
    if (!idField) return;

    const collection = await prisma.collection.findFirst({
      where: { [idField]: tagId },
    });

    if (!collection) return;

    // 将 Collection 状态改为 DRAFT 并清除标签关联
    await prisma.collection.update({
      where: { id: collection.id },
      data: {
        status: "DRAFT",
        [idField]: null,
      },
    });

    console.log(`Orphaned Collection for deleted ${type}/${tagId}`);
  } catch (error) {
    console.error(`Failed to handle Collection for deleted ${type}/${tagId}:`, error);
  }
}
