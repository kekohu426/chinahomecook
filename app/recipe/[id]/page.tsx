/**
 * 食谱详情页
 *
 * 路由：/recipe/[id]
 * 展示完整的食谱信息：头部、文化故事、食材清单、制作步骤、AI主厨
 *
 * 🚨 设计约束：100%还原设计稿
 * 参考：docs/UI_DESIGN.md - 整体布局
 */

import { notFound } from "next/navigation";
import { RecipeHeader } from "@/components/recipe/RecipeHeader";
import { IngredientSidebar } from "@/components/recipe/IngredientSidebar";
import { StepCard } from "@/components/recipe/StepCard";
import { AIChefCard } from "@/components/recipe/AIChefCard";
import { CookModeView } from "@/components/recipe/CookModeView";
import { prisma } from "@/lib/db/prisma";
import type { Recipe } from "@/types/recipe";

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;

  // 从数据库获取食谱
  const recipeData = await prisma.recipe.findUnique({
    where: { id },
  });

  if (!recipeData || !recipeData.isPublished) {
    notFound();
  }

  // 转换为 Recipe 类型
  const recipe: Recipe = {
    schemaVersion: recipeData.schemaVersion as "1.1.0",
    titleZh: recipeData.titleZh,
    titleEn: recipeData.titleEn || undefined,
    summary: recipeData.summary as any,
    story: recipeData.story as any,
    ingredients: recipeData.ingredients as any,
    steps: recipeData.steps as any,
    styleGuide: recipeData.styleGuide as any,
    imageShots: recipeData.imageShots as any,
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* 头部大图 + 信息卡片 */}
      <RecipeHeader recipe={recipe} coverImage={recipeData.coverImage} />

      {/* 主内容区：左右分栏布局 */}
      <div className="max-w-7xl mx-auto px-12 py-12">
        <div className="flex gap-8">
          {/* 左侧：食材清单（固定侧边栏）*/}
          <IngredientSidebar
            ingredients={recipe.ingredients}
            baseServings={recipe.summary.servings}
          />

          {/* 右侧：主内容区（可滚动）*/}
          <div className="flex-1 min-w-0">
            {/* 文化故事 */}
            <div className="bg-white rounded-md shadow-card p-8 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🪶</span>
                <h2 className="text-xl font-serif font-medium text-textDark">
                  {recipe.story.title}
                </h2>
              </div>
              <p className="text-base text-textDark leading-relaxed">
                {recipe.story.content}
              </p>
              {/* 标签 */}
              <div className="flex gap-2 mt-4">
                {(recipe.story.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-cream text-textGray text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 制作步骤标题 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-medium text-textDark">
                制作步骤
              </h2>
              <span className="text-sm font-medium text-brownWarm uppercase tracking-wider">
                🍳 COOKING IN PROGRESS
              </span>
            </div>

            {/* 步骤卡片列表 */}
            {recipe.steps.map((step, index) => {
              // 尝试更灵活地匹配 imageShot
              const imageShot = recipe.imageShots?.find((shot) => {
                // 1. 直接匹配 key === id
                if (shot.key === step.id) return true;
                // 2. 尝试匹配数字部分 (例如 step01 匹配 step1)
                const stepNum = step.id.replace(/\D/g, '');
                const shotNum = shot.key.replace(/\D/g, '');
                if (stepNum && shotNum && stepNum === shotNum) return true;
                return false;
              });

              return (
                <StepCard 
                  key={step.id} 
                  step={step} 
                  stepNumber={index + 1} 
                  imageUrl={imageShot?.imageUrl}
                />
              );
            })}

            {/* AI 智能主厨 */}
            <AIChefCard recipeTitle={recipe.titleZh} />

            {/* 底部工具栏 */}
            <div className="bg-white rounded-md shadow-card p-6 flex items-center justify-between">
              <div className="flex gap-4">
                <button className="text-textGray hover:text-brownWarm transition-colors flex items-center gap-2">
                  <span>🔗</span>
                  <span className="text-sm font-medium">SHARE</span>
                </button>
                <button className="text-textGray hover:text-brownWarm transition-colors flex items-center gap-2">
                  <span>🖨️</span>
                  <span className="text-sm font-medium">PRINT</span>
                </button>
              </div>

              <CookModeView
                steps={recipe.steps}
                recipeTitle={recipe.titleZh}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
