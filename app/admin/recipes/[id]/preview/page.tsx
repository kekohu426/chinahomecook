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
import { RecipeDetailClient } from "@/components/recipe/RecipeDetailClient";
import { ChevronRight, Home, ArrowLeft, Edit2 } from "lucide-react";

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
    summary: recipeData.summary as any,
    story: recipeData.story as any,
    ingredients: recipeData.ingredients as any,
    steps: recipeData.steps as any,
    styleGuide: recipeData.styleGuide as any,
    imageShots: recipeData.imageShots as any,
  };

  // 构建步骤图片映射
  const stepImages = (recipe.imageShots || []).reduce<Record<string, string | undefined>>((acc, shot) => {
    const url = (shot as any).imageUrl;
    if (shot.key) {
      acc[shot.key] = url;
      const digits = shot.key.replace(/\D/g, "");
      if (digits) {
        acc[`step${digits}`] = url;
        acc[digits] = url;
      }
    }
    return acc;
  }, {});

  // 封面图
  const coverImage =
    recipeData.coverImage ||
    stepImages["cover"] ||
    stepImages["hero"] ||
    stepImages["final"];

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
        coverImage={coverImage}
        stepImages={stepImages}
      />

      {/* 底部提示 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-center">
        <p className="text-sm text-textGray">
          这是预览模式，显示的是数据库中已保存的内容
        </p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <Link
            href={`/admin/recipes/${id}/edit`}
            className="px-6 py-2 bg-brownWarm text-white rounded-full hover:bg-brownWarm/90 transition-colors"
          >
            返回编辑
          </Link>
          <Link
            href="/admin/recipes"
            className="px-6 py-2 border border-brownWarm text-brownWarm rounded-full hover:bg-brownWarm/10 transition-colors"
          >
            返回列表
          </Link>
        </div>
      </div>
    </div>
  );
}
