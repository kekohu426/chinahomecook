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

  // 转换为表单数据
  const initialData = {
    id: recipe.id,
    schemaVersion: recipe.schemaVersion as "1.1.0",
    titleZh: recipe.titleZh,
    titleEn: recipe.titleEn,
    summary: recipe.summary as any,
    story: recipe.story as any,
    ingredients: recipe.ingredients as any,
    steps: recipe.steps as any,
    styleGuide: recipe.styleGuide as any,
    imageShots: recipe.imageShots as any,
    author: recipe.author,
    location: recipe.location,
    cuisine: recipe.cuisine,
    mainIngredients: recipe.mainIngredients,
    coverImage: recipe.coverImage,
    isPublished: recipe.isPublished,
  };

  return (
    <div>
      <h1 className="text-3xl font-serif font-medium text-textDark mb-8">
        编辑食谱：{recipe.titleZh}
      </h1>
      <RecipeForm mode="edit" initialData={initialData} />
    </div>
  );
}
