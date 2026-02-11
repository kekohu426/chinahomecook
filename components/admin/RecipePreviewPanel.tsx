/**
 * 食谱预览面板组件
 *
 * 用于管理后台编辑页面的实时预览，复用用户端的展示组件
 */

"use client";

import { useMemo } from "react";
import type { Recipe, IngredientSection, RecipeStep } from "@/types/recipe";
import { RecipeDetailClient } from "@/components/recipe/RecipeDetailClient";

interface RecipePreviewPanelProps {
  // 基本信息
  titleZh: string;
  author?: string;
  // 摘要
  summary: {
    oneLine?: string;
    healingTone?: string;
    difficulty?: "easy" | "medium" | "hard";
    timeTotalMin?: number;
    timeActiveMin?: number;
    servings?: number;
  };
  // 故事
  story: {
    title?: string;
    content?: string;
    tags?: string[];
  };
  // 食材和步骤
  ingredients: IngredientSection[];
  steps: RecipeStep[];
  // 封面图
  coverImage?: string;
}

export function RecipePreviewPanel({
  titleZh,
  author,
  summary,
  story,
  ingredients,
  steps,
  coverImage,
}: RecipePreviewPanelProps) {
  // 构建 Recipe 对象
  const recipe: Recipe = useMemo(
    () => ({
      schemaVersion: "1.1.0",
      titleZh: titleZh || "未命名食谱",
      author,
      aiGenerated: false,
      summary: {
        oneLine: summary.oneLine || "",
        healingTone: summary.healingTone || "",
        difficulty: summary.difficulty || "easy",
        timeTotalMin: summary.timeTotalMin || 0,
        timeActiveMin: summary.timeActiveMin || 0,
        servings: summary.servings || 2,
      },
      story: {
        title: story.title || "",
        content: story.content || "",
        tags: story.tags || [],
      },
      ingredients,
      steps,
    }),
    [titleZh, author, summary, story, ingredients, steps]
  );

  // 构建步骤图片映射
  const stepImages: Record<string, string | undefined> = useMemo(() => {
    const images: Record<string, string | undefined> = {};
    (steps || []).forEach((step: RecipeStep) => {
      if (step?.id && step?.imageUrl) {
        images[step.id] = step.imageUrl;
        const digits = String(step.id).replace(/\D/g, "");
        if (digits) {
          images[`step${digits}`] = step.imageUrl;
          images[digits] = step.imageUrl;
        }
      }
    });
    return images;
  }, [steps]);

  // 构建封面图集合
  const coverImages: string[] = useMemo(() => {
    const images: string[] = [];
    const coverKeys = ["cover_main", "cover_detail", "cover_inside", "cover", "hero", "final"];
    coverKeys.forEach((key) => {
      if (stepImages[key]) {
        images.push(stepImages[key]!);
      }
    });

    if (coverImage && !images.includes(coverImage)) {
      images.unshift(coverImage);
    }

    if (images.length === 0 && steps?.[0]?.imageUrl) {
      images.push(steps[0].imageUrl);
    }

    return images;
  }, [coverImage, stepImages, steps]);

  return (
    <div className="bg-[#FDF8F3] min-h-full rounded-lg overflow-hidden">
      {/* 预览标签 */}
      <div className="bg-brownDark text-white px-4 py-2 text-sm font-medium">
        实时预览
      </div>

      {/* 预览内容 - 使用缩放来适应面板宽度 */}
      <div className="origin-top-left scale-[0.65] w-[154%]">
        <RecipeDetailClient
          recipe={recipe}
          coverImage={coverImages[0]}
          stepImages={stepImages}
        />
      </div>
    </div>
  );
}
