/**
 * 二级聚合页编辑器
 *
 * 路由: /admin/collections/[id]
 * 功能: 编辑聚合页的基本信息、匹配规则、内容管理、SEO设置
 *
 * 核心口径：
 * 1. 达标：publishedCount >= minRequired（pending 不计入）
 * 2. 进度：progress = publishedCount / targetCount * 100
 * 3. 详情页使用实时统计
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Save,
  Settings,
  Filter,
  FileText,
  Search,
  CheckCircle,
  AlertCircle,
  GripVertical,
  Loader2,
  RefreshCw,
  Link2,
  Upload,
  X,
  Sparkles,
} from "lucide-react";
import type { CollectionDetail } from "@/lib/types/collection-api";
import {
  CollectionTypeLabel,
  CollectionStatusLabel,
  getQualifiedStatusInfo,
  calculateProgress,
} from "@/lib/types/collection";
import RulesTab from "@/components/admin/RulesTab";
import AIGenerateTab from "@/components/admin/AIGenerateTab";

interface MatchedRecipe {
  id: string;
  title: string;
  titleZh?: string;
  coverImage: string | null;
  status: string;
  isPinned: boolean;
  isExcluded: boolean;
  pinnedOrder?: number;
}

const STATUS_OPTIONS = [
  { value: "draft", label: "草稿" },
  { value: "published", label: "已发布" },
  { value: "archived", label: "已归档" },
];

type TabType = "basic" | "rules" | "content" | "ai" | "seo";

export default function CollectionEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [recipes, setRecipes] = useState<MatchedRecipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generatingSeo, setGeneratingSeo] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    slug: "",
    description: "",
    descriptionEn: "",
    coverImage: "",
    status: "draft",
    isFeatured: false,
    minRequired: 20,
    targetCount: 60,
    sortOrder: 0,
  });

  // SEO 表单状态
  const [seoData, setSeoData] = useState({
    titleZh: "",
    titleEn: "",
    descriptionZh: "",
    descriptionEn: "",
    keywords: [] as string[],
    h1Zh: "",
    h1En: "",
    subtitleZh: "",
    subtitleEn: "",
    footerTextZh: "",
    footerTextEn: "",
    schemaType: "CollectionPage" as "CollectionPage" | "ItemList" | "WebPage",
    noIndex: false,
    sitemapPriority: 0.7,
    changeFreq: "weekly" as "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never",
  });

  const loadCollection = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/collections/${id}`);
      const data = await response.json();
      if (data.success) {
        const c = data.data as CollectionDetail;
        setCollection(c);
        setFormData({
          name: c.name,
          nameEn: c.nameEn || "",
          slug: c.slug,
          description: c.description || "",
          descriptionEn: c.descriptionEn || "",
          coverImage: c.coverImage || "",
          status: c.status,
          isFeatured: c.isFeatured,
          minRequired: c.minRequired,
          targetCount: c.targetCount,
          sortOrder: c.sortOrder,
        });
        // 加载 SEO 数据
        if (c.seo) {
          setSeoData({
            titleZh: c.seo.titleZh || "",
            titleEn: c.seo.titleEn || "",
            descriptionZh: c.seo.descriptionZh || "",
            descriptionEn: c.seo.descriptionEn || "",
            keywords: c.seo.keywords || [],
            h1Zh: c.seo.h1Zh || "",
            h1En: c.seo.h1En || "",
            subtitleZh: c.seo.subtitleZh || "",
            subtitleEn: c.seo.subtitleEn || "",
            footerTextZh: c.seo.footerTextZh || "",
            footerTextEn: c.seo.footerTextEn || "",
            schemaType: c.seo.schemaType || "CollectionPage",
            noIndex: c.seo.noIndex || false,
            sitemapPriority: c.seo.sitemapPriority || 0.7,
            changeFreq: c.seo.changeFreq || "weekly",
          });
        }
      }
    } catch (error) {
      console.error("加载聚合页失败:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadRecipes = useCallback(async () => {
    setRecipesLoading(true);
    try {
      const response = await fetch(`/api/admin/collections/${id}/recipes?pageSize=50`);
      const data = await response.json();
      if (data.success) {
        setRecipes(data.data?.recipes || []);
      }
    } catch (error) {
      console.error("加载食谱列表失败:", error);
    } finally {
      setRecipesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  useEffect(() => {
    if (activeTab === "content") {
      loadRecipes();
    }
  }, [activeTab, loadRecipes]);

  const handleSave = async () => {
    // 验证表单
    if (!validateForm()) {
      alert("请修正表单中的错误");
      return;
    }

    setSaving(true);
    try {
      // 构建保存数据，包含 SEO 配置
      const saveData = {
        ...formData,
        seo: {
          titleZh: seoData.titleZh,
          titleEn: seoData.titleEn,
          descriptionZh: seoData.descriptionZh,
          descriptionEn: seoData.descriptionEn,
          keywords: seoData.keywords,
          h1Zh: seoData.h1Zh,
          h1En: seoData.h1En,
          subtitleZh: seoData.subtitleZh,
          subtitleEn: seoData.subtitleEn,
          footerTextZh: seoData.footerTextZh,
          footerTextEn: seoData.footerTextEn,
          noIndex: seoData.noIndex,
        },
      };

      const response = await fetch(`/api/admin/collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData),
      });

      const data = await response.json();
      if (data.success) {
        await loadCollection();
        alert("保存成功");
      } else {
        alert(data.error?.message || "保存失败");
      }
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handlePinRecipe = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/admin/collections/${id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds: [recipeId], position: "end" }),
      });
      if (response.ok) {
        await loadCollection();
        await loadRecipes();
      }
    } catch (error) {
      console.error("置顶失败:", error);
    }
  };

  const handleUnpinRecipe = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/admin/collections/${id}/pin`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds: [recipeId] }),
      });
      if (response.ok) {
        await loadCollection();
        await loadRecipes();
      }
    } catch (error) {
      console.error("取消置顶失败:", error);
    }
  };

  const handleExcludeRecipe = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/admin/collections/${id}/exclude`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds: [recipeId] }),
      });
      if (response.ok) {
        await loadCollection();
        await loadRecipes();
      }
    } catch (error) {
      console.error("排除失败:", error);
    }
  };

  // 同步到菜系配置
  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`/api/admin/collections/${id}/operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "sync-cuisine" }),
      });
      const data = await response.json();
      if (data.success) {
        await loadCollection();
        alert("同步成功");
      } else {
        alert(data.error?.message || "同步失败");
      }
    } catch (error) {
      console.error("同步失败:", error);
      alert("同步失败");
    } finally {
      setSyncing(false);
    }
  };

  // 发布合集
  const handlePublish = async () => {
    if (!collection) return;

    const isQualified = collection.publishedCount >= collection.minRequired;
    if (!isQualified) {
      const confirmed = confirm(
        `当前已发布食谱数 ${collection.publishedCount} 未达到最低要求 ${collection.minRequired}，确定要发布吗？`
      );
      if (!confirmed) return;
    }

    setPublishing(true);
    try {
      const response = await fetch(`/api/admin/collections/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: !isQualified }),
      });
      const data = await response.json();
      if (data.success) {
        await loadCollection();
        alert(data.data.message || "发布成功");
      } else {
        alert(data.error?.message || "发布失败");
      }
    } catch (error) {
      console.error("发布失败:", error);
      alert("发布失败");
    } finally {
      setPublishing(false);
    }
  };

  // 下架合集
  const handleUnpublish = async () => {
    const confirmed = confirm("确定要下架此合集吗？下架后将不会在前台显示。");
    if (!confirmed) return;

    setPublishing(true);
    try {
      const response = await fetch(`/api/admin/collections/${id}/publish`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        await loadCollection();
        alert("下架成功");
      } else {
        alert(data.error?.message || "下架失败");
      }
    } catch (error) {
      console.error("下架失败:", error);
      alert("下架失败");
    } finally {
      setPublishing(false);
    }
  };

  // 表单验证
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "名称不能为空";
    }

    if (!formData.slug.trim()) {
      errors.slug = "Slug 不能为空";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = "Slug 只能包含小写字母、数字和连字符";
    }

    if (formData.minRequired < 0) {
      errors.minRequired = "最小发布数量不能为负数";
    }

    if (formData.targetCount < 0) {
      errors.targetCount = "目标数量不能为负数";
    }

    if (formData.minRequired > formData.targetCount) {
      errors.minRequired = "最小发布数量不能大于目标数量";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      alert("不支持的文件类型，仅支持 JPG、PNG、WebP、GIF");
      return;
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert("文件过大，最大支持 5MB");
      return;
    }

    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("category", "collections");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await response.json();
      if (data.success) {
        setFormData({ ...formData, coverImage: data.url });
      } else {
        alert(data.error || "上传失败");
      }
    } catch (error) {
      console.error("上传失败:", error);
      alert("上传失败");
    } finally {
      setUploading(false);
    }
  };

  // 移除封面图片
  const handleRemoveImage = () => {
    setFormData({ ...formData, coverImage: "" });
  };

  // AI 一键生成所有 SEO 内容
  const handleGenerateAllSeo = async () => {
    if (!collection) return;

    setGeneratingSeo(true);
    try {
      const response = await fetch(`/api/admin/collections/${id}/ai/seo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (data.success) {
        const seo = data.data;
        // 更新页面描述
        setFormData({
          ...formData,
          description: seo.descriptionZh || formData.description,
          descriptionEn: seo.descriptionEn || formData.descriptionEn,
        });
        // 更新 SEO 数据
        setSeoData({
          ...seoData,
          titleZh: seo.titleZh || seoData.titleZh,
          titleEn: seo.titleEn || seoData.titleEn,
          descriptionZh: seo.metaDescriptionZh || seoData.descriptionZh,
          descriptionEn: seo.metaDescriptionEn || seoData.descriptionEn,
          keywords: seo.keywords?.length > 0 ? seo.keywords : seoData.keywords,
          h1Zh: seo.h1Zh || seoData.h1Zh,
          h1En: seo.h1En || seoData.h1En,
          subtitleZh: seo.subtitleZh || seoData.subtitleZh,
          subtitleEn: seo.subtitleEn || seoData.subtitleEn,
          footerTextZh: seo.footerTextZh || seoData.footerTextZh,
          footerTextEn: seoData.footerTextEn,
        });
        alert("SEO 内容生成成功！请检查并保存。");
      } else {
        alert(data.error?.message || "生成失败");
      }
    } catch (error) {
      console.error("生成 SEO 内容失败:", error);
      alert("生成 SEO 内容失败");
    } finally {
      setGeneratingSeo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-textGray">加载中...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <p className="text-textGray">聚合页不存在</p>
        <Link href="/admin/collections" className="text-brownWarm hover:underline mt-4 inline-block">
          返回列表
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: "basic" as TabType, label: "基本信息", icon: Settings },
    { id: "rules" as TabType, label: "匹配规则", icon: Filter },
    { id: "content" as TabType, label: "内容管理", icon: FileText },
    { id: "ai" as TabType, label: "AI 生成", icon: Sparkles },
    { id: "seo" as TabType, label: "SEO 设置", icon: Search },
  ];

  return (
    <div>
      {/* 页头 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/collections"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-textGray" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-medium text-textDark">
                {collection.name}
              </h1>
              <span className="text-sm text-textGray bg-gray-100 px-2 py-0.5 rounded">
                {CollectionTypeLabel[collection.type as keyof typeof CollectionTypeLabel] || collection.type}
              </span>
            </div>
            <p className="text-sm text-textGray">{collection.path}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 同步按钮：菜系类型且未关联时显示 */}
          {collection.type === "cuisine" && !collection.cuisineId && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
              title="同步创建菜系配置，使其能在前端显示"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {syncing ? "同步中..." : "同步到菜系配置"}
            </button>
          )}
          {/* 已关联提示 */}
          {collection.type === "cuisine" && collection.cuisineId && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              已关联菜系: {collection.linkedEntityName}
            </span>
          )}
          <Link
            href={`/admin/collections/${id}/diagnose`}
            className="px-4 py-2 text-sm text-textGray hover:text-textDark border border-cream rounded-lg transition-colors"
          >
            诊断
          </Link>
          {/* 发布/下架按钮 */}
          {collection.status === "published" ? (
            <button
              onClick={handleUnpublish}
              disabled={publishing}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {publishing ? "处理中..." : "下架"}
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {publishing ? "处理中..." : "发布"}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brownWarm hover:bg-brownDark text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      {/* 状态概览卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="text-sm text-textGray mb-1">已发布</div>
          <div className="text-2xl font-bold text-textDark">
            {collection.publishedCount}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="text-sm text-textGray mb-1">目标数量</div>
          <div className="text-2xl font-bold text-textDark">
            {collection.targetCount}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="text-sm text-textGray mb-1">待审核</div>
          <div className="text-2xl font-bold text-amber-600">
            {collection.pendingCount}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="text-sm text-textGray mb-1">缺口</div>
          <div className="text-2xl font-bold text-red-600">
            {Math.max(0, collection.minRequired - collection.publishedCount)}
          </div>
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="bg-white rounded-lg shadow-card mb-6">
        <div className="border-b border-cream">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "text-brownWarm border-brownWarm"
                      : "text-textGray border-transparent hover:text-textDark"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* 基本信息 Tab */}
          {activeTab === "basic" && (
            <div className="space-y-6">
              {/* 进度条 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-textDark">内容进度</span>
                  <span className="text-sm text-textGray">
                    {collection.publishedCount} / {collection.targetCount} ({collection.progress}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      collection.progress >= 100
                        ? "bg-green-500"
                        : collection.progress >= 80
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(collection.progress, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-textGray">
                  <span>最低要求: {collection.minRequired}</span>
                  <span>
                    {collection.publishedCount >= collection.minRequired ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> 已达标
                      </span>
                    ) : (
                      <span className="text-red-600">
                        还需 {collection.minRequired - collection.publishedCount} 个
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左侧：基本字段 */}
                <div className="space-y-4">
                  {/* 名称 */}
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">
                      名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-brownWarm ${
                        formErrors.name ? "border-red-500" : "border-cream"
                      }`}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  {/* 英文名称 */}
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">
                      英文名称
                    </label>
                    <input
                      type="text"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder="English Name"
                      className="w-full px-4 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">
                      Slug (URL 标识) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => {
                        setFormData({ ...formData, slug: e.target.value.toLowerCase() });
                        if (formErrors.slug) setFormErrors({ ...formErrors, slug: "" });
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-brownWarm ${
                        formErrors.slug ? "border-red-500" : "border-cream"
                      }`}
                    />
                    {formErrors.slug ? (
                      <p className="text-xs text-red-500 mt-1">{formErrors.slug}</p>
                    ) : (
                      <p className="text-xs text-textGray mt-1">
                        完整路径: /{collection.type}/{formData.slug}
                      </p>
                    )}
                  </div>

                  {/* 描述 */}
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">
                      描述
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="简短描述此聚合页的内容..."
                      className="w-full px-4 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
                    />
                  </div>

                  {/* 英文描述 */}
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">
                      英文描述
                    </label>
                    <textarea
                      value={formData.descriptionEn}
                      onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                      rows={3}
                      placeholder="English description..."
                      className="w-full px-4 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
                    />
                  </div>
                </div>

                {/* 右侧：封面图片和设置 */}
                <div className="space-y-4">
                  {/* 封面图片 */}
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">
                      封面图片
                    </label>
                    {formData.coverImage ? (
                      <div className="relative">
                        <Image
                          src={formData.coverImage}
                          alt="封面图片"
                          width={400}
                          height={225}
                          className="w-full h-48 object-cover rounded-lg"
                          unoptimized
                        />
                        <button
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-cream rounded-lg cursor-pointer hover:border-brownWarm transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                        {uploading ? (
                          <Loader2 className="h-8 w-8 text-brownWarm animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-textGray mb-2" />
                            <span className="text-sm text-textGray">点击上传封面图片</span>
                            <span className="text-xs text-textGray mt-1">支持 JPG、PNG、WebP，最大 5MB</span>
                          </>
                        )}
                      </label>
                    )}
                  </div>

                  {/* 状态 */}
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">
                      状态
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 推荐开关 */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="h-4 w-4 text-brownWarm border-cream rounded focus:ring-brownWarm"
                    />
                    <label htmlFor="isFeatured" className="text-sm text-textDark">
                      推荐到一级聚合页
                    </label>
                  </div>

                  {/* 数量设置 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-textDark mb-2">
                        最小发布数量
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.minRequired}
                        onChange={(e) => {
                          setFormData({ ...formData, minRequired: parseInt(e.target.value) || 0 });
                          if (formErrors.minRequired) setFormErrors({ ...formErrors, minRequired: "" });
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-brownWarm ${
                          formErrors.minRequired ? "border-red-500" : "border-cream"
                        }`}
                      />
                      {formErrors.minRequired && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.minRequired}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-textDark mb-2">
                        目标数量
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.targetCount}
                        onChange={(e) => {
                          setFormData({ ...formData, targetCount: parseInt(e.target.value) || 0 });
                          if (formErrors.targetCount) setFormErrors({ ...formErrors, targetCount: "" });
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-brownWarm ${
                          formErrors.targetCount ? "border-red-500" : "border-cream"
                        }`}
                      />
                      {formErrors.targetCount && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.targetCount}</p>
                      )}
                    </div>
                  </div>

                  {/* 排序权重 */}
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">
                      排序权重
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
                    />
                    <p className="text-xs text-textGray mt-1">数值越小排序越靠前</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 匹配规则 Tab */}
          {activeTab === "rules" && (
            <RulesTab
              collection={collection}
              onRefresh={loadCollection}
            />
          )}

          {/* 内容管理 Tab */}
          {activeTab === "content" && (
            <div className="space-y-6">
              {/* 置顶食谱 */}
              <div>
                <h3 className="text-sm font-medium text-textDark mb-3">
                  置顶食谱 ({collection.pinnedRecipeIds.length})
                </h3>
                {collection.pinnedRecipeIds.length === 0 ? (
                  <p className="text-sm text-textGray">暂无置顶食谱</p>
                ) : (
                  <div className="space-y-2">
                    {recipes
                      .filter((r) => r.isPinned)
                      .sort((a, b) => (a.pinnedOrder || 0) - (b.pinnedOrder || 0))
                      .map((recipe) => (
                        <div
                          key={recipe.id}
                          className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg"
                        >
                          <GripVertical className="h-4 w-4 text-amber-400 cursor-move" />
                          <span className="flex-1 text-sm text-textDark">{recipe.titleZh || recipe.title}</span>
                          <button
                            onClick={() => handleUnpinRecipe(recipe.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            取消置顶
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* 已匹配食谱列表 */}
              <div>
                <h3 className="text-sm font-medium text-textDark mb-3">
                  已匹配食谱 ({recipes.length})
                </h3>
                {recipesLoading ? (
                  <p className="text-sm text-textGray">加载中...</p>
                ) : (
                  <div className="border border-cream rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-textGray">标题</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-textGray">状态</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-textGray">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream">
                        {recipes.slice(0, 20).map((recipe) => (
                          <tr key={recipe.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                {recipe.isPinned && (
                                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                    置顶
                                  </span>
                                )}
                                <span className="text-sm text-textDark">{recipe.titleZh || recipe.title}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              {recipe.status === "published" ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                  <CheckCircle className="h-3 w-3" />
                                  已发布
                                </span>
                              ) : recipe.status === "pending" ? (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                                  <AlertCircle className="h-3 w-3" />
                                  待审核
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                  <AlertCircle className="h-3 w-3" />
                                  草稿
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!recipe.isPinned && (
                                  <button
                                    onClick={() => handlePinRecipe(recipe.id)}
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    置顶
                                  </button>
                                )}
                                <button
                                  onClick={() => handleExcludeRecipe(recipe.id)}
                                  className="text-xs text-red-600 hover:underline"
                                >
                                  排除
                                </button>
                                <Link
                                  href={`/admin/recipes/${recipe.id}/edit`}
                                  className="text-xs text-brownWarm hover:underline"
                                >
                                  编辑
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {recipes.length > 20 && (
                      <div className="px-4 py-2 bg-gray-50 text-center">
                        <span className="text-xs text-textGray">
                          仅显示前 20 条，共 {recipes.length} 条
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI 生成 Tab */}
          {activeTab === "ai" && (
            <AIGenerateTab
              collectionId={collection.id}
              collectionName={collection.name}
              cuisineName={collection.linkedEntityType === "cuisine" ? collection.linkedEntityName : undefined}
              onRecipesGenerated={() => {
                loadCollection();
                loadRecipes();
              }}
            />
          )}

          {/* SEO 设置 Tab */}
          {activeTab === "seo" && (
            <div className="space-y-6 max-w-2xl">
              {/* AI 一键生成按钮 */}
              <div className="bg-gradient-to-r from-brownWarm/10 to-orangeAccent/10 rounded-lg p-4 border border-brownWarm/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-textDark">AI 一键生成 SEO 内容</h3>
                    <p className="text-xs text-textGray mt-1">
                      自动生成页面描述、SEO标题、Meta描述、关键词、H1标题、副标题、底部文案
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateAllSeo}
                    disabled={generatingSeo}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brownWarm hover:bg-brownDark text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {generatingSeo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {generatingSeo ? "生成中..." : "一键生成"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  SEO 标题（中文）
                </label>
                <input
                  type="text"
                  value={seoData.titleZh}
                  onChange={(e) => setSeoData({
                    ...seoData,
                    titleZh: e.target.value,
                  })}
                  placeholder={`${collection.name}食谱大全`}
                  className="w-full px-4 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
                />
                <p className="text-xs text-textGray mt-1">
                  用于 &lt;title&gt; 标签，建议 50-60 字符（当前 {seoData.titleZh.length} 字符）
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  SEO 描述（中文）
                </label>
                <textarea
                  value={seoData.descriptionZh}
                  onChange={(e) => setSeoData({
                    ...seoData,
                    descriptionZh: e.target.value,
                  })}
                  rows={3}
                  placeholder={`探索${collection.name}的精选食谱...`}
                  className="w-full px-4 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
                />
                <p className="text-xs text-textGray mt-1">
                  用于 meta description，建议 120-160 字符（当前 {seoData.descriptionZh.length} 字符）
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  关键词
                </label>
                <input
                  type="text"
                  value={seoData.keywords.join(", ")}
                  onChange={(e) => setSeoData({
                    ...seoData,
                    keywords: e.target.value.split(",").map(k => k.trim()).filter(Boolean),
                  })}
                  placeholder={`${collection.name}, 食谱, 做法`}
                  className="w-full px-4 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
                />
                <p className="text-xs text-textGray mt-1">用逗号分隔，最多 10 个</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  页面标题 (H1)
                </label>
                <input
                  type="text"
                  value={seoData.h1Zh}
                  onChange={(e) => setSeoData({
                    ...seoData,
                    h1Zh: e.target.value,
                  })}
                  placeholder={collection.name}
                  className="w-full px-4 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  副标题
                </label>
                <input
                  type="text"
                  value={seoData.subtitleZh}
                  onChange={(e) => setSeoData({
                    ...seoData,
                    subtitleZh: e.target.value,
                  })}
                  placeholder={`精选${collection.name}食谱`}
                  className="w-full px-4 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  底部文案
                </label>
                <textarea
                  value={seoData.footerTextZh}
                  onChange={(e) => setSeoData({
                    ...seoData,
                    footerTextZh: e.target.value,
                  })}
                  rows={4}
                  placeholder={`介绍${collection.name}的特点和魅力...`}
                  className="w-full px-4 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
                />
                <p className="text-xs text-textGray mt-1">
                  显示在食谱列表下方的收口文案，最多 500 字符（当前 {seoData.footerTextZh.length} 字符）
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="noIndex"
                  checked={seoData.noIndex}
                  onChange={(e) => setSeoData({ ...seoData, noIndex: e.target.checked })}
                  className="h-4 w-4 text-brownWarm border-cream rounded focus:ring-brownWarm"
                />
                <label htmlFor="noIndex" className="text-sm text-textDark">
                  禁止搜索引擎索引 (noindex)
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
