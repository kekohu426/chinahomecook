"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  FileText,
  Loader2,
} from "lucide-react";

interface BlogTranslation {
  id: string;
  locale: string;
  title: string;
  isApproved: boolean;
}

interface BlogPost {
  id: string;
  primaryKeyword: string;
  status: string;
  createdAt: string;
  authorName: string | null;
  translations: BlogTranslation[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  REVIEW_PENDING: { label: "待审核", color: "bg-amber-100 text-amber-700" },
  DRAFT: { label: "草稿", color: "bg-gray-100 text-gray-700" },
  CONTENT_READY: { label: "内容就绪", color: "bg-purple-100 text-purple-700" },
  PUBLISHED: { label: "已发布", color: "bg-green-100 text-green-700" },
};

export default function BlogReviewPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog?status=REVIEW_PENDING");
      const data = await res.json();
      setPosts(data.posts || data.data?.posts || []);
    } catch (error) {
      console.error("加载待审核博客失败:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      setActionId(id);
      const res = await fetch(`/api/admin/blog/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", locale: "zh-CN" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");
      alert("审核通过");
      loadPosts();
    } catch (error) {
      alert((error as Error).message || "操作失败");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-medium text-textDark mb-2">
            博客待审核列表
          </h1>
          <p className="text-textGray">
            查看待审核的博客，支持快速通过并跳转详情页
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadPosts} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "刷新"}
          </Button>
          <Link href="/admin/blog">
            <Button variant="outline">返回博客列表</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-textGray">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          加载中...
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <p className="text-textGray">暂无待审核的博客</p>
          <Link
            href="/admin/ai/blog"
            className="text-brownWarm hover:underline mt-2 inline-block"
          >
            去生成新博客 →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => {
            const statusInfo =
              STATUS_LABELS[post.status] ||
              { label: post.status, color: "bg-gray-100 text-gray-700" };
            const pendingLocales = post.translations.filter(
              (t) => !t.isApproved
            );

            return (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow-card border border-stone-100 p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-textGray">
                    创建时间：{new Date(post.createdAt).toLocaleString("zh-CN")}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${statusInfo.color}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brownWarm" />
                  <div>
                    <div className="text-lg font-medium text-textDark">
                      {post.primaryKeyword}
                    </div>
                    {post.authorName && (
                      <div className="text-xs text-textGray">
                        作者：{post.authorName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-sm text-textGray">
                  翻译：{post.translations.length} 个
                  {pendingLocales.length > 0 && (
                    <span className="ml-2 text-amber-600">
                      待审核 {pendingLocales.length} 个
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  {post.translations.map((t) => (
                    <span
                      key={t.id}
                      className={`px-2 py-1 rounded ${
                        t.isApproved
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {t.locale} · {t.title || "未命名"}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <Link href={`/admin/blog/${post.id}`} className="flex-1">
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                      <Eye className="h-4 w-4" />
                      查看/编辑
                    </Button>
                  </Link>
                  <Button
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleApprove(post.id)}
                    disabled={actionId === post.id}
                  >
                    {actionId === post.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    审核通过
                  </Button>
                </div>

                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  审核操作将直接调用发布接口，注意确认内容质量
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
