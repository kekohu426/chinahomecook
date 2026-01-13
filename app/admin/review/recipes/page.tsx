/**
 * 菜谱审核工作台
 *
 * 路由：/admin/review/recipes
 * 按设计图实现：卡片式展示、5维质量分析、快速预览、批量操作
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  Check,
  X,
  AlertTriangle,
  Clock,
  ChevronDown,
  FileText,
  Utensils,
  ListOrdered,
} from "lucide-react";

interface QualityScores {
  content: number;      // 内容质量
  seo: number;          // SEO分数
  readability: number;  // 可读性
  originality: number;  // 原创度
  accuracy: number;     // 准确性
  overall: number;      // 综合分
}

interface Recipe {
  id: string;
  title: string;
  slug: string;
  status: string;
  reviewStatus: string;
  coverImage: string | null;
  createdAt: string;
  cuisine: { id: string; name: string } | null;
  location: { id: string; name: string } | null;
  description: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  ingredients: any[];
  steps: any[];
  qualityScores?: QualityScores;
}

type QualityFilter = "all" | "high" | "medium" | "low";
type SortOption = "createdAt" | "quality";

// 质量等级定义
const QUALITY_THRESHOLDS = {
  high: 0.85,
  medium: 0.70,
};

// 模拟质量评分（实际应从后端获取）
function generateQualityScores(): QualityScores {
  const content = 0.7 + Math.random() * 0.3;
  const seo = 0.7 + Math.random() * 0.3;
  const readability = 0.7 + Math.random() * 0.3;
  const originality = 0.7 + Math.random() * 0.3;
  const accuracy = 0.7 + Math.random() * 0.3;
  const overall = (content + seo + readability + originality + accuracy) / 5;
  return { content, seo, readability, originality, accuracy, overall };
}

// 获取质量等级
function getQualityLevel(score: number): "high" | "medium" | "low" {
  if (score >= QUALITY_THRESHOLDS.high) return "high";
  if (score >= QUALITY_THRESHOLDS.medium) return "medium";
  return "low";
}

// 质量分数条
function QualityBar({ label, score, showWarning = false }: { label: string; score: number; showWarning?: boolean }) {
  const percentage = Math.round(score * 100);
  const isLow = score < 0.85;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-20 ${isLow && showWarning ? "text-amber-600 font-medium" : "text-textGray"}`}>
        {isLow && showWarning && <AlertTriangle className="w-3 h-3 inline mr-1" />}
        {label}:
      </span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            score >= 0.9 ? "bg-green-500" : score >= 0.85 ? "bg-green-400" : score >= 0.7 ? "bg-amber-400" : "bg-red-400"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`w-12 text-right ${isLow && showWarning ? "text-amber-600" : "text-textGray"}`}>
        {score.toFixed(2)}
      </span>
    </div>
  );
}

// 菜谱卡片组件
function RecipeCard({
  recipe,
  isSelected,
  onSelect,
  onPreview,
  onApprove,
  onReject,
}: {
  recipe: Recipe;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const scores = recipe.qualityScores || generateQualityScores();
  const qualityLevel = getQualityLevel(scores.overall);
  const timeSince = getTimeSince(recipe.createdAt);

  return (
    <div className={`bg-white rounded-lg shadow-card border-2 transition-all ${
      isSelected ? "border-blue-400 bg-blue-50/30" : "border-transparent hover:border-sage-200"
    }`}>
      {/* 卡片头部 */}
      <div className="p-4 border-b border-sage-100">
        <div className="flex gap-4">
          {/* 选择框 + 封面图 */}
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
            <div className="w-24 h-24 bg-sage-100 rounded-lg overflow-hidden flex-shrink-0">
              {recipe.coverImage ? (
                <img
                  src={recipe.coverImage}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sage-400">
                  <Utensils className="w-8 h-8" />
                </div>
              )}
            </div>
          </div>

          {/* 基本信息 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-textDark text-lg mb-1 truncate">
              {recipe.title}
            </h3>
            <div className="flex items-center gap-3 text-sm text-textGray mb-2">
              {recipe.cuisine && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                  {recipe.cuisine.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeSince}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-textGray">AI质量分:</span>
              <span className={`font-bold ${
                qualityLevel === "high" ? "text-green-600" : qualityLevel === "medium" ? "text-amber-600" : "text-red-600"
              }`}>
                {scores.overall.toFixed(2)}
              </span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-4 rounded-sm ${
                      i <= Math.round(scores.overall * 5)
                        ? qualityLevel === "high" ? "bg-green-500" : qualityLevel === "medium" ? "bg-amber-500" : "bg-red-500"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 质量分析 */}
      <div className="p-4 border-b border-sage-100">
        <h4 className="text-sm font-medium text-textDark mb-3">质量分析:</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <QualityBar label="内容质量" score={scores.content} />
          <QualityBar label="SEO分数" score={scores.seo} />
          <QualityBar label="可读性" score={scores.readability} showWarning={scores.readability < 0.85} />
          <QualityBar label="原创度" score={scores.originality} showWarning={scores.originality < 0.85} />
          <QualityBar label="准确性" score={scores.accuracy} />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="p-4 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          className="flex items-center gap-1"
        >
          <Eye className="w-4 h-4" />
          快速预览
        </Button>
        <Button
          size="sm"
          onClick={onApprove}
          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="w-4 h-4" />
          通过
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 text-amber-600 border-amber-300 hover:bg-amber-50"
        >
          修改后通过
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onReject}
          className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50"
        >
          <X className="w-4 h-4" />
          拒绝
        </Button>
      </div>
    </div>
  );
}

