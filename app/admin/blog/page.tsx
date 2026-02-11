/**
 * 管理端 - 博客列表页
 * 优化版：更好的用户体验
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";

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

// 确认弹窗组件
function ConfirmDialog({
  title,
  message,
  confirmText = "确定",
  cancelText = "取消",
  confirmType = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmType?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmBtnClass = confirmType === "danger"
    ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-orange-600 hover:bg-orange-700 text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 animate-scale-in">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            confirmType === "danger" ? "bg-red-100" : "bg-orange-100"
          }`}>
            <AlertCircle className={`w-5 h-5 ${
              confirmType === "danger" ? "text-red-600" : "text-orange-600"
            }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${confirmBtnClass}`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface BlogPost {
  id: string;
  primaryKeyword: string;
  status: string;
  publishAt: string | null;
  publishedAt: string | null;
  authorName: string | null;
  createdAt: string;
  translations: {
    id: string;
    locale: string;
    title: string;
    slug: string;
    isApproved: boolean;
  }[];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: "草稿", color: "bg-gray-100 text-gray-700", icon: FileText },
  OUTLINE_READY: { label: "大纲就绪", color: "bg-blue-100 text-blue-700", icon: FileText },
  CONTENT_READY: { label: "内容就绪", color: "bg-purple-100 text-purple-700", icon: FileText },
  REVIEW_PENDING: { label: "待审核", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
  SCHEDULED: { label: "已排期", color: "bg-orange-100 text-orange-700", icon: Clock },
  PUBLISHED: { label: "已发布", color: "bg-green-100 text-green-700", icon: CheckCircle },
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchKeyword, setSearchKeyword] = useState("");

  // 新建博客的表单状态
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({
    primaryKeyword: "",
    secondaryKeywords: "",
    longTailQuestions: "",
    authorName: "",
  });
  const [creating, setCreating] = useState(false);

  // Toast 通知
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = useCallback((message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  }, []);

  // 删除确认弹窗
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; keyword: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 加载博客列表
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/blog?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [statusFilter]);

  // 创建博客
  const handleCreate = async () => {
    if (!newPost.primaryKeyword.trim()) {
      showToast("请输入主关键词", "error");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryKeyword: newPost.primaryKeyword.trim(),
          secondaryKeywords: newPost.secondaryKeywords
            .split(/[,，]/)
            .map((s) => s.trim())
            .filter(Boolean),
          longTailQuestions: newPost.longTailQuestions
            .split(/[;；\n]/)
            .map((s) => s.trim())
            .filter(Boolean),
          authorName: newPost.authorName.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "创建失败");
      }
      setShowCreateForm(false);
      setNewPost({ primaryKeyword: "", secondaryKeywords: "", longTailQuestions: "", authorName: "" });
      showToast("博客创建成功，正在跳转...", "success");

      // 跳转到编辑页
      setTimeout(() => {
        window.location.href = `/admin/blog/${data.post.id}`;
      }, 500);
    } catch (error) {
      console.error("Failed to create:", error);
      showToast((error as Error).message || "创建失败", "error");
    } finally {
      setCreating(false);
    }
  };

  // 删除博客
  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/blog/${deleteConfirm.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("删除成功", "success");
        fetchPosts();
      } else {
        throw new Error("删除失败");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      showToast("删除失败", "error");
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  // 过滤
  const filteredPosts = posts.filter((post) => {
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      const matchesKeyword = post.primaryKeyword.toLowerCase().includes(keyword);
      const matchesTitle = post.translations.some((t) =>
        t.title.toLowerCase().includes(keyword)
      );
      return matchesKeyword || matchesTitle;
    }
    return true;
  });

  return (
    <div className="p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">博客管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理博客文章，支持 AI 生成内容
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建博客
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索关键词或标题..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="">全部状态</option>
            {Object.entries(STATUS_MAP).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无博客</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-4 text-orange-600 hover:underline"
          >
            创建第一篇博客
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  关键词/标题
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  语言版本
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  创建时间
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPosts.map((post) => {
                const statusInfo = STATUS_MAP[post.status] || STATUS_MAP.DRAFT;
                const StatusIcon = statusInfo.icon;

                return (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">
                        {post.translations[0]?.title || post.primaryKeyword}
                      </div>
                      <div className="text-sm text-gray-500">
                        {post.primaryKeyword}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        {post.translations.map((t) => (
                          <span
                            key={t.locale}
                            className={`px-2 py-0.5 text-xs rounded ${
                              t.isApproved
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {t.locale === "zh-CN" ? "中" : "EN"}
                            {t.isApproved && " ✓"}
                          </span>
                        ))}
                        {post.translations.length === 0 && (
                          <span className="text-gray-400 text-sm">无</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/blog/${post.id}`}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        {post.status === "PUBLISHED" && post.translations[0]?.slug && (
                          <Link
                            href={`/blog/${post.translations[0].slug}`}
                            target="_blank"
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="预览"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => setDeleteConfirm({ id: post.id, keyword: post.primaryKeyword })}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 新建博客弹窗 */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">新建博客</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  主关键词 *
                </label>
                <input
                  type="text"
                  value={newPost.primaryKeyword}
                  onChange={(e) =>
                    setNewPost({ ...newPost, primaryKeyword: e.target.value })
                  }
                  placeholder="例如：家常红烧肉"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  次关键词（逗号分隔）
                </label>
                <input
                  type="text"
                  value={newPost.secondaryKeywords}
                  onChange={(e) =>
                    setNewPost({ ...newPost, secondaryKeywords: e.target.value })
                  }
                  placeholder="例如：红烧肉做法，五花肉，下饭菜"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  长尾问题（分号或换行分隔）
                </label>
                <textarea
                  value={newPost.longTailQuestions}
                  onChange={(e) =>
                    setNewPost({ ...newPost, longTailQuestions: e.target.value })
                  }
                  placeholder="例如：红烧肉怎么做才入味？；红烧肉用什么肉最好？"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  作者名称
                </label>
                <input
                  type="text"
                  value={newPost.authorName}
                  onChange={(e) =>
                    setNewPost({ ...newPost, authorName: e.target.value })
                  }
                  placeholder="可选"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {creating ? "创建中..." : "创建并编辑"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirm && (
        <ConfirmDialog
          title="确认删除"
          message={`确定要删除博客「${deleteConfirm.keyword}」吗？此操作不可撤销。`}
          confirmText="删除"
          cancelText="取消"
          confirmType="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Toast 通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 动画样式 */}
      <style jsx global>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}
