"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Edit2,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  Plus,
  Upload,
  FolderUp,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";

interface IngredientIcon {
  id: string;
  name: string;
  aliases: string[];
  iconUrl: string | null;
  prompt: string | null;
  source: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default function IconsPage() {
  const [icons, setIcons] = useState<IngredientIcon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [formState, setFormState] = useState({
    name: "",
    aliases: "",
    iconUrl: "",
    prompt: "",
    source: "",
    sortOrder: "0",
    isActive: true,
  });

  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [exportingMissing, setExportingMissing] = useState(false);
  const [batchResults, setBatchResults] = useState<{
    name: string;
    iconUrl: string;
    success: boolean;
    error?: string;
  }[] | null>(null);
  const [batchGenerateResults, setBatchGenerateResults] = useState<{
    name: string;
    iconUrl?: string;
    success: boolean;
    error?: string;
  }[] | null>(null);

  const filteredIcons = useMemo(
    () => (showMissingOnly ? icons.filter((icon) => !icon.iconUrl) : icons),
    [icons, showMissingOnly]
  );
  const selectedIcons = useMemo(
    () => icons.filter((icon) => selectedIds.has(icon.id)),
    [icons, selectedIds]
  );
  const selectedMissingIcons = useMemo(
    () => selectedIcons.filter((icon) => !icon.iconUrl),
    [selectedIcons]
  );
  const missingCount = useMemo(
    () => icons.filter((icon) => !icon.iconUrl).length,
    [icons]
  );

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormState({
      name: "",
      aliases: "",
      iconUrl: "",
      prompt: "",
      source: "",
      sortOrder: "0",
      isActive: true,
    });
  };

  async function loadData() {
    try {
      const res = await fetch("/api/config/ingredient-icons");
      const data = await res.json();
      if (data.success) {
        // 排序：待补充图标优先显示，其次按 sortOrder 排序
        const sorted = [...data.data].sort((a: IngredientIcon, b: IngredientIcon) => {
          // 先按是否有图标排序（无图标的排前面）
          if (!a.iconUrl && b.iconUrl) return -1;
          if (a.iconUrl && !b.iconUrl) return 1;
          // 再按 sortOrder 排序
          return (a.sortOrder || 0) - (b.sortOrder || 0);
        });
        setIcons(sorted);
        const nextIdSet = new Set(sorted.map((icon) => icon.id));
        setSelectedIds((prev) => new Set([...prev].filter((id) => nextIdSet.has(id))));
      }
    } catch (error) {
      console.error("加载图标失败:", error);
      alert("加载图标失败");
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (icon: IngredientIcon) => {
    setEditingId(icon.id);
    setShowForm(true);
    setFormState({
      name: icon.name,
      aliases: icon.aliases?.join(", ") || "",
      iconUrl: icon.iconUrl || "",
      prompt: icon.prompt || "",
      source: icon.source || "",
      sortOrder: String(icon.sortOrder ?? 0),
      isActive: icon.isActive,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个图标吗？")) return;

    try {
      const res = await fetch(`/api/config/ingredient-icons/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("删除失败");
      alert("删除成功");
      loadData();
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败");
    }
  };

  const parseAliases = (value: string) =>
    value
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formState.name.trim(),
      aliases: parseAliases(formState.aliases),
      iconUrl: formState.iconUrl.trim() || null,
      prompt: formState.prompt.trim() || null,
      source: formState.source.trim() || null,
      sortOrder: Number(formState.sortOrder) || 0,
      isActive: formState.isActive,
    };

    if (!payload.name) {
      alert("名称为必填项");
      return;
    }

    setSaving(true);
    try {
      const endpoint = editingId
        ? `/api/config/ingredient-icons/${editingId}`
        : "/api/config/ingredient-icons";
      const method = editingId ? "PUT" : "POST";

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

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "ingredient-icons");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "上传失败");
      }

      const data = await response.json();
      setFormState((prev) => ({
        ...prev,
        iconUrl: data.url,
        source: "upload",
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formState.prompt.trim()) {
      alert("请输入提示词");
      return;
    }

    // 如果没有名称，用提示词的前几个字作为名称
    const autoName = formState.name.trim() || formState.prompt.trim().slice(0, 10);

    setGenerating(true);
    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: formState.prompt.trim(),
          negativePrompt: "模糊，低质量，变形，文字，水印",
          width: 768,
          height: 768,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "生成失败");
      }

      // 更新表单状态
      const newFormState = {
        ...formState,
        name: autoName,
        iconUrl: data.imageUrl,
        source: "ai",
      };
      setFormState(newFormState);

      // 自动保存到数据库
      await autoSaveIcon(autoName, data.imageUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : "生成失败");
    } finally {
      setGenerating(false);
    }
  };

  // 自动保存图标
  const autoSaveIcon = async (name: string, iconUrl: string) => {
    try {
      const payload = {
        name: name.trim(),
        aliases: parseAliases(formState.aliases),
        iconUrl: iconUrl.trim(),
        prompt: formState.prompt.trim() || null,
        source: "ai",
        sortOrder: Number(formState.sortOrder) || 0,
        isActive: true,
      };

      const res = await fetch("/api/config/ingredient-icons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("保存失败");

      // 刷新列表并关闭表单
      resetForm();
      loadData();
    } catch (error) {
      console.error("自动保存失败:", error);
      // 不弹窗，让用户可以手动保存
    }
  };

  const handleToggleActive = async (icon: IngredientIcon) => {
    try {
      const res = await fetch(`/api/config/ingredient-icons/${icon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...icon, isActive: !icon.isActive }),
      });
      if (!res.ok) throw new Error("更新失败");
      loadData();
    } catch (error) {
      console.error("更新失败:", error);
      alert("更新失败");
    }
  };

  const toggleSelectAll = () => {
    if (filteredIcons.length === 0) return;
    const allSelected = filteredIcons.every((icon) => selectedIds.has(icon.id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredIcons.forEach((icon) => next.delete(icon.id));
        return next;
      });
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredIcons.forEach((icon) => next.add(icon.id));
      return next;
    });
  };

