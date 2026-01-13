"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, FileText, Loader2, Sparkles } from "lucide-react";

interface CreatedPost {
  id: string;
  primaryKeyword: string;
}

export default function BlogGeneratorPage() {
  const [form, setForm] = useState({
    primaryKeyword: "",
    secondaryKeywords: "",
    longTailQuestions: "",
    authorName: "",
  });
  const [creating, setCreating] = useState(false);
  const [createdPost, setCreatedPost] = useState<CreatedPost | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const parseSecondaryKeywords = () =>
    form.secondaryKeywords
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);

  const parseQuestions = () =>
    form.longTailQuestions
      .split(/[;；\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

  async function runStep(request: () => Promise<Response>, label: string) {
    setLogs((prev) => [...prev, `${label}...`]);
    const res = await request();
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `${label}失败`);
    }
    setLogs((prev) => [...prev, `${label}完成`]);
  }

  async function handleCreate(mode: "draft" | "full") {
    if (!form.primaryKeyword.trim()) {
      alert("请输入主关键词");
      return;
    }

    setCreating(true);
    setLogs([]);
    setError(null);
    setCreatedPost(null);

    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryKeyword: form.primaryKeyword.trim(),
          secondaryKeywords: parseSecondaryKeywords(),
          longTailQuestions: parseQuestions(),
          authorName: form.authorName.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "创建失败");

      const newId = data.post?.id || data.id;
      if (newId) {
        setCreatedPost({
          id: newId,
          primaryKeyword: form.primaryKeyword.trim(),
        });
      }

      if (mode === "full" && newId) {
        await runStep(
          () => fetch(`/api/admin/blog/${newId}/generate-outline`, { method: "POST" }),
          "生成大纲"
        );
        await runStep(
          () =>
            fetch(`/api/admin/blog/${newId}/generate-content`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ locale: "zh-CN" }),
            }),
          "生成正文"
        );
      }

      if (!newId) {
        setError("创建成功但未返回博客 ID，请前往列表确认。");
      }
    } catch (err) {
      setError((err as Error).message || "操作失败");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-medium text-textDark mb-2">
            <Sparkles className="w-7 h-7 inline mr-2 text-purple-500" />
            博客生成
          </h1>
          <p className="text-textGray">
            复用博客库的 AI 生成功能，快速产出博客草稿与正文
          </p>
        </div>
        <Link
          href="/admin/blog"
          className="px-4 py-2 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-lg transition-colors"
        >
          返回博客列表
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-stone-200 p-6 space-y-4 shadow-card">
        <div>
          <label className="block text-sm font-medium text-textDark mb-1">
            主关键词 <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="例如：家常川菜做法"
            value={form.primaryKeyword}
            onChange={(e) => setForm({ ...form, primaryKeyword: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-textDark mb-1">
            次关键词（逗号分隔，可选）
          </label>
          <Textarea
            placeholder="川菜,家常菜,快手菜"
            value={form.secondaryKeywords}
            onChange={(e) =>
              setForm({ ...form, secondaryKeywords: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-textDark mb-1">
            长尾问题（换行或分号分隔，可选）
          </label>
          <Textarea
            placeholder={"川菜有哪些经典家常菜？\n快速做川菜的技巧？"}
            value={form.longTailQuestions}
            onChange={(e) =>
              setForm({ ...form, longTailQuestions: e.target.value })
            }
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-textDark mb-1">
            作者名（可选）
          </label>
          <Input
            placeholder="大厨名字"
            value={form.authorName}
            onChange={(e) => setForm({ ...form, authorName: e.target.value })}
          />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 pt-2">
          <Button
            className="flex-1 bg-brownWarm hover:bg-brownDark"
            disabled={creating}
            onClick={() => handleCreate("draft")}
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                处理中...
              </>
            ) : (
              "仅创建草稿"
            )}
          </Button>
          <Button
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            disabled={creating}
            onClick={() => handleCreate("full")}
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                创建并生成正文
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {logs.length > 0 && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm space-y-1">
            {logs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        )}
      </div>

      {createdPost && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <p className="text-green-800 font-medium">
              草稿已创建：{createdPost.primaryKeyword}
            </p>
            <p className="text-sm text-green-700">ID：{createdPost.id}</p>
          </div>
          <Link
            href={`/admin/blog/${createdPost.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700"
          >
            <FileText className="h-4 w-4" />
            去编辑/发布
          </Link>
        </div>
      )}
    </div>
  );
}