// 快速预览弹窗
function PreviewModal({
  recipe,
  onClose,
  onApprove,
  onReject,
}: {
  recipe: Recipe;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-textDark">
            {recipe.title} - 快速预览
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 弹窗内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 成品图 */}
          <div className="w-full aspect-video bg-sage-100 rounded-lg overflow-hidden mb-6">
            {recipe.coverImage ? (
              <img
                src={recipe.coverImage}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sage-400">
                [成品图]
              </div>
            )}
          </div>

          {/* 一句话简介 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-textGray mb-1">
              <FileText className="w-4 h-4" />
              一句话:
            </div>
            <p className="text-textDark">
              {recipe.description || "经典川菜，麻辣鲜香..."}
            </p>
          </div>

          {/* 食材 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-textGray mb-1">
              <Utensils className="w-4 h-4" />
              食材:
            </div>
            <p className="text-textDark">
              {recipe.ingredients?.length > 0
                ? recipe.ingredients.slice(0, 5).map((i: any) => `${i.name} ${i.amount || ""}`).join(", ") + "..."
                : "鸡胸肉 300g, 花生米 50g, 干辣椒 10个..."}
            </p>
          </div>

          {/* 步骤 */}
          <div>
            <div className="flex items-center gap-2 text-sm text-textGray mb-2">
              <ListOrdered className="w-4 h-4" />
              步骤:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-textDark">
              {recipe.steps?.length > 0 ? (
                recipe.steps.slice(0, 3).map((step: any, index: number) => (
                  <li key={index} className="truncate">
                    {step.description || step.content || `步骤 ${index + 1}`}
                  </li>
                ))
              ) : (
                <>
                  <li>鸡肉切丁，腌制...</li>
                  <li>热锅凉油...</li>
                </>
              )}
              {(recipe.steps?.length || 0) > 3 && (
                <li className="text-textGray">...</li>
              )}
            </ol>
          </div>
        </div>

        {/* 弹窗底部 */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center gap-3">
          <Link href={`/recipe/${recipe.id}`}>
            <Button variant="outline">查看完整内容</Button>
          </Link>
          <div className="flex-1" />
          <Button
            onClick={onApprove}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="w-4 h-4 mr-1" />
            通过
          </Button>
          <Button
            variant="outline"
            onClick={onReject}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            拒绝
          </Button>
        </div>
      </div>
    </div>
  );
}

// 时间格式化
function getTimeSince(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `${diffMins}分钟前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}天前`;
}

