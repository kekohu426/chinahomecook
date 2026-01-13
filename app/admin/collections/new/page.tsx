/**
 * 新建聚合页/专题
 *
 * 路由: /admin/collections/new
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

const TYPE_OPTIONS = [
  { value: "cuisine", label: "菜系" },
  { value: "scene", label: "场景" },
  { value: "method", label: "烹饪方式" },
  { value: "taste", label: "口味" },
  { value: "crowd", label: "人群" },
  { value: "occasion", label: "场合" },
  { value: "topic", label: "专题" },
];

export default function NewCollectionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: "topic",
    name: "",
    slug: "",
    path: "",
    minRequired: 10,
    targetCount: 30,
    isFeatured: false,
    seoTitle: "",
    seoDescription: "",
  });

  const handleChange = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // 自动生成 slug 和 path
    if (field === "name" && !form.slug) {
      const slug = value
        .toString()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]/g, "");
      setForm((prev) => ({
        ...prev,
        slug,
        path: `/${prev.type}/${slug}`,
      }));
    }
    if (field === "type") {
      setForm((prev) => ({
        ...prev,
        path: `/${value}/${prev.slug}`,
      }));
    }
    if (field === "slug") {
      setForm((prev) => ({
        ...prev,
        path: `/${prev.type}/${value}`,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      alert("请填写名称和 Slug");
      return;
    }

    setSaving(true);
    try {
      // 根据类型生成默认规则
      const defaultRules: Record<string, unknown> = {};
      if (form.type === "cuisine") {
        defaultRules.cuisine = form.slug;
      } else if (form.type === "scene") {
        defaultRules.scene = form.slug;
      } else if (form.type === "method") {
        defaultRules.method = form.slug;
      } else if (form.type === "taste") {
        defaultRules.taste = form.slug;
      } else if (form.type === "crowd") {
        defaultRules.crowd = form.slug;
      } else if (form.type === "occasion") {
        defaultRules.occasion = form.slug;
      }

      const response = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          name: form.name,
          slug: form.slug,
          minRequired: form.minRequired,
          targetCount: form.targetCount,
          isFeatured: form.isFeatured,
          rules: defaultRules,
          seo: {
            title: form.seoTitle || form.name,
            description: form.seoDescription,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push(`/admin/collections/${data.data.id}`);
      } else {
        alert(data.error || "创建失败");
      }
    } catch (error) {
      console.error("创建失败:", error);
      alert("创建失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* 页头 */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/collections"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-textGray" />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-medium text-textDark">
            新建聚合页
          </h1>
          <p className="text-sm text-textGray">创建新的聚合页或专题</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-lg shadow-card p-6 space-y-6">
          {/* 类型 */}
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              类型 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.type}
              onChange={(e) => handleChange("type", e.target.value)}
              className="w-full px-3 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 名称 */}
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="如：川菜、家常菜、减脂餐"
              className="w-full px-3 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => handleChange("slug", e.target.value)}
              placeholder="如：sichuan、home-cooking"
              className="w-full px-3 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm font-mono"
            />
            <p className="text-xs text-textGray mt-1">
              用于 URL，只能包含小写字母、数字和连字符
            </p>
          </div>

          {/* 路径预览 */}
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              访问路径
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg text-textGray font-mono text-sm">
              {form.path || "/type/slug"}
            </div>
          </div>

          {/* 目标数量 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                最小发布数
              </label>
              <input
                type="number"
                value={form.minRequired}
                onChange={(e) => handleChange("minRequired", parseInt(e.target.value) || 0)}
                min={1}
                className="w-full px-3 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
              />
              <p className="text-xs text-textGray mt-1">达到此数量才能发布</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                目标数量
              </label>
              <input
                type="number"
                value={form.targetCount}
                onChange={(e) => handleChange("targetCount", parseInt(e.target.value) || 0)}
                min={1}
                className="w-full px-3 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
              />
              <p className="text-xs text-textGray mt-1">理想的内容数量</p>
            </div>
          </div>

          {/* 是否精选 */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isFeatured"
              checked={form.isFeatured}
              onChange={(e) => handleChange("isFeatured", e.target.checked)}
              className="w-4 h-4 rounded border-cream text-brownWarm focus:ring-brownWarm"
            />
            <label htmlFor="isFeatured" className="text-sm text-textDark">
              设为精选（在首页展示）
            </label>
          </div>

          {/* SEO 标题 */}
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              SEO 标题
            </label>
            <input
              type="text"
              value={form.seoTitle}
              onChange={(e) => handleChange("seoTitle", e.target.value)}
              placeholder="留空则使用名称"
              className="w-full px-3 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
            />
          </div>

          {/* SEO 描述 */}
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              SEO 描述
            </label>
            <textarea
              value={form.seoDescription}
              onChange={(e) => handleChange("seoDescription", e.target.value)}
              placeholder="搜索引擎展示的描述文字"
              rows={3}
              className="w-full px-3 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm resize-none"
            />
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-end gap-3 mt-6">
          <Link
            href="/admin/collections"
            className="px-4 py-2 bg-gray-100 text-textGray rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "创建中..." : "创建"}
          </button>
        </div>
      </form>
    </div>
  );
}
