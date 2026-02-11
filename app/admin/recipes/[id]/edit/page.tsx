/**
 * 后台管理 - 编辑食谱页
 *
 * 路由：/admin/recipes/[id]/edit
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { RecipeForm } from "@/components/admin/RecipeForm";
import { Image } from "lucide-react";

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = await params;

  // 从数据库获取食谱（包含标签）
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      tags: {
        include: {
          tag: {
            select: { id: true, type: true, name: true, slug: true },
          },
        },
      },
    },
  });

  if (!recipe) {
    notFound();
  }

  // 从关联数据中提取标签（按类型分组）
  const tagsByType: Record<string, string[]> = {};
  recipe.tags.forEach((rt) => {
    const type = rt.tag.type;
    if (!tagsByType[type]) tagsByType[type] = [];
    tagsByType[type].push(rt.tag.name);
  });

  // 转换为表单数据（适配新 Schema）
  const initialData = {
    id: recipe.id,
    slug: recipe.slug,
    schemaVersion: "1.1.0" as const,
    titleZh: recipe.title, // 新 Schema: title 是中文标题
    titleEn: "", // 英文标题从 translation 获取，这里先留空
    summary: recipe.summary as any,
    story: recipe.story as any,
    ingredients: recipe.ingredients as any,
    steps: recipe.steps as any,
    author: recipe.author || undefined,
    location: recipe.locationId || null, // 新 Schema: locationId
    cuisine: recipe.cuisineId || null, // 新 Schema: cuisineId
    mainIngredients: [], // 新 Schema: 从 ingredients JSON 提取
    coverImage: recipe.coverImage,
    isPublished: recipe.status === "published",
    // 标签数据
    scenes: tagsByType["scene"] || [],
    cookingMethods: tagsByType["method"] || [],
    tastes: tagsByType["taste"] || [],
    crowds: tagsByType["crowd"] || [],
    occasions: tagsByType["occasion"] || [],
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="px-4 py-2 rounded-full bg-brownWarm text-white">
            编辑信息
          </span>
        </div>
        <Link
          href="/admin/tools/prompt-generator"
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors text-sm"
        >
          <Image className="w-4 h-4" />
          查看图片生成
        </Link>
      </div>
      <h1 className="text-3xl font-serif font-medium text-textDark mb-8">
        编辑食谱：{recipe.title}
      </h1>
      <RecipeForm mode="edit" initialData={initialData} />
    </div>
  );
}
