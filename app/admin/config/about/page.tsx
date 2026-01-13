"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Edit2,
  Trash2,
  Plus,
  Loader2,
  Image as ImageIcon,
  Video,
  FileText,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { DEFAULT_LOCALE, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";
import { localizePath } from "@/lib/i18n/utils";

interface AboutSection {
  id: string;
  titleZh: string;
  titleEn: string | null;
  contentZh: string;
  contentEn: string | null;
  title?: string;
  content?: string;
  imageUrl: string | null;
  videoUrl: string | null;
  type: string;
  sortOrder: number;
  isActive: boolean;
}

const SECTION_TYPES = [
  { value: "text", label: "纯文本", icon: FileText },
  { value: "image", label: "图文混排", icon: ImageIcon },
  { value: "video", label: "视频区块", icon: Video },
  { value: "mixed", label: "图文视频", icon: FileText },
];

export default function AboutConfigPage() {
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formState, setFormState] = useState({
    title: "",
    content: "",
    imageUrl: "",
    videoUrl: "",
    type: "text",
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, [locale]);

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormState({
      title: "",
      content: "",
      imageUrl: "",
      videoUrl: "",
      type: "text",
      sortOrder: 0,
      isActive: true,
    });
  };

  async function loadData() {
    try {
      const res = await fetch(`/api/config/about?locale=${locale}`);
      const data = await res.json();
      if (data.success) {
        setSections(data.data);
      }
    } catch (error) {
      console.error("加载配置失败:", error);
      alert("加载配置失败");
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (section: AboutSection) => {
    setEditingId(section.id);
    setShowForm(true);
    setFormState({
      title:
        locale === DEFAULT_LOCALE
          ? section.titleZh
          : section.title || section.titleEn || "",
      content:
        locale === DEFAULT_LOCALE
          ? section.contentZh
          : section.content || section.contentEn || "",
      imageUrl: section.imageUrl || "",
      videoUrl: section.videoUrl || "",
      type: section.type,
      sortOrder: section.sortOrder,
      isActive: section.isActive,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个区块吗？")) return;

    try {
      const res = await fetch(`/api/config/about/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      alert("删除成功");
      loadData();
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.title.trim() || !formState.content.trim()) {
      alert(locale === "en" ? "Title and content are required" : "标题和内容为必填项");
      return;
    }

    setSaving(true);
    try {
      const endpoint = editingId
        ? `/api/config/about/${editingId}`
        : "/api/config/about";
      const method = editingId ? "PUT" : "POST";

      if (!editingId && locale !== DEFAULT_LOCALE) {
        alert("请先切换到中文创建区块");
        return;
      }

      const payload: Record<string, any> = {
        imageUrl: formState.imageUrl || null,
        videoUrl: formState.videoUrl || null,
        type: formState.type,
        sortOrder: formState.sortOrder,
        isActive: formState.isActive,
      };

      if (locale === DEFAULT_LOCALE) {
        payload.titleZh = formState.title.trim();
        payload.contentZh = formState.content.trim();
      } else {
        payload.locale = locale;
        payload.title = formState.title.trim();
        payload.content = formState.content.trim();
      }

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("保存失败");

      alert(editingId ? "更新成功" : "新增成功");
      resetForm();
      loadData();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (section: AboutSection) => {
    try {
      const res = await fetch(`/api/config/about/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...section, isActive: !section.isActive }),
      });
      if (!res.ok) throw new Error("更新失败");
      loadData();
    } catch (error) {
      console.error("更新失败:", error);
      alert("更新失败");
    }
  };

  const handleMoveSort = async (section: AboutSection, direction: "up" | "down") => {
    const currentIndex = sections.findIndex((s) => s.id === section.id);
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (swapIndex < 0 || swapIndex >= sections.length) return;

    const otherSection = sections[swapIndex];

    try {
      await Promise.all([
        fetch(`/api/config/about/${section.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...section, sortOrder: otherSection.sortOrder }),
        }),
        fetch(`/api/config/about/${otherSection.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...otherSection, sortOrder: section.sortOrder }),
        }),
      ]);
      loadData();
    } catch (error) {
      console.error("排序失败:", error);
      alert("排序失败");
    }
  };

  const handleTranslateAll = async () => {
    if (locale === DEFAULT_LOCALE) {
      alert("默认语言无需翻译");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config/about/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLocale: DEFAULT_LOCALE,
          targetLocale: locale,
        }),
      });
      if (!res.ok) throw new Error("翻译失败");
      alert("翻译完成");
      loadData();
    } catch (error) {
      console.error("翻译失败:", error);
      alert("翻译失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-sage-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-medium text-sage-800 mb-2">
            关于我们配置
          </h1>
          <p className="text-sage-500">管理「关于我们」页面的内容区块</p>
        </div>
        <div className="flex gap-3">
          <div className="hidden md:flex items-center gap-2 text-sm text-sage-600">
            {Object.entries(LOCALE_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setLocale(key as Locale)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  locale === key
                    ? "bg-sage-600 text-white"
                    : "bg-sage-100 text-sage-600 hover:bg-sage-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {locale !== DEFAULT_LOCALE && (
            <button
              onClick={handleTranslateAll}
              className="px-4 py-2 border border-sage-300 text-sage-700 rounded-lg hover:bg-sage-50 transition-colors flex items-center gap-2"
              disabled={saving}
            >
              <Sparkles className="w-4 h-4" />
              AI 翻译
            </button>
          )}
          <Link
            href={localizePath("/about", locale)}
            target="_blank"
            className="px-4 py-2 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            预览页面
          </Link>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
              setFormState((prev) => ({
                ...prev,
                sortOrder: sections.length,
              }));
            }}
            disabled={locale !== DEFAULT_LOCALE}
            className="px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            新增区块
          </button>
        </div>
      </div>

      {/* 新增/编辑表单 */}
      {showForm && (
        <div className="bg-white rounded-lg border border-sage-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium text-sage-800">
                {editingId ? "编辑区块" : "新增区块"}
              </h2>
              <p className="text-xs text-sage-500 mt-1">
                当前语言：{LOCALE_LABELS[locale]}
              </p>
            </div>
            <button
              onClick={resetForm}
              className="text-sage-500 hover:text-sage-700"
            >
              取消
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 类型选择 */}
            <div>
              <label className="block text-sm text-sage-600 mb-2">区块类型</label>
              <div className="flex gap-2">
                {SECTION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormState({ ...formState, type: type.value })
                    }
                    className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                      formState.type === type.value
                        ? "border-sage-600 bg-sage-50 text-sage-700"
                        : "border-sage-200 text-sage-500 hover:border-sage-400"
                    }`}
                  >
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 标题 */}
            <div>
              <label className="block text-sm text-sage-600 mb-2">
                标题 ({LOCALE_LABELS[locale]})
                <span className="text-red-500"> *</span>
              </label>
              <input
                value={formState.title}
                onChange={(e) =>
                  setFormState({ ...formState, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-sage-200 rounded-md"
                placeholder={locale === "en" ? "e.g. Our Story" : "例：我们的故事"}
                required
              />
            </div>

            {/* 内容 */}
            <div>
              <label className="block text-sm text-sage-600 mb-2">
                内容 ({LOCALE_LABELS[locale]})
                <span className="text-red-500"> *</span>
              </label>
              <textarea
                value={formState.content}
                onChange={(e) =>
                  setFormState({ ...formState, content: e.target.value })
                }
                className="w-full px-3 py-2 border border-sage-200 rounded-md"
                rows={6}
                placeholder={
                  locale === "en"
                    ? "English content... supports HTML"
                    : "输入内容...支持HTML标签"
                }
                required
              />
            </div>

            {/* 图片 */}
            {(formState.type === "image" || formState.type === "mixed") && (
              <div>
                <label className="block text-sm text-sage-600 mb-2">图片</label>
                <div className="flex gap-3 items-start">
                  <input
                    value={formState.imageUrl}
                    onChange={(e) =>
                      setFormState({ ...formState, imageUrl: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-sage-200 rounded-md"
                    placeholder="图片 URL 或上传"
                  />
                  <ImageUploader
                    category="about"
                    onUploadSuccess={(url) =>
                      setFormState({ ...formState, imageUrl: url })
                    }
                  />
                </div>
                {formState.imageUrl && (
                  <div className="mt-3">
                    <img
                      src={formState.imageUrl}
                      alt="预览"
                      className="w-48 h-32 object-cover rounded-lg border border-sage-200"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 视频 */}
            {(formState.type === "video" || formState.type === "mixed") && (
              <div>
                <label className="block text-sm text-sage-600 mb-2">
                  视频 URL（支持 YouTube / 本地视频）
                </label>
                <input
                  value={formState.videoUrl}
                  onChange={(e) =>
                    setFormState({ ...formState, videoUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-sage-200 rounded-md"
                  placeholder="https://www.youtube.com/watch?v=xxx 或 /videos/xxx.mp4"
                />
              </div>
            )}

            {/* 排序和状态 */}
            <div className="flex items-center gap-6">
              <div>
                <label className="block text-sm text-sage-600 mb-2">排序</label>
                <input
                  type="number"
                  value={formState.sortOrder}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-24 px-3 py-2 border border-sage-200 rounded-md"
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formState.isActive}
                  onChange={(e) =>
                    setFormState({ ...formState, isActive: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm text-sage-600">
                  启用该区块
                </label>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-sage-200 rounded-lg text-sage-600 hover:border-sage-400"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-lg disabled:opacity-60"
              >
                {saving ? "保存中..." : editingId ? "保存更新" : "新增区块"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 区块列表 */}
      <div className="bg-white rounded-lg border border-sage-200 overflow-hidden">
        {sections.length === 0 ? (
          <div className="py-16 text-center text-sage-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无内容区块</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-sage-600 hover:underline"
            >
              点击新增第一个区块
            </button>
          </div>
        ) : (
          <div className="divide-y divide-sage-100">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className={`p-6 ${!section.isActive ? "bg-sage-50 opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          section.type === "text"
                            ? "bg-blue-100 text-blue-700"
                            : section.type === "image"
                            ? "bg-green-100 text-green-700"
                            : section.type === "video"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {SECTION_TYPES.find((t) => t.value === section.type)?.label}
                      </span>
                      <h3 className="text-lg font-medium text-sage-800">
                        {locale === DEFAULT_LOCALE
                          ? section.titleZh
                          : section.title || section.titleZh}
                      </h3>
                      {locale === DEFAULT_LOCALE && section.titleEn && (
                        <span className="text-sm text-sage-400">
                          ({section.titleEn})
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-sage-600 line-clamp-2">
                      {(locale === DEFAULT_LOCALE
                        ? section.contentZh
                        : section.content || section.contentZh
                      ).replace(/<[^>]*>/g, "")}
                    </p>
                    {section.imageUrl && (
                      <img
                        src={section.imageUrl}
                        alt={
                          locale === DEFAULT_LOCALE
                            ? section.titleZh
                            : section.title || section.titleZh
                        }
                        className="mt-3 w-32 h-20 object-cover rounded border border-sage-200"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* 排序按钮 */}
                    <button
                      onClick={() => handleMoveSort(section, "up")}
                      disabled={index === 0}
                      className="p-2 text-sage-400 hover:text-sage-600 disabled:opacity-30"
                      title="上移"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveSort(section, "down")}
                      disabled={index === sections.length - 1}
                      className="p-2 text-sage-400 hover:text-sage-600 disabled:opacity-30"
                      title="下移"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* 启用/禁用 */}
                    <button
                      onClick={() => handleToggleActive(section)}
                      className={`p-2 ${
                        section.isActive
                          ? "text-green-600 hover:text-green-700"
                          : "text-sage-400 hover:text-sage-600"
                      }`}
                      title={section.isActive ? "禁用" : "启用"}
                    >
                      {section.isActive ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>

                    {/* 编辑 */}
                    <button
                      onClick={() => handleEdit(section)}
                      className="p-2 text-sage-600 hover:text-sage-800"
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* 删除 */}
                    <button
                      onClick={() => handleDelete(section.id)}
                      className="p-2 text-red-500 hover:text-red-700"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
