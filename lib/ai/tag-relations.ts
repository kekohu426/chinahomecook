import { prisma } from "@/lib/db/prisma";
import {
  extractTagsFromAIOutput,
  validateAITags,
  type ValidatedTags,
} from "./tag-validator";

export async function resolveCuisineSlug(
  input?: string
): Promise<string | undefined> {
  if (!input) return undefined;
  const cuisine = await prisma.cuisine.findFirst({
    where: {
      OR: [{ slug: input }, { name: input }],
    },
    select: { slug: true },
  });
  return cuisine?.slug;
}

export async function attachRecipeTags(params: {
  recipeId: string;
  tags?: Record<string, unknown> | null;
  cuisineSlug?: string;
}): Promise<{ created: number; unknown: ValidatedTags["unknown"] }> {
  const aiTags = extractTagsFromAIOutput((params.tags || {}) as any);

  // 日志：AI 返回的原始标签
  console.log("📋 AI 返回的标签:", JSON.stringify(aiTags, null, 2));

  const hasTags = Object.values(aiTags).some(
    (value) => Array.isArray(value) && value.length > 0
  );

  if (!hasTags) {
    console.log("⚠️ AI 未返回任何标签");
    return { created: 0, unknown: [] };
  }

  const validated = await validateAITags(aiTags, params.cuisineSlug);

  // 日志：验证结果
  console.log("✅ 标签验证结果:", {
    scenes: validated.valid.scenes?.length || 0,
    methods: validated.valid.methods?.length || 0,
    tastes: validated.valid.tastes?.length || 0,
    crowds: validated.valid.crowds?.length || 0,
    occasions: validated.valid.occasions?.length || 0,
    unknown: validated.unknown.length,
  });

  const tagIds: string[] = [];

  if (validated.valid.scenes) tagIds.push(...validated.valid.scenes);
  if (validated.valid.methods) tagIds.push(...validated.valid.methods);
  if (validated.valid.tastes) tagIds.push(...validated.valid.tastes);
  if (validated.valid.crowds) tagIds.push(...validated.valid.crowds);
  if (validated.valid.occasions) tagIds.push(...validated.valid.occasions);

  let created = 0;
  const uniqueTagIds = Array.from(new Set(tagIds));

  for (const tagId of uniqueTagIds) {
    try {
      await prisma.recipeTag.create({
        data: { recipeId: params.recipeId, tagId },
      });
      created += 1;
    } catch (err: any) {
      if (err?.code !== "P2002") {
        console.error("Failed to attach tag:", tagId, err);
      }
    }
  }

  console.log(`🏷️ 成功关联 ${created} 个标签到菜谱 ${params.recipeId}`);

  return { created, unknown: validated.unknown };
}
