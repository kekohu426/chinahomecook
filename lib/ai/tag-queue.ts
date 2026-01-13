/**
 * 未知标签入队工具 (Stubbed)
 *
 * TagReviewQueue 模型不存在，此模块暂时返回空操作
 */

import type { ValidatedTags } from "./tag-validator";

/**
 * 将未知标签加入审核队列 (Stubbed)
 */
export async function enqueueUnknownTags(
  unknownTags: ValidatedTags["unknown"],
  recipeId: string,
  recipeName: string
): Promise<void> {
  if (!unknownTags || unknownTags.length === 0) {
    return;
  }

  // Stubbed: TagReviewQueue 模型不存在
  console.log(
    `[TagQueue] Stubbed - 未入队 ${unknownTags.length} 个未知标签 (食谱: ${recipeName}, ID: ${recipeId})`
  );
}

/**
 * 批量入队未知标签 (Stubbed)
 */
export async function enqueueUnknownTagsBatch(
  items: Array<{
    unknownTags: ValidatedTags["unknown"];
    recipeId: string;
    recipeName: string;
  }>
): Promise<{ success: number; failed: number }> {
  // Stubbed: TagReviewQueue 模型不存在
  console.log(`[TagQueue] Stubbed - 批量入队 ${items.length} 个条目`);
  return { success: items.length, failed: 0 };
}

/**
 * 获取待审核标签统计 (Stubbed)
 */
export async function getQueueStats(): Promise<{
  total: number;
  byType: Record<string, number>;
}> {
  // Stubbed: TagReviewQueue 模型不存在
  return { total: 0, byType: {} };
}
