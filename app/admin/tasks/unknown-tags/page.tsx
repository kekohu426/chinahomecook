/**
 * 未知标签审核页面
 *
 * 路由: /admin/tasks/unknown-tags
 * 功能: 审核 AI 生成的未知标签，可映射到现有标签、创建新标签或忽略
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Tag,
  ArrowRight,
  Plus,
  X,
  Check,
  AlertCircle,
  Search,
} from "lucide-react";

interface UnknownTag {
  id: string;
  type: string;
  unknownSlug: string;
  count: number;
  sampleRecipes: { id: string; title: string }[];
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedAction: string | null;
}

interface TagOption {
  id: string;
  name: string;
  slug: string;
}

const TYPE_LABELS: Record<string, string> = {
  scene: "场景",
  method: "烹饪方式",
  taste: "口味",
  crowd: "人群",
  occasion: "场合",
};

const TYPE_API_PATHS: Record<string, string> = {
  scene: "scenes",
  method: "methods",
  taste: "tastes",
  crowd: "crowds",
  occasion: "occasions",
};

export default function UnknownTagsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<UnknownTag[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // 弹窗状态
  const [actionItem, setActionItem] = useState<UnknownTag | null>(null);
  const [actionType, setActionType] = useState<"map" | "create" | null>(null);
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);
  const [selectedTarget, setSelectedTarget] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const typeFilter = searchParams.get("type") || "";
  const statusFilter = searchParams.get("status") || "pending";

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      params.set("status", statusFilter);

      const response = await fetch(`/api/admin/tasks/unknown-tags?${params}`);
      const data = await response.json();
      if (data.success) {
        setItems(data.data.items || []);
        setTypeCounts(data.data.typeCounts || {});
      }
    } catch (error) {
      console.error("加载未知标签列表失败:", error);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin/tasks/unknown-tags?${params.toString()}`);
  };

  // 加载目标标签选项
  const loadTagOptions = async (type: string) => {
    try {
      const apiPath = TYPE_API_PATHS[type];
      if (!apiPath) return;

      const response = await fetch(`/api/config/${apiPath}`);
      const data = await response.json();
      if (data.success) {
        setTagOptions(data.data || []);
      }
    } catch (error) {
      console.error("加载标签选项失败:", error);
    }
  };

  const openMapDialog = async (item: UnknownTag) => {
    setActionItem(item);
    setActionType("map");
    setSelectedTarget("");
    await loadTagOptions(item.type);
  };

  const openCreateDialog = (item: UnknownTag) => {
    setActionItem(item);
    setActionType("create");
    setNewTagName("");
  };

  const closeDialog = () => {
    setActionItem(null);
    setActionType(null);
    setSelectedTarget("");
    setNewTagName("");
  };

  const handleMap = async () => {
    if (!actionItem || !selectedTarget) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/admin/tasks/unknown-tags/${actionItem.id}/map`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetSlug: selectedTarget }),
        }
      );
      const data = await response.json();
      if (data.success) {
        closeDialog();
        loadItems();
      } else {
        alert(data.error || "映射失败");
      }
    } catch (error) {
      console.error("映射失败:", error);
      alert("映射失败");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!actionItem || !newTagName.trim()) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/admin/tasks/unknown-tags/${actionItem.id}/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newTagName.trim() }),
        }
      );
      const data = await response.json();
      if (data.success) {
        closeDialog();
        loadItems();
      } else {
        alert(data.error || "创建失败");
      }
    } catch (error) {
      console.error("创建失败:", error);
      alert("创建失败");
    } finally {
      setActionLoading(false);
    }
  };

  const handleIgnore = async (item: UnknownTag) => {
    if (!confirm(`确定要忽略标签 "${item.unknownSlug}" 吗？`)) return;

    try {
      const response = await fetch(
        `/api/admin/tasks/unknown-tags/${item.id}/ignore`,
        { method: "POST" }
      );
      const data = await response.json();
      if (data.success) {
        loadItems();
      } else {
        alert(data.error || "忽略失败");
      }
    } catch (error) {
      console.error("忽略失败:", error);
      alert("忽略失败");
    }
  };

  const totalPending = Object.values(typeCounts).reduce((a, b) => a + b, 0);

  return (
    <div>
      {/* 页头 */}
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-medium text-textDark mb-2">
          标签审核
        </h1>
        <p className="text-textGray">
          处理 AI 生成的未知标签：映射到现有标签、创建新标签或忽略
        </p>
      </div>

      {/* 类型筛选 */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => updateFilter("type", "")}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            !typeFilter
              ? "bg-brownWarm text-white"
              : "bg-white text-textGray hover:bg-gray-100"
          }`}
        >
          全部 ({totalPending})
        </button>
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <button
            key={type}
            onClick={() => updateFilter("type", type)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              typeFilter === type
                ? "bg-brownWarm text-white"
                : "bg-white text-textGray hover:bg-gray-100"
            }`}
          >
            {label} ({typeCounts[type] || 0})
          </button>
        ))}
      </div>

      {/* 状态筛选 */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "pending", label: "待处理" },
          { value: "resolved", label: "已处理" },
          { value: "ignored", label: "已忽略" },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => updateFilter("status", option.value)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              statusFilter === option.value
                ? "bg-gray-200 text-textDark"
                : "bg-gray-100 text-textGray hover:bg-gray-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-textGray">加载中...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-textGray">
            {statusFilter === "pending" ? "暂无待处理的未知标签" : "暂无数据"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-cream">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  标签
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  出现次数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  示例食谱
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-textGray uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-mono text-textDark">
                        {item.unknownSlug}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-textGray">
                      {TYPE_LABELS[item.type] || item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-textDark">
                      {item.count}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {item.sampleRecipes.slice(0, 2).map((recipe) => (
                        <Link
                          key={recipe.id}
                          href={`/admin/recipes/${recipe.id}/edit`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {recipe.title}
                        </Link>
                      ))}
                      {item.sampleRecipes.length > 2 && (
                        <span className="text-xs text-textGray">
                          +{item.sampleRecipes.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {item.status === "pending" ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openMapDialog(item)}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          映射
                        </button>
                        <button
                          onClick={() => openCreateDialog(item)}
                          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                          新建
                        </button>
                        <button
                          onClick={() => handleIgnore(item)}
                          className="px-3 py-1 text-xs bg-gray-100 text-textGray rounded hover:bg-gray-200 transition-colors"
                        >
                          忽略
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-textGray">
                        {item.resolvedAction}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 映射弹窗 */}
      {actionType === "map" && actionItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-textDark">
                映射到现有标签
              </h3>
              <button
                onClick={closeDialog}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5 text-textGray" />
              </button>
            </div>

            <div className="mb-4">
              <div className="text-sm text-textGray mb-2">未知标签</div>
              <div className="px-3 py-2 bg-amber-50 rounded text-amber-700 font-mono">
                {actionItem.unknownSlug}
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-textGray mb-2">
                选择目标标签 ({TYPE_LABELS[actionItem.type]})
              </div>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full px-3 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
              >
                <option value="">请选择...</option>
                {tagOptions.map((tag) => (
                  <option key={tag.id} value={tag.slug}>
                    {tag.name} ({tag.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeDialog}
                className="flex-1 px-4 py-2 bg-gray-100 text-textGray rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleMap}
                disabled={!selectedTarget || actionLoading}
                className="flex-1 px-4 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50"
              >
                {actionLoading ? "处理中..." : "确认映射"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 创建弹窗 */}
      {actionType === "create" && actionItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-textDark">
                创建新标签
              </h3>
              <button
                onClick={closeDialog}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5 text-textGray" />
              </button>
            </div>

            <div className="mb-4">
              <div className="text-sm text-textGray mb-2">Slug</div>
              <div className="px-3 py-2 bg-gray-100 rounded text-textDark font-mono">
                {actionItem.unknownSlug}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-textGray mb-2">类型</div>
              <div className="px-3 py-2 bg-gray-100 rounded text-textDark">
                {TYPE_LABELS[actionItem.type]}
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-textGray mb-2">
                标签名称 <span className="text-red-500">*</span>
              </div>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="请输入中文名称"
                className="w-full px-3 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeDialog}
                className="flex-1 px-4 py-2 bg-gray-100 text-textGray rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTagName.trim() || actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "创建中..." : "创建标签"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
