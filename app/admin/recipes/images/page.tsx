/**
 * 后台管理 - 食谱图片管理
 *
 * 路由：/admin/recipes/images
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PAGE_SIZE = 10;

type Ratio = "16:9" | "4:3" | "3:2";

interface ImageShot {
  key?: string;
  imagePrompt?: string;
  ratio?: Ratio;
  imageUrl?: string | null;
}

interface StepItem {
  id?: string;
  title?: string;
  photoBrief?: string;
}

interface RecipeImageRow {
  id: string;
  titleZh: string;
  slug: string;
  coverImage?: string | null;
  imageShots: ImageShot[];
  steps: StepItem[];
  updatedAt: string;
}

export default function RecipeImagesPage() {
  const [recipes, setRecipes] = useState<RecipeImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});

  const listAbortRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    listAbortRef.current?.abort();
    const controller = new AbortController();
    listAbortRef.current = controller;

    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", PAGE_SIZE.toString());
      if (debouncedSearch) params.append("search", debouncedSearch);

      const response = await fetch(`/api/admin/recipes/images?${params}`, {
        signal: controller.signal,
      });
      const data = await response.json();

      if (data.success) {
        const rows = (data.data || []).map((item: RecipeImageRow) => ({
          ...item,
          imageShots: Array.isArray(item.imageShots) ? item.imageShots : [],
          steps: Array.isArray(item.steps) ? item.steps : [],
        }));
        setRecipes(rows);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      console.error("加载食谱图片失败:", error);
    } finally {
      if (listAbortRef.current === controller) {
        setLoading(false);
      }
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    loadRecipes();

    return () => {
      listAbortRef.current?.abort();
    };
  }, [loadRecipes]);

  const updateRecipe = useCallback((id: string, updater: (prev: RecipeImageRow) => RecipeImageRow) => {
    setRecipes((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  }, []);

  const updateShot = (
    recipeId: string,
    index: number,
    field: keyof ImageShot,
    value: string
  ) => {
    updateRecipe(recipeId, (prev) => {
      const nextShots = [...prev.imageShots];
      const current = nextShots[index] || {};
      nextShots[index] = { ...current, [field]: value };
      return { ...prev, imageShots: nextShots };
    });
  };

  const updateCover = (recipeId: string, value: string) => {
    updateRecipe(recipeId, (prev) => ({ ...prev, coverImage: value }));
  };

  const normalizeKey = (value?: string) => String(value || "").trim().toLowerCase();

  const buildStepKey = (step: StepItem, index: number) => {
    const rawId = normalizeKey(step.id);
    if (rawId) return rawId;
    const digits = String(index + 1).padStart(2, "0");
    return `step${digits}`;
  };

  const hasShotForStep = (recipe: RecipeImageRow, stepKey: string) =>
    recipe.imageShots.some((shot) => normalizeKey(shot.key) === normalizeKey(stepKey));

  const addShotForStep = (recipeId: string, step: StepItem, index: number) => {
    updateRecipe(recipeId, (prev) => {
      const stepKey = buildStepKey(step, index);
      if (hasShotForStep(prev, stepKey)) return prev;
      const nextShots = [
        ...prev.imageShots,
        {
          key: stepKey,
          imagePrompt: step.photoBrief || "",
          ratio: "4:3" as Ratio,
        },
      ];
      return { ...prev, imageShots: nextShots };
    });
  };

  const handleUploadForShot = async (
    recipe: RecipeImageRow,
    index: number,
    file: File
  ) => {
    const key = `${recipe.id}:${index}`;
    setUploading((prev) => ({ ...prev, [key]: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", recipe.slug || "recipe");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "上传失败");
      }

      const data = await response.json();
      updateShot(recipe.id, index, "imageUrl", data.url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleGenerateForShot = async (recipeId: string, index: number) => {
    const recipe = recipes.find((item) => item.id === recipeId);
    const shot = recipe?.imageShots[index];
    if (!shot?.imagePrompt) {
      alert("请先填写 AI 提示词");
      return;
    }

    const key = `${recipeId}:${index}`;
    setGenerating((prev) => ({ ...prev, [key]: true }));

    const ratio = shot.ratio || "4:3";
    const size = ratio === "16:9"
      ? { width: 1024, height: 576 }
      : ratio === "4:3"
        ? { width: 1024, height: 768 }
        : { width: 960, height: 640 };

    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: shot.imagePrompt,
          width: size.width,
          height: size.height,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "生成失败");
      }
      updateShot(recipeId, index, "imageUrl", data.imageUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : "生成失败");
    } finally {
      setGenerating((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSave = async (recipe: RecipeImageRow) => {
    setSavingIds((prev) => new Set(prev).add(recipe.id));

    try {
      const response = await fetch(`/api/admin/recipes/images/${recipe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageShots: recipe.imageShots,
          coverImage: recipe.coverImage,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "保存失败");
      }

      updateRecipe(recipe.id, (prev) => ({
        ...prev,
        imageShots: Array.isArray(data.data.imageShots) ? data.data.imageShots : prev.imageShots,
        coverImage: data.data.coverImage ?? prev.coverImage,
        updatedAt: data.data.updatedAt || prev.updatedAt,
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(recipe.id);
        return next;
      });
    }
  };

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const totalLabel = useMemo(() => {
    if (!total) return "暂无数据";
    return `共 ${total} 条`;
  }, [total]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-medium text-textDark">
            食谱图片管理
          </h1>
          <p className="text-sm text-textGray mt-2">
            查看提示词与图片效果，支持上传或重新生成配图。
          </p>
        </div>
        <div className="text-sm text-textGray">{totalLabel}</div>
      </div>

      <div className="bg-white rounded-md shadow-card p-4 flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索标题或 slug"
          className="w-64"
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!canPrev}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            上一页
          </Button>
          <span className="text-sm text-textGray">第 {page} / {totalPages} 页</span>
          <Button
            type="button"
            variant="outline"
            disabled={!canNext}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            下一页
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-textGray">加载中...</div>
      ) : recipes.length === 0 ? (
        <div className="text-sm text-textGray">暂无符合条件的食谱</div>
      ) : (
        <div className="space-y-6">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="bg-white rounded-[18px] shadow-card p-6 border border-cream">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-lg font-semibold text-textDark">{recipe.titleZh}</div>
                  <div className="text-xs text-textGray">/{recipe.slug}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/recipes/${recipe.id}/edit`}
                    className="text-sm text-brownWarm hover:underline"
                  >
                    打开食谱编辑
                  </Link>
                  <Button
                    type="button"
                    className="rounded-full px-5"
                    onClick={() => handleSave(recipe)}
                    disabled={savingIds.has(recipe.id)}
                  >
                    {savingIds.has(recipe.id) ? "保存中..." : "保存修改"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="text-xs text-textGray mb-1 block">封面图 URL</label>
                  <Input
                    value={recipe.coverImage || ""}
                    onChange={(e) => updateCover(recipe.id, e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center justify-center bg-lightGray/30 rounded-md border border-lightGray min-h-[140px]">
                  {recipe.coverImage ? (
                    <img
                      src={recipe.coverImage}
                      alt={recipe.titleZh}
                      className="w-full h-[140px] object-cover rounded-md"
                    />
                  ) : (
                    <span className="text-xs text-textGray">暂无封面</span>
                  )}
                </div>
              </div>

              {recipe.steps.length > 0 && (
                <div className="bg-lightGray/20 rounded-md border border-lightGray p-4 mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="text-sm font-medium text-textDark">步骤图快速补齐</div>
                    <div className="text-xs text-textGray">
                      点击“添加”会生成对应的配图条目（key=stepxx）
                    </div>
                  </div>
                  <div className="space-y-2">
                    {recipe.steps.map((step, index) => {
                      const stepKey = buildStepKey(step, index);
                      const exists = hasShotForStep(recipe, stepKey);
                      return (
                        <div
                          key={`${recipe.id}-step-${index}`}
                          className="flex flex-wrap items-center gap-3 bg-white/80 rounded-md px-3 py-2 border border-lightGray"
                        >
                          <div className="text-xs text-textGray w-16">{stepKey}</div>
                          <div className="text-sm text-textDark flex-1">
                            {step.title || step.photoBrief || "未填写步骤说明"}
                          </div>
                          <div className="text-xs text-textGray flex-1">
                            {step.photoBrief || "暂无 photoBrief"}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={exists}
                            onClick={() => addShotForStep(recipe.id, step, index)}
                          >
                            {exists ? "已存在" : "添加"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {recipe.imageShots.map((shot, index) => {
                  const key = `${recipe.id}:${index}`;
                  const ratio = shot.ratio || "4:3";

                  return (
                    <div key={key} className="border border-lightGray rounded-md p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
                        <Input
                          value={shot.key || ""}
                          onChange={(e) => updateShot(recipe.id, index, "key", e.target.value)}
                          placeholder="key (hero/step01)"
                          className="md:col-span-2"
                        />
                        <select
                          value={ratio}
                          onChange={(e) => updateShot(recipe.id, index, "ratio", e.target.value)}
                          className="w-full px-3 py-2 border border-lightGray rounded-sm md:col-span-1"
                        >
                          <option value="16:9">16:9</option>
                          <option value="4:3">4:3</option>
                          <option value="3:2">3:2</option>
                        </select>
                        <div className="md:col-span-3 flex gap-2">
                          <Input
                            value={shot.imageUrl || ""}
                            onChange={(e) => updateShot(recipe.id, index, "imageUrl", e.target.value)}
                            placeholder="图片 URL"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!shot.imageUrl}
                            onClick={() => {
                              if (shot.imageUrl) updateCover(recipe.id, shot.imageUrl);
                            }}
                          >
                            设为封面
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-start">
                        <div className="md:col-span-4">
                          <label className="text-xs text-textGray mb-1 block">AI 提示词</label>
                          <Textarea
                            value={shot.imagePrompt || ""}
                            onChange={(e) => updateShot(recipe.id, index, "imagePrompt", e.target.value)}
                            rows={3}
                            placeholder="填写英文提示词"
                          />
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!!uploading[key]}
                            >
                              <label htmlFor={`upload-${key}`} className="cursor-pointer">
                                {uploading[key] ? "上传中..." : "上传图片"}
                              </label>
                              <input
                                id={`upload-${key}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadForShot(recipe, index, file);
                                }}
                              />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!!generating[key]}
                              onClick={() => handleGenerateForShot(recipe.id, index)}
                            >
                              {generating[key] ? "生成中..." : "重新生成"}
                            </Button>
                            {shot.imageUrl && (
                              <a
                                href={shot.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-brownWarm hover:underline"
                              >
                                预览原图
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="bg-lightGray/30 rounded-md border border-lightGray h-[160px] flex items-center justify-center overflow-hidden">
                            {shot.imageUrl ? (
                              <img
                                src={shot.imageUrl}
                                alt={shot.key || `shot-${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-textGray">暂无图片</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
