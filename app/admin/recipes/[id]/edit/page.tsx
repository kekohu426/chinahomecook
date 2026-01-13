/**
 * 后台管理 - 编辑食谱页
 *
 * 路由：/admin/recipes/[id]/edit
 */

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { RecipeForm } from "@/components/admin/RecipeForm";

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = await params;

  // 从数据库获取食谱
  const recipe = await prisma.recipe.findUnique({
    where: { id },
  });

  if (!recipe) {
    notFound();
  }

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
    styleGuide: recipe.styleGuide as any,
    imageShots: recipe.imageShots as any,
    author: undefined,
    location: recipe.locationId || null, // 新 Schema: locationId
    cuisine: recipe.cuisineId || null, // 新 Schema: cuisineId
    mainIngredients: [], // 新 Schema: 从 ingredients JSON 提取
    coverImage: recipe.coverImage,
    isPublished: recipe.status === "published",
  };

  return (
    <div>
      <h1 className="text-3xl font-serif font-medium text-textDark mb-8">
        编辑食谱：{recipe.title}
      </h1>
      <RecipeForm mode="edit" initialData={initialData} />
    </div>
  );
}
