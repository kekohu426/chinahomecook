/**
 * 后台管理 - 食谱预览页
 *
 * 路由：/admin/recipes/[id]/preview
 * 模拟用户端展示效果，用于审核和编辑时预览
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import type { Recipe } from "@/types/recipe";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RecipeDetailClient } from "@/components/recipe/RecipeDetailClient";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { ChevronRight, Home, ArrowLeft, Edit2, Image } from "lucide-react";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipePreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;

  // 从数据库获取食谱（不限制状态，管理员可以预览任何状态的食谱）
  const recipeData = await prisma.recipe.findUnique({
    where: { id },
    include: {
      cuisine: { select: { id: true, name: true, slug: true } },
      location: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!recipeData) {
    notFound();
  }

  // 转换为 Recipe 类型
  const recipe: Recipe = {
    schemaVersion: "1.1.0",
    titleZh: recipeData.title,
    titleEn: undefined,
    author: recipeData.author || undefined,
    aiGenerated: recipeData.aiGenerated,
    summary: recipeData.summary as any,
    story: recipeData.story as any,
    ingredients: recipeData.ingredients as any,
    steps: recipeData.steps as any,
    nutrition: (recipeData.nutrition as any) || undefined,
    faq: (recipeData.faq as any) || undefined,
    tips: (recipeData.tips as any) || undefined,
    troubleshooting: (recipeData.troubleshooting as any) || undefined,
    relatedRecipes: (recipeData.relatedRecipes as any) || undefined,
    pairing: (recipeData.pairing as any) || undefined,
    seo: (recipeData.seo as any) || undefined,
    notes: (recipeData.notes as any) || undefined,
  };

  // 构建步骤图片映射（从 steps 中提取 imageUrl）
  const stepImages: Record<string, string | undefined> = {};
  (recipe.steps || []).forEach((step: any) => {
    if (step?.id && step?.imageUrl) {
      stepImages[step.id] = step.imageUrl;
      const digits = String(step.id).replace(/\D/g, "");
      if (digits) {
        stepImages[`step${digits}`] = step.imageUrl;
        stepImages[digits] = step.imageUrl;
      }
    }
  });

  // 封面图集合（用于轮播）
  const coverImages: string[] = [];
  const coverKeys = ["cover_main", "cover_detail", "cover_inside", "cover", "hero", "final"];
  coverKeys.forEach((key) => {
    if (stepImages[key]) {
      coverImages.push(stepImages[key]!);
    }
  });

  if (recipeData.coverImage && !coverImages.includes(recipeData.coverImage)) {
    coverImages.unshift(recipeData.coverImage);
  }

  if (coverImages.length === 0 && recipe.steps?.[0]) {
    const firstStepImage = (recipe.steps[0] as any).imageUrl;
    if (firstStepImage) {
      coverImages.push(firstStepImage);
    }
  }

  // 相关食谱推荐（用于模拟前台展示）
  const relatedWhere: any = {
    status: "published",
    id: { not: recipeData.id },
    OR: [] as any[],
  };
  if (recipeData.cuisineId) {
    relatedWhere.OR.push({ cuisineId: recipeData.cuisineId });
  }
  if (recipeData.locationId) {
    relatedWhere.OR.push({ locationId: recipeData.locationId });
  }
  if (relatedWhere.OR.length === 0) {
    delete relatedWhere.OR;
  }

  const relatedRecipes = await prisma.recipe.findMany({
    where: relatedWhere,
    take: 4,
    orderBy: { createdAt: "desc" },
    include: {
      cuisine: { select: { id: true, name: true, slug: true } },
      location: { select: { id: true, name: true, slug: true } },
    },
  });

  // 状态标签
  const statusLabels: Record<string, { text: string; color: string }> = {
    draft: { text: "草稿", color: "bg-gray-100 text-gray-700" },
    pending: { text: "待审核", color: "bg-amber-100 text-amber-700" },
    published: { text: "已发布", color: "bg-green-100 text-green-700" },
    archived: { text: "已归档", color: "bg-gray-300 text-gray-700" },
  };
  const statusInfo = statusLabels[recipeData.status] || statusLabels.draft;

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* 预览工具栏 */}
      <div className="sticky top-0 z-50 bg-brownDark text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/admin/recipes/${id}/edit`}
              className="flex items-center gap-2 text-cream hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回编辑
            </Link>
            <span className="text-cream/50">|</span>
            <span className="text-sm text-cream/70">预览模式</span>
            <span className={`px-2 py-0.5 rounded text-xs ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/tools/prompt-generator"
              className="flex items-center gap-2 px-4 py-1.5 bg-purple-500 hover:bg-purple-600 rounded-full text-sm transition-colors"
            >
              <Image className="w-4 h-4" />
              图片生成
            </Link>
            <Link
              href={`/admin/recipes/${id}/edit`}
              className="flex items-center gap-2 px-4 py-1.5 bg-brownWarm hover:bg-brownWarm/90 rounded-full text-sm transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              编辑
            </Link>
            <Link
              href="/admin/recipes"
              className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
            >
              返回列表
            </Link>
          </div>
        </div>
      </div>

      {/* 面包屑导航（模拟用户端） */}
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <nav className="flex items-center gap-2 text-sm text-textGray">
          <span className="text-textGray">
            <Home className="w-4 h-4" />
          </span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-textGray">食谱</span>
          {recipeData.cuisine?.name && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-textGray">{recipeData.cuisine.name}</span>
            </>
          )}
          <ChevronRight className="w-4 h-4" />
          <span className="text-textDark truncate max-w-[200px]">
            {recipe.titleZh}
          </span>
        </nav>
      </div>

      {/* 食谱详情内容 */}
      <RecipeDetailClient
        recipe={recipe}
        coverImage={coverImages[0]}
        stepImages={stepImages}
      />

      {relatedRecipes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 border-t border-lightGray">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-serif font-medium text-textDark">
              相关食谱推荐
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedRecipes.map((related) => (
              <RecipeCard
                key={related.id}
                id={related.id}
                slug={related.slug}
                titleZh={related.title}
                title={related.title}
                summary={(related.summary as any) || undefined}
                location={related.location?.name || null}
                cuisine={related.cuisine?.name || null}
                aiGenerated={related.aiGenerated}
                coverImage={related.coverImage}
                aspectClass="aspect-[4/3]"
              />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
