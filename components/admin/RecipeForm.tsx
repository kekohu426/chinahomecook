/**
 * 食谱表单组件
 *
 * 完整的食谱创建/编辑表单（PRD Schema v1.1.0）
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ImageGenerator } from "@/components/admin/ImageGenerator";
import { TagSelector } from "@/components/admin/TagSelector";
import type {
  IngredientSection,
  ImageShot,
  Recipe,
  RecipeStep,
  StyleGuide,
} from "@/types/recipe";

interface RecipeFormProps {
  initialData?: Partial<Recipe> & {
    id?: string;
    slug?: string;
    author?: string;
    isPublished?: boolean;
    location?: string | null;
    cuisine?: string | null;
    mainIngredients?: string[];
    coverImage?: string | null;
    // 标签字段
    scenes?: string[];
    cookingMethods?: string[];
    tastes?: string[];
    crowds?: string[];
    occasions?: string[];
  };
  mode: "create" | "edit";
}

const DEFAULT_INGREDIENTS: IngredientSection[] = [
  {
    section: "主料",
    items: [
      {
        name: "",
        iconKey: "meat",
        amount: 1,
        unit: "克",
        notes: "",
      },
    ],
  },
];

const DEFAULT_STEPS: RecipeStep[] = [
  {
    id: "step01",
    title: "",
    action: "",
    speechText: "",
    timerSec: 0,
    visualCue: "",
    failPoint: "",
    photoBrief: "",
  },
];

const DEFAULT_STYLE_GUIDE: StyleGuide = {
  theme: "治愈系暖调",
  lighting: "自然光",
  composition: "留白构图",
  aesthetic: "吉卜力或日杂风",
};

export function RecipeForm({ initialData, mode }: RecipeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 基本信息
  const [titleZh, setTitleZh] = useState(initialData?.titleZh || "");
  const [titleEn, setTitleEn] = useState(initialData?.titleEn || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [author, setAuthor] = useState(initialData?.author || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [cuisine, setCuisine] = useState(initialData?.cuisine || "");
  const [mainIngredientsInput, setMainIngredientsInput] = useState(
    initialData?.mainIngredients?.join(", ") || ""
  );
  const [isPublished, setIsPublished] = useState(
    initialData?.isPublished || false
  );

  // 标签
  const [scenes, setScenes] = useState<string[]>(initialData?.scenes || []);
  const [cookingMethods, setCookingMethods] = useState<string[]>(
    initialData?.cookingMethods || []
  );
  const [tastes, setTastes] = useState<string[]>(initialData?.tastes || []);
  const [crowds, setCrowds] = useState<string[]>(initialData?.crowds || []);
  const [occasions, setOccasions] = useState<string[]>(
    initialData?.occasions || []
  );

  // 封面图
  const [coverImage, setCoverImage] = useState(
    initialData?.coverImage || ""
  );
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [coverPreviewOpen, setCoverPreviewOpen] = useState(false);

  // 摘要信息
  const [oneLine, setOneLine] = useState(initialData?.summary?.oneLine || "");
  const [healingTone, setHealingTone] = useState(
    initialData?.summary?.healingTone || ""
  );
  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard"
  >(initialData?.summary?.difficulty || "easy");
  const [timeTotalMin, setTimeTotalMin] = useState(
    initialData?.summary?.timeTotalMin?.toString() || ""
  );
  const [timeActiveMin, setTimeActiveMin] = useState(
    initialData?.summary?.timeActiveMin?.toString() || ""
  );
  const [servings, setServings] = useState(
    initialData?.summary?.servings?.toString() || "2"
  );

  // 文化故事 - 支持字符串或对象格式
  const getStoryData = () => {
    const story = initialData?.story;
    if (!story) return { title: "", content: "", tags: "" };
    if (typeof story === "string") {
      return { title: "", content: story, tags: "" };
    }
    return {
      title: story.title || "",
      content: story.content || "",
      tags: story.tags?.join(", ") || ""
    };
  };
  const storyData = getStoryData();
  const [storyTitle, setStoryTitle] = useState(storyData.title);
  const [storyContent, setStoryContent] = useState(storyData.content);
  const [storyTags, setStoryTags] = useState(storyData.tags);

  // 食材
  const [ingredients, setIngredients] = useState<IngredientSection[]>(
    initialData?.ingredients?.length ? initialData.ingredients : DEFAULT_INGREDIENTS
  );

  // 步骤
  const [steps, setSteps] = useState<RecipeStep[]>(
    initialData?.steps?.length ? initialData.steps : DEFAULT_STEPS
  );

  // 风格指南
  const [styleGuide, setStyleGuide] = useState<StyleGuide>(
    initialData?.styleGuide || DEFAULT_STYLE_GUIDE
  );

  // 配图方案
  const [imageShots, setImageShots] = useState<ImageShot[]>(
    initialData?.imageShots || []
  );
  const [imageUploadLoading, setImageUploadLoading] = useState<Record<number, boolean>>({});
  const [imageGenLoading, setImageGenLoading] = useState<Record<number, boolean>>({});
  const [exporting, setExporting] = useState(false);

  const stepImageMap = useMemo(() => {
    const map: Record<string, string> = {};
    imageShots.forEach((shot) => {
      if (shot.key && shot.imageUrl) {
        map[shot.key] = shot.imageUrl;
      }
    });
    return map;
  }, [imageShots]);

  const mainIngredients = useMemo(() => {
    return mainIngredientsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [mainIngredientsInput]);

  // 食材操作
  const updateSectionTitle = (index: number, value: string) => {
    const next = [...ingredients];
    next[index] = { ...next[index], section: value };
    setIngredients(next);
  };

  const addIngredientSection = () => {
    setIngredients([
      ...ingredients,
      {
        section: "",
        items: [
          {
            name: "",
            iconKey: "other",
            amount: 1,
            unit: "克",
            notes: "",
          },
        ],
      },
    ]);
  };

  const removeIngredientSection = (index: number) => {
    if (ingredients.length === 1) return;
    setIngredients(ingredients.filter((_, idx) => idx !== index));
  };

  const updateIngredientItem = (
    sectionIndex: number,
    itemIndex: number,
    field: keyof IngredientSection["items"][number],
    value: string
  ) => {
    const next = [...ingredients];
    const section = next[sectionIndex];
    const items = [...section.items];
    const updatedItem = { ...items[itemIndex] };

    if (field === "amount") {
      updatedItem.amount = Number(value) || 0;
    } else {
      updatedItem[field] = value as never;
    }

    items[itemIndex] = updatedItem;
    next[sectionIndex] = { ...section, items };
    setIngredients(next);
  };

  const addIngredientItem = (sectionIndex: number) => {
    const next = [...ingredients];
    const section = next[sectionIndex];
    next[sectionIndex] = {
      ...section,
      items: [
        ...section.items,
        { name: "", iconKey: "other", amount: 1, unit: "克", notes: "" },
      ],
    };
    setIngredients(next);
  };

  const removeIngredientItem = (sectionIndex: number, itemIndex: number) => {
    const next = [...ingredients];
    const section = next[sectionIndex];
    if (section.items.length === 1) return;
    next[sectionIndex] = {
      ...section,
      items: section.items.filter((_, idx) => idx !== itemIndex),
    };
    setIngredients(next);
  };

  // 步骤操作
  const updateStepField = (
    index: number,
    field: keyof RecipeStep,
    value: string
  ) => {
    const next = [...steps];
    const updated = { ...next[index] } as RecipeStep;

    if (field === "timerSec") {
      updated.timerSec = Number(value) || 0;
    } else {
      updated[field] = value as never;
    }

    next[index] = updated;
    setSteps(next);
  };

  const addStep = () => {
    const nextIndex = steps.length + 1;
    const nextId = `step${nextIndex.toString().padStart(2, "0")}`;
    setSteps([
      ...steps,
      {
        id: nextId,
        title: "",
        action: "",
        speechText: "",
        timerSec: 0,
        visualCue: "",
        failPoint: "",
        photoBrief: "",
      },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length === 1) return;
    setSteps(steps.filter((_, idx) => idx !== index));
  };

  // 配图方案操作
  const updateImageShot = (
    index: number,
    field: keyof ImageShot,
    value: string
  ) => {
    const next = [...imageShots];
    const updated = { ...next[index] } as ImageShot;
    updated[field] = value as never;
    next[index] = updated;
    setImageShots(next);
  };

  const addImageShot = () => {
    setImageShots([
      ...imageShots,
      { key: "", imagePrompt: "", ratio: "16:9" },
    ]);
  };

  const removeImageShot = (index: number) => {
    setImageShots(imageShots.filter((_, idx) => idx !== index));
  };

  // 上传图片到当前 shot
  const handleUploadForShot = async (file: File, index: number) => {
    const shot = imageShots[index];
    if (!shot) return;

    setImageUploadLoading((prev) => ({ ...prev, [index]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", shot.key || "recipe");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "上传失败");
      }

      const data = await response.json();
      updateImageShot(index, "imageUrl", data.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "上传失败");
    } finally {
      setImageUploadLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  // 重新生成图片
  const handleRegenerateForShot = async (index: number) => {
    const shot = imageShots[index];
    if (!shot?.imagePrompt) {
      alert("请先填写 AI 提示词");
      return;
    }

    const mapRatio = (ratio?: string) => {
      if (ratio === "16:9") return { width: 1024, height: 576 };
      if (ratio === "4:3") return { width: 1024, height: 768 };
      return { width: 960, height: 640 };
    };

    const { width, height } = mapRatio(shot.ratio);

    setImageGenLoading((prev) => ({ ...prev, [index]: true }));
    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: shot.imagePrompt,
          width,
          height,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "生成失败");
      }

      updateImageShot(index, "imageUrl", data.imageUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : "生成失败");
    } finally {
      setImageGenLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  // 确保为步骤或插图创建对应的 imageShot
  const ensureShot = (key: string, promptHint?: string, ratio: ImageShot["ratio"] = "4:3") => {
    const idx = imageShots.findIndex((s) => s.key === key);
    if (idx >= 0) return idx;
    const next = [...imageShots, { key, imagePrompt: promptHint || "", ratio }];
    setImageShots(next);
    return next.length - 1;
  };

  const handleExportLongImage = async () => {
    if (typeof window === "undefined") return;
    if (exporting) return;
    setExporting(true);

    try {
      const width = 900;
      const padding = 40;
      const maxTextWidth = width - padding * 2;
      const titleText = titleZh || "未命名菜谱";

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        alert("无法生成长图");
        return;
      }

      const wrapLines = (text: string, font: string, lineHeight: number) => {
        ctx.font = font;
        const lines: string[] = [];
        const paragraphs = String(text || "").split("\n");
        for (const paragraph of paragraphs) {
          let line = "";
          for (const char of paragraph) {
            const testLine = line + char;
            if (ctx.measureText(testLine).width > maxTextWidth) {
              if (line) lines.push(line);
              line = char;
            } else {
              line = testLine;
            }
          }
          if (line) lines.push(line);
        }
        return { lines, height: lines.length * lineHeight };
      };

      const titleBlock = wrapLines(titleText, "600 36px serif", 46);
      const summaryBlock = wrapLines(
        `${oneLine}\n${healingTone}`.trim(),
        "16px sans-serif",
        26
      );
      const storyBlock = wrapLines(
        `${storyTitle}\n${storyContent}`.trim(),
        "15px sans-serif",
        24
      );

      const ingredientLines: string[] = [];
      ingredients.forEach((section) => {
        ingredientLines.push(`${section.section}`);
        section.items.forEach((item) => {
          ingredientLines.push(
            `• ${item.name}${item.notes ? `(${item.notes})` : ""} ${item.amount}${item.unit}`
          );
        });
      });
      const ingredientBlock = wrapLines(ingredientLines.join("\n"), "14px sans-serif", 22);

      const stepLines: string[] = [];
      steps.forEach((step, idx) => {
        stepLines.push(`STEP ${String(idx + 1).padStart(2, "0")} ${step.title}`);
        stepLines.push(step.action);
      });
      const stepsBlock = wrapLines(stepLines.join("\n"), "14px sans-serif", 22);

      const coverHeight = coverImage ? 360 : 0;

      const totalHeight =
        padding +
        coverHeight +
        (coverHeight ? 24 : 0) +
        titleBlock.height +
        16 +
        summaryBlock.height +
        20 +
        storyBlock.height +
        20 +
        ingredientBlock.height +
        20 +
        stepsBlock.height +
        padding;

      canvas.width = width;
      canvas.height = Math.max(800, totalHeight);

      ctx.fillStyle = "#F5F1E8";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let y = padding;
      const drawImage = (src: string, height: number) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            ctx.drawImage(img, padding, y, width - padding * 2, height);
            y += height + 24;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = src;
        });

      if (coverImage) {
        await drawImage(coverImage, coverHeight);
      }

      ctx.fillStyle = "#333333";
      ctx.font = "600 36px serif";
      titleBlock.lines.forEach((line, idx) => {
        ctx.fillText(line, padding, y + idx * 46);
      });
      y += titleBlock.height + 16;

      ctx.fillStyle = "#666666";
      ctx.font = "16px sans-serif";
      summaryBlock.lines.forEach((line, idx) => {
        ctx.fillText(line, padding, y + idx * 26);
      });
      y += summaryBlock.height + 20;

      ctx.fillStyle = "#333333";
      ctx.font = "15px sans-serif";
      storyBlock.lines.forEach((line, idx) => {
        ctx.fillText(line, padding, y + idx * 24);
      });
      y += storyBlock.height + 20;

      ctx.fillStyle = "#333333";
      ctx.font = "14px sans-serif";
      ingredientBlock.lines.forEach((line, idx) => {
        ctx.fillText(line, padding, y + idx * 22);
      });
      y += ingredientBlock.height + 20;

      ctx.fillStyle = "#333333";
      ctx.font = "14px sans-serif";
      stepsBlock.lines.forEach((line, idx) => {
        ctx.fillText(line, padding, y + idx * 22);
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          alert("导出失败");
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${titleText}-长图.png`;
        link.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (err) {
      alert("导出失败");
    } finally {
      setExporting(false);
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const submitter = (e.nativeEvent as SubmitEvent).submitter as
      | HTMLButtonElement
      | null;

    // 编辑模式下，保存后状态变为待审核（pending），除非点击的是"发布"按钮
    let status: string;
    if (submitter?.dataset.publish === "true") {
      status = "published";
    } else if (mode === "edit") {
      status = "pending"; // 编辑后变为待审核
    } else {
      status = "draft";
    }

    try {
      const data = {
        schemaVersion: "1.1.0",
        titleZh,
        titleEn,
        slug: slug || undefined,
        summary: {
          oneLine,
          healingTone,
          difficulty,
          timeTotalMin: Number(timeTotalMin) || 0,
          timeActiveMin: Number(timeActiveMin) || 0,
          servings: Number(servings) || 0,
        },
        story: {
          title: storyTitle,
          content: storyContent,
          tags: storyTags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter(Boolean),
        },
        ingredients,
        steps,
        styleGuide,
        imageShots,
        author,
        location: location || undefined,
        cuisine: cuisine || undefined,
        mainIngredients,
        coverImage: coverImage || undefined,
        status, // 使用计算出的状态
        // 标签
        scenes,
        cookingMethods,
        tastes,
        crowds,
        occasions,
      };

      const url =
        mode === "create"
          ? "/api/admin/recipes"
          : `/api/admin/recipes/${initialData?.id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push("/admin/recipes");
      } else {
        const error = await response.json();
        alert(`保存失败: ${error.error}`);
      }
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败，请检查字段内容");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 顶部操作区 */}
      <section className="bg-white rounded-[18px] shadow-card p-6 flex flex-wrap items-center justify-between gap-4 border border-cream">
        <div>
          <h2 className="text-xl font-semibold text-textDark">
            {mode === "create" ? "新建食谱" : "编辑食谱"}
          </h2>
          <p className="text-sm text-textGray mt-1">
            当前状态：{isPublished ? "已发布" : "草稿"}
          </p>
          {mode === "edit" && (
            <p className="text-xs text-amber-600 mt-1">
              编辑保存后将变为待审核状态
            </p>
          )}
        </div>
        <div className="flex gap-3">
          {mode === "edit" && initialData?.id && (
            <a
              href={`/admin/recipes/${initialData.id}/preview`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                type="button"
                variant="outline"
                className="rounded-full px-5"
              >
                预览效果
              </Button>
            </a>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={exporting}
            onClick={handleExportLongImage}
            className="rounded-full px-5"
          >
            {exporting ? "导出中..." : "导出长图"}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-lightGray text-textDark hover:bg-cream rounded-full px-5"
            data-publish="false"
          >
            {loading ? "保存中..." : mode === "edit" ? "保存并提交审核" : "保存草稿"}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-brownWarm hover:bg-brownWarm/90 rounded-full px-6 text-base font-semibold shadow-[0_10px_24px_rgba(0,0,0,0.1)]"
            data-publish="true"
          >
            {loading ? "发布中..." : "发布并返回"}
          </Button>
        </div>
      </section>

      {/* 基本信息 */}
      <section className="bg-white rounded-md shadow-card p-6">
        <h2 className="text-xl font-medium text-textDark mb-4">基本信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              中文标题 *
            </label>
            <Input
              value={titleZh}
              onChange={(e) => setTitleZh(e.target.value)}
              required
              placeholder="例：啤酒鸭"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              英文标题
            </label>
            <Input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="例：Beer Duck"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              URL 别名 (Slug)
            </label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="例：beer-duck（自动生成，可编辑）"
            />
            <p className="text-xs text-textGray mt-1">
              用于 URL 路径，如 /recipe/beer-duck
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              作者
            </label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="例：Recipe Zen Team"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              地点
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例：川渝"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              菜系
            </label>
            <Input
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              placeholder="例：川菜"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              主要食材（逗号分隔）
            </label>
            <Input
              value={mainIngredientsInput}
              onChange={(e) => setMainIngredientsInput(e.target.value)}
              placeholder="例：鸭肉, 啤酒"
            />
          </div>
        </div>
      </section>

      {/* 标签分类 */}
      <section className="bg-white rounded-md shadow-card p-6">
        <h2 className="text-xl font-medium text-textDark mb-4">标签分类</h2>
        <p className="text-sm text-textGray mb-4">
          选择适合的标签，帮助用户更好地发现和筛选食谱
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TagSelector
            type="scenes"
            label="场景"
            selected={scenes}
            onChange={setScenes}
            maxSelect={3}
          />
          <TagSelector
            type="cooking-methods"
            label="烹饪方法"
            selected={cookingMethods}
            onChange={setCookingMethods}
            maxSelect={3}
          />
          <TagSelector
            type="tastes"
            label="口味"
            selected={tastes}
            onChange={setTastes}
            maxSelect={3}
          />
          <TagSelector
            type="crowds"
            label="适宜人群"
            selected={crowds}
            onChange={setCrowds}
          />
          <TagSelector
            type="occasions"
            label="场合"
            selected={occasions}
            onChange={setOccasions}
          />
        </div>
      </section>

      {/* 封面图 */}
      <section className="bg-white rounded-md shadow-card p-6">
        <h2 className="text-xl font-medium text-textDark mb-4">封面图</h2>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-textGray">点击图片可查看大图</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCoverModalOpen(true)}
            >
              更新封面
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCoverPreviewOpen(true)}
            >
              预览大图
            </Button>
          </div>
        </div>
        <div className="mb-4">
          {coverImage ? (
            <img
              src={coverImage}
              alt="封面图"
              className="w-full h-56 md:h-64 object-contain bg-[#F7F3EF] rounded-md border border-lightGray cursor-pointer"
              onClick={() => setCoverPreviewOpen(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-32 rounded-md border border-dashed border-lightGray flex items-center justify-center text-textGray text-sm">
              暂无封面图
            </div>
          )}
        </div>

        {/* 封面图弹窗：上传 / AI 生图 */}
        {coverModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
            <div className="bg-white rounded-[18px] shadow-card w-full max-w-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-textDark">更新封面</h3>
                <button
                  onClick={() => setCoverModalOpen(false)}
                  className="text-textGray hover:text-textDark"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-lightGray rounded-md p-4">
                  <p className="text-sm font-medium text-textDark mb-2">上传图片</p>
                  <ImageUploader
                    category="recipes/cover"
                    onUploadSuccess={(url) => {
                      setCoverImage(url);
                      setCoverModalOpen(false);
                    }}
                  />
                </div>
                <div className="border border-lightGray rounded-md p-4">
                  <p className="text-sm font-medium text-textDark mb-2">AI 生成封面</p>
                  <ImageGenerator
                    recipeName={titleZh}
                    onImageGenerated={(url) => {
                      setCoverImage(url);
                      setCoverModalOpen(false);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 封面大图预览 */}
        {coverPreviewOpen && coverImage && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
            <div className="relative max-w-5xl w-full">
              <img
                src={coverImage}
                alt="封面大图"
                className="w-full h-auto rounded-[18px] shadow-card"
              />
              <button
                onClick={() => setCoverPreviewOpen(false)}
                className="absolute top-4 right-4 bg-white/80 text-textDark rounded-full px-3 py-1 shadow-card"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 摘要信息 */}
      <section className="bg-white rounded-md shadow-card p-6">
        <h2 className="text-xl font-medium text-textDark mb-4">摘要信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-textDark mb-2">
              一句话简介
            </label>
            <Input
              value={oneLine}
              onChange={(e) => setOneLine(e.target.value)}
              placeholder="例：麦香与肉脂的微醺共舞"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-textDark mb-2">
              治愈文案
            </label>
            <Input
              value={healingTone}
              onChange={(e) => setHealingTone(e.target.value)}
              placeholder="例：家的味道，总在啤酒香里藏着"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              难度
            </label>
            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as "easy" | "medium" | "hard")
              }
              className="w-full px-3 py-2 border border-lightGray rounded-sm"
            >
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              总耗时（分钟）
            </label>
            <Input
              type="number"
              value={timeTotalMin}
              onChange={(e) => setTimeTotalMin(e.target.value)}
              placeholder="例：60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              操作时间（分钟）
            </label>
            <Input
              type="number"
              value={timeActiveMin}
              onChange={(e) => setTimeActiveMin(e.target.value)}
              placeholder="例：30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              基准份量
            </label>
            <Input
              type="number"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              placeholder="例：3"
            />
          </div>
        </div>
      </section>

      {/* 文化故事 */}
      <section className="bg-white rounded-md shadow-card p-6">
        <h2 className="text-xl font-medium text-textDark mb-4">文化故事</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              故事标题
            </label>
            <Input
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              placeholder="例：啤酒鸭的前世今生"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              标签（逗号分隔）
            </label>
            <Input
              value={storyTags}
              onChange={(e) => setStoryTags(e.target.value)}
              placeholder="例：家常菜, 川菜, 文化故事"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              故事内容
            </label>
            <textarea
              value={storyContent}
              onChange={(e) => setStoryContent(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-lightGray rounded-sm"
              placeholder="输入文化故事..."
            />
          </div>
        </div>
      </section>

      {/* 食材清单 */}
      <section className="bg-white rounded-md shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-textDark">食材清单</h2>
          <Button type="button" variant="outline" onClick={addIngredientSection}>
            + 新增分组
          </Button>
        </div>

        <div className="space-y-6">
          {ingredients.map((section, sectionIndex) => (
            <div key={sectionIndex} className="border border-lightGray rounded-md p-4">
              <div className="flex items-center justify-between mb-4 gap-3">
                <Input
                  value={section.section}
                  onChange={(e) => updateSectionTitle(sectionIndex, e.target.value)}
                  placeholder="分组名称（例：主料）"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeIngredientSection(sectionIndex)}
                >
                  删除分组
                </Button>
              </div>

              <div className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center"
                  >
                    <Input
                      value={item.name}
                      onChange={(e) =>
                        updateIngredientItem(sectionIndex, itemIndex, "name", e.target.value)
                      }
                      placeholder="食材名称"
                    />
                    <select
                      value={item.iconKey}
                      onChange={(e) =>
                        updateIngredientItem(sectionIndex, itemIndex, "iconKey", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-lightGray rounded-sm"
                    >
                      <option value="meat">肉类</option>
                      <option value="veg">蔬菜</option>
                      <option value="fruit">水果</option>
                      <option value="seafood">海鲜</option>
                      <option value="grain">谷物</option>
                      <option value="bean">豆类</option>
                      <option value="dairy">乳制品</option>
                      <option value="egg">蛋类</option>
                      <option value="spice">香料</option>
                      <option value="sauce">酱料</option>
                      <option value="oil">油脂</option>
                      <option value="other">其他</option>
                    </select>
                    <Input
                      type="number"
                      value={item.amount}
                      onChange={(e) =>
                        updateIngredientItem(sectionIndex, itemIndex, "amount", e.target.value)
                      }
                      placeholder="数量"
                    />
                    <Input
                      value={item.unit}
                      onChange={(e) =>
                        updateIngredientItem(sectionIndex, itemIndex, "unit", e.target.value)
                      }
                      placeholder="单位"
                    />
                    <Input
                      value={item.notes || ""}
                      onChange={(e) =>
                        updateIngredientItem(sectionIndex, itemIndex, "notes", e.target.value)
                      }
                      placeholder="备注"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeIngredientItem(sectionIndex, itemIndex)}
                    >
                      删除
                    </Button>
                  </div>
                ))}
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addIngredientItem(sectionIndex)}
                  >
                    + 新增食材
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 制作步骤 */}
      <section className="bg-white rounded-md shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-textDark">制作步骤</h2>
          <Button type="button" variant="outline" onClick={addStep}>
            + 新增步骤
          </Button>
        </div>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className="border border-lightGray rounded-md p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-textGray">步骤 {index + 1}</span>
                <Button type="button" variant="outline" onClick={() => removeStep(index)}>
                  删除步骤
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  value={step.id}
                  onChange={(e) => updateStepField(index, "id", e.target.value)}
                  placeholder="步骤 ID（例：step01）"
                />
                <Input
                  value={step.title}
                  onChange={(e) => updateStepField(index, "title", e.target.value)}
                  placeholder="步骤标题"
                />
                <Input
                  value={step.speechText}
                  onChange={(e) => updateStepField(index, "speechText", e.target.value)}
                  placeholder="语音朗读文本"
                />
                <Input
                  type="number"
                  value={step.timerSec}
                  onChange={(e) => updateStepField(index, "timerSec", e.target.value)}
                  placeholder="计时秒数"
                />
                <Input
                  value={step.visualCue}
                  onChange={(e) => updateStepField(index, "visualCue", e.target.value)}
                  placeholder="视觉检查"
                />
                <Input
                  value={step.failPoint}
                  onChange={(e) => updateStepField(index, "failPoint", e.target.value)}
                  placeholder="失败点提示"
                />
                <Input
                  value={step.photoBrief}
                  onChange={(e) => updateStepField(index, "photoBrief", e.target.value)}
                  placeholder="配图说明"
                />
                <Input
                  value={step.imageUrl || ""}
                  onChange={(e) => updateStepField(index, "imageUrl", e.target.value)}
                  placeholder="操作图 URL（可选）"
                />
              </div>
              <div className="mt-4">
                <textarea
                  value={step.action}
                  onChange={(e) => updateStepField(index, "action", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-lightGray rounded-sm"
                  placeholder="详细操作描述"
                />
              </div>
              <div className="mt-4">
                <p className="text-xs text-textGray mb-2">
                  操作图预览（优先使用步骤内图片，若为空则使用配图方案 key={step.id}）
                </p>
                {step.imageUrl || stepImageMap[step.id] ? (
                  <img
                    src={step.imageUrl || stepImageMap[step.id]}
                    alt={`${step.title || step.id} 操作图`}
                    className="w-full max-h-64 object-contain bg-[#F7F3EF] rounded-md border border-lightGray"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-32 rounded-md border border-dashed border-lightGray flex items-center justify-center text-textGray text-sm">
                    暂无操作图
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 风格指南 */}
      <section className="bg-white rounded-md shadow-card p-6">
        <h2 className="text-xl font-medium text-textDark mb-4">风格指南</h2>
        <textarea
          value={`${styleGuide.theme || ""}\n${styleGuide.lighting || ""}\n${styleGuide.composition || ""}\n${styleGuide.aesthetic || ""}`.trim()}
          onChange={(e) => {
            const lines = e.target.value.split("\n");
            setStyleGuide({
              theme: lines[0] || "",
              lighting: lines[1] || "",
              composition: lines[2] || "",
              aesthetic: lines[3] || "",
            });
          }}
          rows={4}
          className="w-full px-3 py-2 border border-lightGray rounded-sm"
          placeholder={"主题\n光线\n构图\n美学风格"}
        />
      </section>

      {/* 配图方案 */}
      <section className="bg-white rounded-md shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-textDark">配图方案</h2>
          <Button type="button" variant="outline" onClick={addImageShot}>
            + 新增配图
          </Button>
        </div>

        <div className="space-y-4">
      {imageShots.map((shot, index) => (
        <div key={index} className="border border-lightGray rounded-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center mb-3">
            <Input
              value={shot.key}
              onChange={(e) => updateImageShot(index, "key", e.target.value)}
              placeholder="key (hero/step01)"
            />
            <Input
              value={shot.imagePrompt}
              onChange={(e) => updateImageShot(index, "imagePrompt", e.target.value)}
              placeholder="AI 提示词"
            />
            <select
              value={shot.ratio}
              onChange={(e) => updateImageShot(index, "ratio", e.target.value)}
              className="w-full px-3 py-2 border border-lightGray rounded-sm"
            >
              <option value="16:9">16:9</option>
              <option value="4:3">4:3</option>
              <option value="3:2">3:2</option>
            </select>
            <Button type="button" variant="outline" onClick={() => removeImageShot(index)}>
              删除
            </Button>
          </div>
              <div>
                <label className="text-xs text-textGray mb-1 block">图片 URL</label>
                <div className="flex flex-wrap gap-2 items-center">
                  <Input
                    value={shot.imageUrl || ""}
                    onChange={(e) => updateImageShot(index, "imageUrl", e.target.value)}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  {shot.imageUrl && (
                    <a 
                      href={shot.imageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-brownWarm hover:underline text-sm whitespace-nowrap"
                    >
                      预览
                    </a>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!!imageUploadLoading[index]}
                  >
                    <label htmlFor={`upload-shot-${index}`} className="cursor-pointer">
                      {imageUploadLoading[index] ? "上传中..." : "上传图片"}
                    </label>
                    <input
                      id={`upload-shot-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadForShot(file, index);
                      }}
                    />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!!imageGenLoading[index]}
                    onClick={() => handleRegenerateForShot(index)}
                  >
                    {imageGenLoading[index] ? "生成中..." : "重新生成"}
                  </Button>
                  {shot.imageUrl && (
                    <div className="w-full mt-3">
                      <img
                        src={shot.imageUrl}
                        alt={shot.key}
                        className="w-full h-52 object-contain bg-[#F7F3EF] rounded-md border border-lightGray"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 底部操作 */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          返回
        </Button>
      </div>
    </form>
  );
}
