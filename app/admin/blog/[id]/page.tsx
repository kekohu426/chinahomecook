/**
 * 管理端 - 博客编辑页
 */

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Check,
  Clock,
  Send,
  Copy,
  Eye,
  Loader2,
  Languages,
  X,
} from "lucide-react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

// Markdown 转 HTML（简化版）
function markdownToHtml(md: string): string {
  if (!md) return "";

  let html = md;

  // 移除代码块标记 (```markdown, ```)
  html = html.replace(/```\w*\n?/g, "");
  html = html.replace(/```/g, "");

  // 移除图片占位符
  html = html.replace(/!\[.*?\]\(IMAGE_PLACEHOLDER_\d+\)/g, "");
  html = html.replace(/\[图片\d+位置[^\]]*\]/g, "");

  // 标题
  html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");

  // 粗体和斜体
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // 图片（真实图片URL）
  html = html.replace(/!\[(.*?)\]\((\/uploads\/[^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4" />');
  html = html.replace(/!\[(.*?)\]\((https?:\/\/[^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4" />');

  // 链接
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>');

  // 分割线
  html = html.replace(/^---$/gm, "<hr />");

  // 引用
  html = html.replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>");

  // 无序列表
  html = html.replace(/^[-*] (.*$)/gm, "<li>$1</li>");

  // 有序列表
  html = html.replace(/^\d+\. (.*$)/gm, "<li>$1</li>");

  // 包装列表
  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  // 分段处理
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs.map(p => {
    p = p.trim();
    if (!p) return "";
    if (p.startsWith("<h") || p.startsWith("<ul") || p.startsWith("<ol") ||
        p.startsWith("<blockquote") || p.startsWith("<hr") || p.startsWith("<img")) {
      return p;
    }
    // 处理段落内的换行
    p = p.replace(/\n/g, "<br />");
    return `<p>${p}</p>`;
  }).filter(Boolean).join("");

  return html;
}

interface BlogPost {
  id: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  longTailQuestions: string[];
  status: string;
  publishAt: string | null;
  publishedAt: string | null;
  authorName: string | null;
  translations: Translation[];
  imageAssets: ImageAsset[];
}

interface Translation {
  id: string;
  locale: string;
  title: string;
  summary: string | null;
  contentMarkdown: string;
  outline: any;
  faq: any;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  tags: string[];
  isApproved: boolean;
}

interface ImageAsset {
  id: string;
  locale: string;
  prompt: string;
  style: string | null;
  aspectRatio: string | null;
  altText: string | null;
  sectionHeading: string | null;
  imageUrl: string | null;
  position: number;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  OUTLINE_READY: "大纲就绪",
  CONTENT_READY: "内容就绪",
  REVIEW_PENDING: "待审核",
  SCHEDULED: "已排期",
  PUBLISHED: "已发布",
};

// 支持的语言
const SUPPORTED_LOCALES: Record<string, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  "en": "English",
  "ja": "日本語",
  "ko": "한국어",
  "es": "Español",
  "fr": "Français",
  "de": "Deutsch",
  "pt": "Português",
  "ru": "Русский",
};

export default function BlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 当前编辑的语言
  const [locale, setLocale] = useState("zh-CN");

  // 当前翻译内容
  const [editingContent, setEditingContent] = useState({
    title: "",
    summary: "",
    contentMarkdown: "",
    contentHtml: "",
    metaTitle: "",
    metaDescription: "",
    slug: "",
    tags: "",
    ogImage: "",
  });

  // AI 生成状态
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState("");

  // 翻译状态
  const [translating, setTranslating] = useState(false);
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);
  const [quickTranslateLocale, setQuickTranslateLocale] = useState("en");

  // 发布设置
  const [publishAt, setPublishAt] = useState("");

  // 加载博客
  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/blog/${id}`);
      if (!res.ok) throw new Error("加载失败");
      const data = await res.json();
      setPost(data.post);

      // 加载当前语言的翻译
      const translation = data.post.translations.find(
        (t: Translation) => t.locale === locale
      );
      if (translation) {
        const html = translation.contentHtml || markdownToHtml(translation.contentMarkdown || "");
        setEditingContent({
          title: translation.title || "",
          summary: translation.summary || "",
          contentMarkdown: translation.contentMarkdown || "",
          contentHtml: html,
          metaTitle: translation.metaTitle || "",
          metaDescription: translation.metaDescription || "",
          slug: translation.slug || "",
          tags: translation.tags?.join(", ") || "",
          ogImage: translation.ogImage || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch post:", error);
      alert("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  // 切换语言时更新编辑内容
  useEffect(() => {
    if (!post) return;
    const translation = post.translations.find((t) => t.locale === locale);
    if (translation) {
      const html = (translation as any).contentHtml || markdownToHtml(translation.contentMarkdown || "");
      setEditingContent({
        title: translation.title || "",
        summary: translation.summary || "",
        contentMarkdown: translation.contentMarkdown || "",
        contentHtml: html,
        metaTitle: translation.metaTitle || "",
        metaDescription: translation.metaDescription || "",
        slug: translation.slug || "",
        tags: translation.tags?.join(", ") || "",
        ogImage: translation.ogImage || "",
      });
    } else {
      setEditingContent({
        title: "",
        summary: "",
        contentMarkdown: "",
        contentHtml: "",
        metaTitle: "",
        metaDescription: "",
        slug: "",
        tags: "",
        ogImage: "",
      });
    }
  }, [locale, post]);

  // 保存内容
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/blog/${id}/translation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          title: editingContent.title,
          summary: editingContent.summary,
          contentMarkdown: editingContent.contentMarkdown,
          contentHtml: editingContent.contentHtml,
          metaTitle: editingContent.metaTitle,
          metaDescription: editingContent.metaDescription,
          slug: editingContent.slug,
          tags: editingContent.tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
          ogImage: editingContent.ogImage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "保存失败");
      }
      alert("保存成功");
      fetchPost();
    } catch (error) {
      console.error("Failed to save:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 一键生成（大纲 + 正文）
  const handleGenerate = async () => {
    const langName = locale === "zh-CN" ? "中文" : "英文";
    if (!confirm(`确定要为 ${langName} 版本一键生成博客内容吗？\n\n将自动生成：大纲、正文、插图提示词`)) return;

    try {
      setGenerating(true);

      // 第一步：生成大纲
      setGenerateProgress("正在生成大纲...");
      const outlineRes = await fetch(`/api/admin/blog/${id}/generate-outline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });

      if (!outlineRes.ok) {
        const data = await outlineRes.json();
        throw new Error(data.error || "大纲生成失败");
      }

      // 第二步：生成正文
      setGenerateProgress("大纲已生成，正在生成正文...");
      const contentRes = await fetch(`/api/admin/blog/${id}/generate-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });

      if (!contentRes.ok) {
        const data = await contentRes.json();
        throw new Error(data.error || "正文生成失败");
      }

      // 第三步：自动审核通过并发布
      setGenerateProgress("正在发布...");
      await fetch(`/api/admin/blog/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", locale }),
      });
      await fetch(`/api/admin/blog/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish_now" }),
      });

      setGenerateProgress("完成！");
      alert(`${langName}版本已生成并发布！`);
      fetchPost();
    } catch (error) {
      console.error("Failed to generate:", error);
      alert("生成失败: " + (error as Error).message);
    } finally {
      setGenerating(false);
      setGenerateProgress("");
    }
  };

  // 保留单独生成正文的功能（用于重新生成）
  const handleRegenerateContent = async () => {
    if (!confirm(`确定要重新生成 ${locale === "zh-CN" ? "中文" : "英文"} 正文吗？`)) return;

    try {
      setGenerating(true);
      setGenerateProgress("正在重新生成正文...");
      const res = await fetch(`/api/admin/blog/${id}/generate-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "生成失败");
      }

      alert("正文生成成功！");
      fetchPost();
    } catch (error) {
      console.error("Failed to generate content:", error);
      alert("生成失败: " + (error as Error).message);
    } finally {
      setGenerating(false);
      setGenerateProgress("");
    }
  };

  // 审核通过
  const handleApprove = async () => {
    try {
      const res = await fetch(`/api/admin/blog/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", locale }),
      });

      if (!res.ok) throw new Error("操作失败");
      alert("审核通过！");
      fetchPost();
    } catch (error) {
      alert("操作失败");
    }
  };

  // 提交审核
  const handleSubmitReview = async () => {
    try {
      const res = await fetch(`/api/admin/blog/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit_review" }),
      });

      if (!res.ok) throw new Error("操作失败");
      alert("已提交审核！");
      fetchPost();
    } catch (error) {
      alert("操作失败");
    }
  };

  // 排期发布
  const handleSchedule = async () => {
    if (!publishAt) {
      alert("请选择发布时间");
      return;
    }

    try {
      const res = await fetch(`/api/admin/blog/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schedule", publishAt }),
      });

      if (!res.ok) throw new Error("操作失败");
      alert("已排期！");
      fetchPost();
    } catch (error) {
      alert("操作失败");
    }
  };

  // 立即发布
  const handlePublishNow = async () => {
    if (!confirm("确定要立即发布吗？")) return;

    try {
      const res = await fetch(`/api/admin/blog/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish_now" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");
      alert("发布成功！");
      fetchPost();
    } catch (error) {
      alert((error as Error).message);
    }
  };

  // 复制提示词
  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("已复制到剪贴板");
  };

  useEffect(() => {
    const defaultTarget =
      Object.keys(SUPPORTED_LOCALES).find((key) => key !== locale) || "en";
    setQuickTranslateLocale(defaultTarget);
  }, [locale]);

  // 批量翻译
  const handleTranslate = async () => {
    if (selectedLocales.length === 0) {
      alert("请选择目标语言");
      return;
    }

    try {
      setTranslating(true);
      const res = await fetch(`/api/admin/blog/${id}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLocale: locale,
          targetLocales: selectedLocales,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "翻译失败");
      }

      // 显示结果
      const successCount = Object.values(data.results).filter((r: any) => r.success).length;
      const failedLocales = Object.entries(data.results)
        .filter(([_, r]: [string, any]) => !r.success)
        .map(([locale, r]: [string, any]) => `${SUPPORTED_LOCALES[locale]}: ${r.error}`)
        .join("\n");

      if (failedLocales) {
        alert(`翻译完成：${successCount} 成功\n\n失败：\n${failedLocales}`);
      } else {
        alert(`翻译完成：${successCount} 种语言全部成功！`);
      }

      setShowTranslateModal(false);
      setSelectedLocales([]);
      fetchPost();
    } catch (error) {
      alert("翻译失败: " + (error as Error).message);
    } finally {
      setTranslating(false);
    }
  };

  const handleQuickTranslate = async () => {
    if (!quickTranslateLocale || quickTranslateLocale === locale) {
      alert("请选择目标语言");
      return;
    }

    try {
      setTranslating(true);
      const res = await fetch(`/api/admin/blog/${id}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLocale: locale,
          targetLocales: [quickTranslateLocale],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "翻译失败");
      }

      const result = data.results?.[quickTranslateLocale];
      if (result?.success) {
        alert(`${SUPPORTED_LOCALES[quickTranslateLocale]} 翻译完成`);
      } else {
        throw new Error(result?.error || "翻译失败");
      }

      fetchPost();
    } catch (error) {
      alert("翻译失败: " + (error as Error).message);
    } finally {
      setTranslating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">博客不存在</p>
        <Link href="/admin/blog" className="text-orange-600 hover:underline mt-2 inline-block">
          返回列表
        </Link>
      </div>
    );
  }

  const currentTranslation = post.translations.find((t) => t.locale === locale);
  const imageAssets = post.imageAssets.filter((img) => img.locale === locale);

  return (
    <div className="p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/blog"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {editingContent.title || post.primaryKeyword}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">
                状态：{STATUS_LABELS[post.status]}
              </span>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-500">
                关键词：{post.primaryKeyword}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 语言切换 */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {["zh-CN", "en"].map((loc) => (
              <button
                key={loc}
                onClick={() => setLocale(loc)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  locale === loc
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {loc === "zh-CN" ? "中文" : "English"}
              </button>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 左侧：编辑区 */}
        <div className="col-span-2 space-y-6">
          {/* AI 生成按钮 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">AI 生成</h3>
            <div className="flex flex-wrap gap-3">
              {!currentTranslation?.contentMarkdown ? (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 font-medium"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {generating ? generateProgress : "一键生成"}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleRegenerateContent}
                    disabled={generating}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    {generating ? generateProgress : "重新生成正文"}
                  </button>
                  <button
                    onClick={() => setShowTranslateModal(true)}
                    disabled={translating}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {translating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Languages className="w-4 h-4" />
                    )}
                    批量翻译
                  </button>
                </>
              )}
            </div>
            {!currentTranslation?.contentMarkdown && (
              <p className="text-sm text-gray-500 mt-2">点击「一键生成」自动生成大纲、正文和插图提示词</p>
            )}
            {currentTranslation?.contentMarkdown && (
              <p className="text-sm text-gray-500 mt-2">点击「批量翻译」可将当前语言内容翻译到其他语言</p>
            )}
          </div>

          {/* 标题和摘要 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
              <input
                type="text"
                value={editingContent.title}
                onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
              <textarea
                value={editingContent.summary}
                onChange={(e) => setEditingContent({ ...editingContent, summary: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* 富文本编辑器 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <RichTextEditor
              content={editingContent.contentHtml || ""}
              onChange={(html, markdown) => {
                setEditingContent({
                  ...editingContent,
                  contentHtml: html,
                  contentMarkdown: markdown,
                });
              }}
              placeholder="开始编辑博客内容，可直接粘贴图片..."
            />
          </div>

          {/* 封面图片 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              封面图片
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">图片 URL</label>
              <input
                type="text"
                value={editingContent.ogImage}
                onChange={(e) => setEditingContent({ ...editingContent, ogImage: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">粘贴图片URL，将作为博客封面和社交分享图片</p>
            </div>
            {editingContent.ogImage && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={editingContent.ogImage}
                  alt="封面预览"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" fill="gray">图片加载失败</text></svg>';
                  }}
                />
              </div>
            )}
          </div>

          {/* SEO 设置 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <h3 className="font-medium text-gray-900">SEO 设置</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
              <input
                type="text"
                value={editingContent.slug}
                onChange={(e) => setEditingContent({ ...editingContent, slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta 标题</label>
              <input
                type="text"
                value={editingContent.metaTitle}
                onChange={(e) => setEditingContent({ ...editingContent, metaTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta 描述</label>
              <textarea
                value={editingContent.metaDescription}
                onChange={(e) =>
                  setEditingContent({ ...editingContent, metaDescription: e.target.value })
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签（逗号分隔）
              </label>
              <input
                type="text"
                value={editingContent.tags}
                onChange={(e) => setEditingContent({ ...editingContent, tags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* 右侧：操作面板 */}
        <div className="space-y-6">
          {/* 发布控制 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">发布控制</h3>

            {/* 审核状态 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  {locale === "zh-CN" ? "中文" : "英文"}审核状态
                </span>
                {currentTranslation?.isApproved ? (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    已通过
                  </span>
                ) : (
                  <span className="text-sm text-yellow-600">待审核</span>
                )}
              </div>

              {!currentTranslation?.isApproved && currentTranslation && (
                <button
                  onClick={handleApprove}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <Check className="w-4 h-4" />
                  审核通过
                </button>
              )}
            </div>

            {/* 提交审核 */}
            {post.status === "CONTENT_READY" && (
              <button
                onClick={handleSubmitReview}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm mb-3"
              >
                <Send className="w-4 h-4" />
                提交审核
              </button>
            )}

            {/* 排期发布 */}
            {(post.status === "REVIEW_PENDING" || post.status === "SCHEDULED") && (
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">定时发布</label>
                <input
                  type="datetime-local"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2"
                />
                <button
                  onClick={handleSchedule}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                >
                  <Clock className="w-4 h-4" />
                  设置排期
                </button>
              </div>
            )}

            {/* 立即发布 */}
            {(post.status === "REVIEW_PENDING" || post.status === "SCHEDULED") && (
              <button
                onClick={handlePublishNow}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <Send className="w-4 h-4" />
                立即发布
              </button>
            )}

            {/* 快速翻译 */}
            {currentTranslation?.contentMarkdown && (
              <div className="mt-4">
                <label className="block text-sm text-gray-600 mb-1">翻译到目标语言</label>
                <div className="flex items-center gap-2">
                  <select
                    value={quickTranslateLocale}
                    onChange={(e) => setQuickTranslateLocale(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    {Object.entries(SUPPORTED_LOCALES)
                      .filter(([key]) => key !== locale)
                      .map(([key, name]) => (
                        <option key={key} value={key}>
                          {name}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleQuickTranslate}
                    disabled={translating}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                  >
                    启动
                  </button>
                </div>
                <button
                  onClick={() => setShowTranslateModal(true)}
                  disabled={translating}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  批量翻译
                </button>
              </div>
            )}

            {/* 已发布状态 */}
            {post.status === "PUBLISHED" && currentTranslation?.slug && (
              <Link
                href={`/blog/${currentTranslation.slug}`}
                target="_blank"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Eye className="w-4 h-4" />
                查看文章
              </Link>
            )}
          </div>

          {/* 插图提示词 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              插图提示词
            </h3>

            {imageAssets.length === 0 ? (
              <p className="text-sm text-gray-500">生成大纲后会自动生成插图提示词</p>
            ) : (
              <div className="space-y-3">
                {imageAssets.map((img, idx) => (
                  <div key={img.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-gray-500">
                        图片 {idx + 1}
                        {img.sectionHeading && ` - ${img.sectionHeading}`}
                      </span>
                      <button
                        onClick={() => copyPrompt(img.prompt)}
                        className="p-1 text-gray-400 hover:text-orange-600"
                        title="复制提示词"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-700 line-clamp-3">{img.prompt}</p>
                    {img.aspectRatio && (
                      <span className="text-xs text-gray-400 mt-1 inline-block">
                        比例：{img.aspectRatio}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 大纲预览 */}
          {currentTranslation?.outline && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-3">大纲</h3>
              <div className="space-y-2 text-sm">
                {(currentTranslation.outline as any[]).map((item, idx) => (
                  <div
                    key={idx}
                    className={`${item.level === 3 ? "ml-4" : ""} text-gray-700`}
                  >
                    {item.level === 2 ? "## " : "### "}
                    {item.heading}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 翻译弹窗 */}
      {showTranslateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Languages className="w-5 h-5" />
                批量翻译
              </h3>
              <button
                onClick={() => setShowTranslateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              将 <strong>{SUPPORTED_LOCALES[locale]}</strong> 内容翻译到以下语言：
            </p>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {Object.entries(SUPPORTED_LOCALES)
                .filter(([key]) => key !== locale)
                .map(([key, name]) => {
                  const hasTranslation = post?.translations.some(
                    (t) => t.locale === key && t.contentMarkdown
                  );
                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                        selectedLocales.includes(key)
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLocales.includes(key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLocales([...selectedLocales, key]);
                          } else {
                            setSelectedLocales(selectedLocales.filter((l) => l !== key));
                          }
                        }}
                        className="rounded text-green-600"
                      />
                      <span className="text-sm">{name}</span>
                      {hasTranslation && (
                        <span className="text-xs text-green-600 ml-auto">已有</span>
                      )}
                    </label>
                  );
                })}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => {
                  const allLocales = Object.keys(SUPPORTED_LOCALES).filter((k) => k !== locale);
                  setSelectedLocales(allLocales);
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                全选
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setSelectedLocales([])}
                className="text-sm text-blue-600 hover:underline"
              >
                取消全选
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTranslateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleTranslate}
                disabled={translating || selectedLocales.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {translating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    翻译中...
                  </>
                ) : (
                  <>
                    <Languages className="w-4 h-4" />
                    开始翻译 ({selectedLocales.length})
                  </>
                )}
              </button>
            </div>

            {selectedLocales.length > 3 && (
              <p className="text-xs text-amber-600 mt-3">
                提示：翻译 {selectedLocales.length} 种语言可能需要较长时间，请耐心等待
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