  const handleBatchGenerate = async () => {
    if (selectedMissingIcons.length === 0) {
      alert("请选择待补充图标的食材");
      return;
    }

    setBatchGenerating(true);
    setBatchGenerateResults(null);

    const results: {
      name: string;
      iconUrl?: string;
      success: boolean;
      error?: string;
    }[] = [];

    for (const icon of selectedMissingIcons) {
      const prompt =
        icon.prompt?.trim() ||
        `${icon.name}，食材图标，写实风格，白色背景，居中，高清`;

      try {
        const response = await fetch("/api/images/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            negativePrompt: "模糊，低质量，变形，文字，水印",
            width: 768,
            height: 768,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success || !data.imageUrl) {
          throw new Error(data.error || "生成失败");
        }

        const updateRes = await fetch(`/api/config/ingredient-icons/${icon.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: icon.name,
            aliases: icon.aliases,
            iconUrl: data.imageUrl,
            prompt,
            source: "ai",
            sortOrder: icon.sortOrder,
            isActive: icon.isActive,
          }),
        });

        if (!updateRes.ok) {
          throw new Error("保存失败");
        }

        results.push({
          name: icon.name,
          iconUrl: data.imageUrl,
          success: true,
        });
      } catch (error) {
        results.push({
          name: icon.name,
          success: false,
          error: error instanceof Error ? error.message : "生成失败",
        });
      }
    }

    setBatchGenerateResults(results);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      selectedMissingIcons.forEach((icon) => next.delete(icon.id));
      return next;
    });
    await loadData();
    setBatchGenerating(false);
  };

  // 批量上传处理
  const handleBatchUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setBatchUploading(true);
    setBatchResults(null);

    try {
      const MAX_FILES_PER_BATCH = 3;
      const fileArray = Array.from(files);
      const allResults: any[] = [];

      for (let i = 0; i < fileArray.length; i += MAX_FILES_PER_BATCH) {
        const batch = fileArray.slice(i, i + MAX_FILES_PER_BATCH);
        const formData = new FormData();
        batch.forEach((file) => {
          formData.append("files", file);
        });

        const res = await fetch("/api/icons/batch-upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "上传失败");
        }

        if (Array.isArray(data.results)) {
          allResults.push(...data.results);
        }
      }

      setBatchResults(allResults);
      loadData(); // 刷新列表
    } catch (error) {
      console.error("批量上传失败:", error);
      alert(error instanceof Error ? error.message : "批量上传失败");
    } finally {
      setBatchUploading(false);
    }
  };

  const handleExportMissingIcons = async () => {
    setExportingMissing(true);
    try {
      const names = Array.from(
        new Set(
          icons
            .filter((icon) => !icon.iconUrl)
            .map((icon) => icon.name.trim())
            .filter(Boolean)
        )
      );

      if (names.length === 0) {
        alert("暂无待补全图标的食材");
        return;
      }

      const content = names.join("\n");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `missing-icon-ingredients-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("导出失败:", error);
      alert(error instanceof Error ? error.message : "导出失败");
    } finally {
      setExportingMissing(false);
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
            食材图标管理
          </h1>
          <p className="text-sage-500">
            管理食材图标库，支持上传和 AI 生成
          </p>
          {/* 待补充统计 */}
          {missingCount > 0 && (
            <p className="mt-2 text-orange-600 text-sm">
              ⚠️ 有 <strong>{missingCount}</strong> 个食材待补充图标
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={() => setShowMissingOnly((prev) => !prev)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              showMissingOnly
                ? "border-orange-300 bg-orange-50 text-orange-700"
                : "border-sage-200 text-sage-600 hover:border-sage-400"
            }`}
          >
            {showMissingOnly ? "查看全部" : "仅看无图标"}
          </button>
          <div className="text-sm text-sage-500">
            已选 {selectedIcons.length}，待补全 {selectedMissingIcons.length}
          </div>
          <button
            onClick={handleBatchGenerate}
            disabled={batchGenerating || selectedMissingIcons.length === 0}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {batchGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                批量 AI 生成
              </>
            )}
          </button>
          <button
            onClick={handleExportMissingIcons}
            disabled={exportingMissing}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {exportingMissing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                导出待补全食材
              </>
            )}
          </button>
          {/* 批量上传按钮 */}
          <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer">
            <FolderUp className="w-4 h-4" />
            {batchUploading ? "上传中..." : "批量上传"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={batchUploading}
              onChange={(e) => {
                if (e.target.files) {
                  handleBatchUpload(e.target.files);
                  e.target.value = ""; // 清空，允许重复选择同文件
                }
              }}
            />
          </label>
          {/* 新增单个图标按钮 */}
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新增图标
          </button>
        </div>
      </div>

      {/* 批量上传结果 */}
      {batchResults && (
        <div className="bg-white rounded-lg border border-sage-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-sage-800">
              批量上传结果
            </h2>
            <button
              onClick={() => setBatchResults(null)}
              className="text-sage-500 hover:text-sage-700 text-sm"
            >
              关闭
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {batchResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.success
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                {result.success && result.iconUrl && (
                  <img
                    src={result.iconUrl}
                    alt={result.name}
                    className="w-12 h-12 object-cover rounded mx-auto mb-2"
                  />
                )}
                <div className="flex items-center justify-center gap-1">
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm truncate ${
                      result.success ? "text-green-700" : "text-red-700"
                    }`}
                    title={result.error || result.name}
                  >
                    {result.name}
                  </span>
                </div>
                {result.error && (
                  <p className="text-xs text-red-500 text-center mt-1">
                    {result.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 批量 AI 生成结果 */}
      {batchGenerateResults && (
        <div className="bg-white rounded-lg border border-sage-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-sage-800">
              批量 AI 生成结果
            </h2>
            <button
              onClick={() => setBatchGenerateResults(null)}
              className="text-sage-500 hover:text-sage-700 text-sm"
            >
              关闭
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {batchGenerateResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.success
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                {result.success && result.iconUrl && (
                  <img
                    src={result.iconUrl}
                    alt={result.name}
                    className="w-12 h-12 object-cover rounded mx-auto mb-2"
                  />
                )}
                <div className="flex items-center justify-center gap-1">
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm truncate ${
                      result.success ? "text-green-700" : "text-red-700"
                    }`}
                    title={result.error || result.name}
                  >
                    {result.name}
                  </span>
                </div>
                {result.error && (
                  <p className="text-xs text-red-500 text-center mt-1">
                    {result.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 新增/编辑表单 */}
      {showForm && (
        <div className="bg-white rounded-lg border border-sage-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-sage-800">
              {editingId ? "编辑图标" : "新增图标"}
            </h2>
            <button
              onClick={resetForm}
              className="text-sage-500 hover:text-sage-700"
            >
              取消
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-sage-600 mb-2">
                  食材名称 <span className="text-red-500">*</span>
                </label>
                <input
                  value={formState.name}
                  onChange={(e) =>
                    setFormState({ ...formState, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-sage-200 rounded-md"
                  placeholder="例：猪肉"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-sage-600 mb-2">
                  别名/关键词 <span className="text-sage-400">(逗号分隔)</span>
                </label>
                <input
                  value={formState.aliases}
                  onChange={(e) =>
                    setFormState({ ...formState, aliases: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-sage-200 rounded-md"
                  placeholder="例：五花肉,梅花肉,前腿肉"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-sage-600 mb-2">
                图标图片 <span className="text-sage-400">(可稍后补充)</span>
              </label>
              <div className="flex gap-2">
                <input
                  value={formState.iconUrl}
                  onChange={(e) =>
                    setFormState({ ...formState, iconUrl: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-sage-200 rounded-md"
                  placeholder="图标 URL（留空表示待补充）"
                />
                <label className="px-4 py-2 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-lg cursor-pointer transition-colors flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {uploading ? "上传中..." : "上传"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                    }}
                  />
                </label>
              </div>
              {formState.iconUrl && (
                <div className="mt-2 p-2 border border-sage-200 rounded-md inline-block">
                  <img
                    src={formState.iconUrl}
                    alt="预览"
                    className="w-16 h-16 object-cover rounded"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-sage-600 mb-2">
                AI 生成提示词
              </label>
              <div className="flex gap-2">
                <input
                  value={formState.prompt}
                  onChange={(e) =>
                    setFormState({ ...formState, prompt: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-sage-200 rounded-md"
                  placeholder="例：一块新鲜的猪肉，写实风格，白色背景"
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating || !formState.prompt.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-60 flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成并保存中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI 生成并保存
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <label className="block text-sm text-sage-600 mb-2">排序</label>
                <input
                  type="number"
                  value={formState.sortOrder}
                  onChange={(e) =>
                    setFormState({ ...formState, sortOrder: e.target.value })
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
                  启用该图标
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
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
                {saving ? "保存中..." : editingId ? "保存更新" : "新增图标"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 图标列表 */}
      <div className="bg-white rounded-lg border border-sage-200 overflow-hidden">
        {icons.length === 0 ? (
          <div className="py-16 text-center text-sage-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无图标</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-sage-600 hover:underline"
            >
              点击新增第一个图标
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-sage-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase">
                  <input
                    type="checkbox"
                    checked={
                      filteredIcons.length > 0 &&
                      filteredIcons.every((icon) => selectedIds.has(icon.id))
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase">
                  图标
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase">
                  名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase">
                  别名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase">
                  来源
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase">
                  状态
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-sage-700 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100">
              {filteredIcons.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-sm text-sage-500" colSpan={7}>
                    暂无待补充图标
                  </td>
                </tr>
              ) : (
                filteredIcons.map((icon) => (
                  <tr key={icon.id} className={`hover:bg-sage-50 ${!icon.iconUrl ? "bg-orange-50" : ""}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(icon.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (checked) next.add(icon.id);
                            else next.delete(icon.id);
                            return next;
                          });
                        }}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {icon.iconUrl ? (
                        <img
                          src={icon.iconUrl}
                          alt={icon.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-orange-100 border-2 border-dashed border-orange-300 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-orange-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-sage-800">
                      {icon.name}
                      {!icon.iconUrl && (
                        <span className="ml-2 px-2 py-0.5 bg-orange-200 text-orange-700 text-xs rounded">
                          待补充图标
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-sage-600">
                      {icon.aliases?.length > 0
                        ? icon.aliases.join(", ")
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          icon.source === "ai"
                            ? "bg-purple-100 text-purple-700"
                            : icon.source === "upload"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {icon.source === "ai"
                          ? "AI 生成"
                          : icon.source === "upload"
                          ? "上传"
                          : "未知"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(icon)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          icon.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {icon.isActive ? "启用" : "禁用"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-3">
                        <button
                          onClick={() => handleEdit(icon)}
                          className="text-sage-600 hover:text-sage-800"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(icon.id)}
                          className="text-red-600 hover:text-red-800"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
