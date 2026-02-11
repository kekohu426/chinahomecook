/**
 * 管理端 - 博客编辑页
 * 优化版：更好的用户体验
 */

"use client";

import { useState, useEffect, use, useCallback } from "react";
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
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Wand2,
  Zap,
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
  coverImage?: string;
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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "草稿", color: "bg-gray-100 text-gray-600" },
  OUTLINE_READY: { label: "大纲就绪", color: "bg-blue-100 text-blue-600" },
  CONTENT_READY: { label: "内容就绪", color: "bg-purple-100 text-purple-600" },
  REVIEW_PENDING: { label: "待审核", color: "bg-yellow-100 text-yellow-600" },
  SCHEDULED: { label: "已排期", color: "bg-orange-100 text-orange-600" },
  PUBLISHED: { label: "已发布", color: "bg-green-100 text-green-600" },
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

// Toast 通知组件
function Toast({ message, type, onClose }: { message: string; type: "success" | "error" | "info"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-blue-600";
  const Icon = type === "success" ? CheckCircle2 : type === "error" ? AlertCircle : Loader2;

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-slide-up`}>
      <Icon className={`w-5 h-5 ${type === "info" ? "animate-spin" : ""}`} />
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// 生成进度组件
function GenerationProgress({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
      <div className="flex items-center gap-2 mb-3">
        <Wand2 className="w-5 h-5 text-purple-600 animate-pulse" />
        <span className="font-medium text-purple-900">AI 正在生成内容...</span>
      </div>
      <div className="space-y-2">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {idx < currentStep ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : idx === currentStep ? (
              <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            )}
            <span className={`text-sm ${idx <= currentStep ? "text-gray-900" : "text-gray-400"}`}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
  const [generationStep, setGenerationStep] = useState(0);
  const generationSteps = ["连接 AI 服务", "生成标题和大纲", "撰写正文内容", "优化 SEO 信息", "生成封面图", "生成文章插图"];

  // 封面图生成状态
  const [generatingCover, setGeneratingCover] = useState(false);
  const [coverImagePrompt, setCoverImagePrompt] = useState("");

  // 翻译状态
  const [translating, setTranslating] = useState(false);
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);
  const [quickTranslateLocale, setQuickTranslateLocale] = useState("en");

  // 发布设置
  const [publishAt, setPublishAt] = useState("");

  // Toast 通知
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  }, []);

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
          ogImage: translation.ogImage || data.post.coverImage || "",
        });
      }

      // 加载封面图提示词
      if (data.post.imageAssets?.[0]?.prompt) {
        setCoverImagePrompt(data.post.imageAssets[0].prompt);
      }

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to fetch post:", error);
      showToast("加载失败", "error");
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
        ogImage: translation.ogImage || post.coverImage || "",
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

  // 更新内容时标记未保存
  const updateContent = (updates: Partial<typeof editingContent>) => {
    setEditingContent(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

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
      showToast("保存成功", "success");
      setHasUnsavedChanges(false);
      fetchPost();
    } catch (error) {
      console.error("Failed to save:", error);
      showToast("保存失败: " + (error as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  // 一键生成
  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setGenerationStep(0);

      // 模拟进度
      const progressTimer = setInterval(() => {
        setGenerationStep(prev => Math.min(prev + 1, 3));
      }, 8000);

      const res = await fetch(`/api/admin/blog/${id}/generate-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });

      clearInterval(progressTimer);
      setGenerationStep(4);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "生成失败");
      }

      // 自动填充所有字段
      setEditingContent({
        title: data.data.title || "",
        summary: data.data.excerpt || "",
        contentMarkdown: data.data.content || "",
        contentHtml: markdownToHtml(data.data.content || ""),
        metaTitle: data.data.metaTitle || "",
        metaDescription: data.data.metaDescription || "",
        slug: data.data.slug || "",
        tags: data.data.tags?.join(", ") || "",
        ogImage: editingContent.ogImage || "",
      });

      // 设置封面图提示词
      if (data.data.coverImagePrompt) {
        setCoverImagePrompt(data.data.coverImagePrompt);
      }

      showToast("内容生成成功！", "success");
      setHasUnsavedChanges(true);

      // 自动保存
      setTimeout(() => {
        handleSave();
      }, 500);

    } catch (error) {
      console.error("Failed to generate:", error);
      showToast("生成失败: " + (error as Error).message, "error");
    } finally {
      setGenerating(false);
      setGenerationStep(0);
    }
  };

  // 重新生成正文
  const handleRegenerateContent = async () => {
    try {
      setGenerating(true);
      showToast("正在重新生成正文...", "info");

      const res = await fetch(`/api/admin/blog/${id}/generate-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "生成失败");
      }

      showToast("正文生成成功！", "success");
      fetchPost();
    } catch (error) {
      console.error("Failed to generate content:", error);
      showToast("生成失败: " + (error as Error).message, "error");
    } finally {
      setGenerating(false);
    }
  };

  // 生成封面图
  const handleGenerateCover = async () => {
    const promptToUse = coverImagePrompt || post?.imageAssets?.[0]?.prompt;
    if (!promptToUse) {
      showToast("请先生成内容以获取封面图提示词", "error");
      return;
    }

    try {
      setGeneratingCover(true);
      showToast("正在生成封面图...", "info");

      const res = await fetch(`/api/admin/blog/${id}/generate-cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptToUse, locale }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "封面图生成失败");
      }

      // 更新封面图 URL
      updateContent({ ogImage: data.data.imageUrl });
      showToast("封面图生成成功！", "success");
      fetchPost();
    } catch (error) {
      console.error("Failed to generate cover:", error);
      showToast("封面图生成失败: " + (error as Error).message, "error");
    } finally {
      setGeneratingCover(false);
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
      showToast("审核通过！", "success");
      fetchPost();
    } catch (error) {
      showToast("操作失败", "error");
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
      showToast("已提交审核！", "success");
      fetchPost();
    } catch (error) {
      showToast("操作失败", "error");
    }
  };

  // 排期发布
  const handleSchedule = async () => {
    if (!publishAt) {
      showToast("请选择发布时间", "error");
      return;
    }

    try {
      const res = await fetch(`/api/admin/blog/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schedule", publishAt }),
      });

      if (!res.ok) throw new Error("操作失败");
      showToast("排期设置成功！", "success");
      fetchPost();
    } catch (error) {
      showToast("操作失败", "error");
    }
  };

  // 立即发布
  const handlePublishNow = async () => {
    try {
      const res = await fetch(`/api/admin/blog/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish_now" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");
      showToast("发布成功！", "success");
      fetchPost();
    } catch (error) {
      showToast((error as Error).message, "error");
    }
  };

  // 复制提示词
  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("已复制到剪贴板", "success");
  };

  useEffect(() => {
    const defaultTarget =
      Object.keys(SUPPORTED_LOCALES).find((key) => key !== locale) || "en";
    setQuickTranslateLocale(defaultTarget);
  }, [locale]);

  // 批量翻译
  const handleTranslate = async () => {
    if (selectedLocales.length === 0) {
      showToast("请选择目标语言", "error");
      return;
    }

    try {
      setTranslating(true);
      showToast(`正在翻译到 ${selectedLocales.length} 种语言...`, "info");

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

      const successCount = Object.values(data.results).filter((r: any) => r.success).length;
      showToast(`翻译完成：${successCount} 种语言成功`, "success");

      setShowTranslateModal(false);
      setSelectedLocales([]);
      fetchPost();
    } catch (error) {
      showToast("翻译失败: " + (error as Error).message, "error");
    } finally {
      setTranslating(false);
    }
  };

  const handleQuickTranslate = async () => {
    if (!quickTranslateLocale || quickTranslateLocale === locale) {
      showToast("请选择目标语言", "error");
      return;
    }

    try {
      setTranslating(true);
      showToast(`正在翻译到 ${SUPPORTED_LOCALES[quickTranslateLocale]}...`, "info");

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
        showToast(`${SUPPORTED_LOCALES[quickTranslateLocale]} 翻译完成`, "success");
      } else {
        throw new Error(result?.error || "翻译失败");
      }

      fetchPost();
    } catch (error) {
      showToast("翻译失败: " + (error as Error).message, "error");
    } finally {
      setTranslating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">博客不存在</p>
          <Link href="/admin/blog" className="text-purple-600 hover:underline">
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  const currentTranslation = post.translations.find((t) => t.locale === locale);
  const imageAssets = post.imageAssets?.filter((img) => img.locale === locale) || [];
  const statusInfo = STATUS_LABELS[post.status] || STATUS_LABELS.DRAFT;
  const hasContent = !!currentTranslation?.contentMarkdown;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部固定导航 */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* 左侧：返回和标题 */}
            <div className="flex items-center gap-4">
              <Link
                href="/admin/blog"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                    {editingContent.title || post.primaryKeyword || "未命名博客"}
                  </h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  {hasUnsavedChanges && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-600">
                      未保存
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  关键词：{post.primaryKeyword}
                </p>
              </div>
            </div>

            {/* 右侧：操作按钮 */}
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

              {/* 保存按钮 */}
              <button
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  hasUnsavedChanges
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：主编辑区 */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI 生成卡片 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {generating ? (
                <div className="p-6">
                  <GenerationProgress steps={generationSteps} currentStep={generationStep} />
                </div>
              ) : !hasContent ? (
                <div className="p-8 text-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Wand2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">AI 一键生成</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    基于关键词「{post.primaryKeyword}」自动生成标题、正文、SEO 信息和封面图提示词
                  </p>
                  <button
                    onClick={handleGenerate}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <Zap className="w-5 h-5" />
                    开始生成
                  </button>
                </div>
              ) : (
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    内容已生成
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      重新生成全部
                    </button>
                    <button
                      onClick={() => setShowTranslateModal(true)}
                      disabled={translating}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Languages className="w-4 h-4" />
                      翻译
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 标题和摘要 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">标题</label>
                <input
                  type="text"
                  value={editingContent.title}
                  onChange={(e) => updateContent({ title: e.target.value })}
                  placeholder="输入博客标题..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">摘要</label>
                <textarea
                  value={editingContent.summary}
                  onChange={(e) => updateContent({ summary: e.target.value })}
                  placeholder="输入博客摘要..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow resize-none"
                />
              </div>
            </div>

            {/* 富文本编辑器 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-100 px-4 py-3 bg-gray-50">
                <span className="text-sm font-medium text-gray-700">正文内容</span>
              </div>
              <RichTextEditor
                content={editingContent.contentHtml || ""}
                onChange={(html, markdown) => {
                  updateContent({
                    contentHtml: html,
                    contentMarkdown: markdown,
                  });
                }}
                placeholder="开始编辑博客内容，可直接粘贴图片..."
              />
            </div>

            {/* SEO 设置 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                SEO 设置
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Slug</label>
                  <input
                    type="text"
                    value={editingContent.slug}
                    onChange={(e) => updateContent({ slug: e.target.value })}
                    placeholder="url-friendly-slug"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">标签</label>
                  <input
                    type="text"
                    value={editingContent.tags}
                    onChange={(e) => updateContent({ tags: e.target.value })}
                    placeholder="标签1, 标签2, 标签3"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta 标题</label>
                <input
                  type="text"
                  value={editingContent.metaTitle}
                  onChange={(e) => updateContent({ metaTitle: e.target.value })}
                  placeholder="SEO 标题（50-60字符）"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                />
                <p className="text-xs text-gray-400 mt-1">{editingContent.metaTitle.length}/60 字符</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta 描述</label>
                <textarea
                  value={editingContent.metaDescription}
                  onChange={(e) => updateContent({ metaDescription: e.target.value })}
                  placeholder="SEO 描述（150-160字符）"
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{editingContent.metaDescription.length}/160 字符</p>
              </div>
            </div>
          </div>

          {/* 右侧：侧边栏 */}
          <div className="space-y-6">
            {/* 封面图片 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-400" />
                  封面图片
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {/* 封面图预览 */}
                {editingContent.ogImage ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 group">
                    <img
                      src={editingContent.ogImage}
                      alt="封面预览"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-size="12">加载失败</text></svg>';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => updateContent({ ogImage: "" })}
                        className="px-3 py-1.5 bg-white/90 text-gray-900 rounded-lg text-sm font-medium"
                      >
                        移除图片
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200">
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">暂无封面图</p>
                    </div>
                  </div>
                )}

                {/* 封面图提示词 */}
                {(coverImagePrompt || imageAssets[0]?.prompt) && (
                  <div className="bg-purple-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-purple-700">AI 提示词</span>
                      <button
                        onClick={() => copyPrompt(coverImagePrompt || imageAssets[0]?.prompt || "")}
                        className="p-1 text-purple-400 hover:text-purple-600 transition-colors"
                        title="复制提示词"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-purple-600 line-clamp-2">
                      {coverImagePrompt || imageAssets[0]?.prompt}
                    </p>
                  </div>
                )}

                {/* 生成封面图按钮 */}
                <button
                  onClick={handleGenerateCover}
                  disabled={generatingCover || (!coverImagePrompt && !imageAssets[0]?.prompt)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
                >
                  {generatingCover ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      生成封面图
                    </>
                  )}
                </button>

                {/* 手动输入 URL */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">或手动输入图片 URL</label>
                  <input
                    type="text"
                    value={editingContent.ogImage}
                    onChange={(e) => updateContent({ ogImage: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 发布控制 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <h3 className="font-medium text-gray-900">发布控制</h3>

              {/* 审核状态 */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">审核状态</span>
                {currentTranslation?.isApproved ? (
                  <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                    <Check className="w-4 h-4" />
                    已通过
                  </span>
                ) : (
                  <span className="text-sm text-amber-600 font-medium">待审核</span>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="space-y-2">
                {!currentTranslation?.isApproved && currentTranslation && (
                  <button
                    onClick={handleApprove}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    审核通过
                  </button>
                )}

                {post.status === "CONTENT_READY" && (
                  <button
                    onClick={handleSubmitReview}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    提交审核
                  </button>
                )}

                {(post.status === "REVIEW_PENDING" || post.status === "SCHEDULED" || post.status === "CONTENT_READY") && (
                  <button
                    onClick={handlePublishNow}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    立即发布
                  </button>
                )}

                {post.status === "PUBLISHED" && currentTranslation?.slug && (
                  <Link
                    href={`/zh/blog/${currentTranslation.slug}`}
                    target="_blank"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    查看文章
                  </Link>
                )}
              </div>

              {/* 定时发布 */}
              {(post.status === "REVIEW_PENDING" || post.status === "SCHEDULED") && (
                <div className="pt-3 border-t border-gray-100">
                  <label className="block text-sm text-gray-600 mb-2">定时发布</label>
                  <input
                    type="datetime-local"
                    value={publishAt}
                    onChange={(e) => setPublishAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2"
                  />
                  <button
                    onClick={handleSchedule}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    设置排期
                  </button>
                </div>
              )}

              {/* 快速翻译 */}
              {hasContent && (
                <div className="pt-3 border-t border-gray-100">
                  <label className="block text-sm text-gray-600 mb-2">快速翻译</label>
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
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : "翻译"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 大纲预览 */}
            {currentTranslation?.outline && Array.isArray(currentTranslation.outline) && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-3">文章大纲</h3>
                <div className="space-y-1.5">
                  {(currentTranslation.outline as any[]).map((item, idx) => (
                    <div
                      key={idx}
                      className={`text-sm ${item.level === 3 ? "ml-4 text-gray-500" : "text-gray-700 font-medium"}`}
                    >
                      {item.level === 2 ? "📍 " : "  · "}
                      {item.heading}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 翻译弹窗 */}
      {showTranslateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Languages className="w-5 h-5 text-green-600" />
                批量翻译
              </h3>
              <button
                onClick={() => setShowTranslateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                将 <strong>{SUPPORTED_LOCALES[locale]}</strong> 内容翻译到：
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.entries(SUPPORTED_LOCALES)
                  .filter(([key]) => key !== locale)
                  .map(([key, name]) => {
                    const hasTranslation = post?.translations.some(
                      (t) => t.locale === key && t.contentMarkdown
                    );
                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                          selectedLocales.includes(key)
                            ? "border-green-500 bg-green-50 ring-2 ring-green-200"
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
                          className="rounded text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium">{name}</span>
                        {hasTranslation && (
                          <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                        )}
                      </label>
                    );
                  })}
              </div>

              <div className="flex items-center gap-3 text-sm mb-4">
                <button
                  onClick={() => {
                    const allLocales = Object.keys(SUPPORTED_LOCALES).filter((k) => k !== locale);
                    setSelectedLocales(allLocales);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  全选
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setSelectedLocales([])}
                  className="text-blue-600 hover:underline"
                >
                  取消全选
                </button>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowTranslateModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-white font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleTranslate}
                disabled={translating || selectedLocales.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
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
          </div>
        </div>
      )}

      {/* Toast 通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 添加动画样式 */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