export default function ReviewPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("createdAt");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  // 加载待审核菜谱
  const loadPendingRecipes = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/review");
      const data = await response.json();

      if (data.success) {
        // 为每个菜谱生成质量分数（实际应从后端获取）
        const recipesWithScores = data.data.map((recipe: Recipe) => ({
          ...recipe,
          qualityScores: generateQualityScores(),
        }));
        setRecipes(recipesWithScores);
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.error("加载待审核菜谱失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingRecipes();
  }, []);

  // 按质量等级筛选
  const filteredRecipes = useMemo(() => {
    let filtered = [...recipes];

    // 质量筛选
    if (qualityFilter !== "all") {
      filtered = filtered.filter((recipe) => {
        const level = getQualityLevel(recipe.qualityScores?.overall || 0);
        return level === qualityFilter;
      });
    }

    // 排序
    filtered.sort((a, b) => {
      if (sortOption === "quality") {
        return (b.qualityScores?.overall || 0) - (a.qualityScores?.overall || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;
  }, [recipes, qualityFilter, sortOption]);

  // 统计各质量等级数量
  const qualityCounts = useMemo(() => {
    const counts = { all: recipes.length, high: 0, medium: 0, low: 0 };
    recipes.forEach((recipe) => {
      const level = getQualityLevel(recipe.qualityScores?.overall || 0);
      counts[level]++;
    });
    return counts;
  }, [recipes]);

  // 切换选择
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 全选
  const selectAll = () => {
    if (selectedIds.size === filteredRecipes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecipes.map((r) => r.id)));
    }
  };

  // 审核通过
  const handleApprove = async (id: string) => {
    try {
      const response = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          recipeId: id,
          autoTranslate: true,
        }),
      });
      const data = await response.json();
      console.log("审核响应:", data); // 添加调试日志
      if (data.success) {
        loadPendingRecipes();
        setPreviewRecipe(null);
      } else {
        alert(data.error || data.message || "操作失败");
      }
    } catch (error) {
      console.error("审核失败:", error);
      alert("审核失败: " + (error instanceof Error ? error.message : "未知错误"));
    }
  };

  // 审核拒绝
  const handleReject = async (id: string) => {
    const reason = prompt("请输入拒绝原因（可选）:");
    if (reason === null) return;

    try {
      const response = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          recipeId: id,
          note: reason || undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        loadPendingRecipes();
        setPreviewRecipe(null);
      } else {
        alert(data.error || "操作失败");
      }
    } catch (error) {
      console.error("拒绝失败:", error);
      alert("拒绝失败");
    }
  };

  // 批量通过
  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要通过选中的 ${selectedIds.size} 个菜谱吗？`)) return;

    setBatchLoading(true);
    try {
      const response = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_approve",
          recipeIds: Array.from(selectedIds),
          autoTranslate: true,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message || "批量通过成功");
        loadPendingRecipes();
      } else {
        alert(data.error || "操作失败");
      }
    } catch (error) {
      console.error("批量通过失败:", error);
      alert("批量通过失败");
    } finally {
      setBatchLoading(false);
    }
  };

  // 批量拒绝
  const handleBatchReject = async () => {
    if (selectedIds.size === 0) return;
    const reason = prompt(`请输入拒绝 ${selectedIds.size} 个菜谱的原因（可选）:`);
    if (reason === null) return;

    setBatchLoading(true);
    try {
      const response = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_reject",
          recipeIds: Array.from(selectedIds),
          note: reason || undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message || "批量拒绝成功");
        loadPendingRecipes();
      } else {
        alert(data.error || "操作失败");
      }
    } catch (error) {
      console.error("批量拒绝失败:", error);
      alert("批量拒绝失败");
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div>
      {/* 页头 */}
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-medium text-textDark mb-2">
          审核工作台
        </h1>
        <p className="text-textGray">快速审核AI生成的菜谱，确保内容质量</p>
      </div>

      {/* 质量筛选 Tab + 排序 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 bg-sage-100 rounded-lg p-1">
          {[
            { key: "all", label: "全部" },
            { key: "high", label: "高质量" },
            { key: "medium", label: "中等质量" },
            { key: "low", label: "低质量" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setQualityFilter(key as QualityFilter)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                qualityFilter === key
                  ? "bg-white text-textDark shadow-sm"
                  : "text-textGray hover:text-textDark"
              }`}
            >
              {label}({qualityCounts[key as keyof typeof qualityCounts]})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-textGray">排序:</span>
          <button
            onClick={() => setSortOption(sortOption === "createdAt" ? "quality" : "createdAt")}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-sage-200 rounded-lg hover:bg-sage-50"
          >
            {sortOption === "createdAt" ? "创建时间" : "质量分数"}
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 待审核统计 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
        <span className="text-amber-800 font-medium">
          待审核菜谱: {filteredRecipes.length} 道
        </span>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 flex items-center gap-4">
          <span className="text-blue-700 font-medium">
            已选中 {selectedIds.size} 道菜谱
          </span>
          <div className="flex-1" />
          <Button
            size="sm"
            onClick={handleBatchApprove}
            disabled={batchLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            批量通过
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBatchReject}
            disabled={batchLoading}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            批量拒绝
          </Button>
        </div>
      )}

      {/* 菜谱卡片列表 */}
      {loading ? (
        <div className="text-center py-12 text-textGray">加载中...</div>
      ) : filteredRecipes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <p className="text-textGray">暂无待审核的菜谱</p>
          <Link href="/admin/generate" className="text-brownWarm hover:underline mt-2 inline-block">
            去生成新菜谱 →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 全选按钮 */}
          <div className="flex items-center gap-2 mb-2">
            <Checkbox
              checked={selectedIds.size === filteredRecipes.length && filteredRecipes.length > 0}
              onCheckedChange={selectAll}
            />
            <span className="text-sm text-textGray">全选</span>
          </div>

          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isSelected={selectedIds.has(recipe.id)}
              onSelect={() => toggleSelect(recipe.id)}
              onPreview={() => setPreviewRecipe(recipe)}
              onApprove={() => handleApprove(recipe.id)}
              onReject={() => handleReject(recipe.id)}
            />
          ))}
        </div>
      )}

      {/* 快速预览弹窗 */}
      {previewRecipe && (
        <PreviewModal
          recipe={previewRecipe}
          onClose={() => setPreviewRecipe(null)}
          onApprove={() => handleApprove(previewRecipe.id)}
          onReject={() => handleReject(previewRecipe.id)}
        />
      )}
    </div>
  );
}
