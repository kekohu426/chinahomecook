"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  GripVertical,
  Eye,
  EyeOff,
  Layers,
  RefreshCw,
  Save,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { CollectionListItem } from "@/lib/types/collection-api";

// 类型分组配置
const TYPE_GROUPS = [
  { type: "cuisine", label: "菜系", icon: "🍜" },
  { type: "scene", label: "场景", icon: "🎬" },
  { type: "method", label: "烹饪方式", icon: "🔥" },
  { type: "taste", label: "口味", icon: "🌶️" },
  { type: "crowd", label: "人群", icon: "👨‍👩‍👧‍👦" },
  { type: "ingredient", label: "食材", icon: "🥬" },
  { type: "occasion", label: "场合", icon: "🎉" },
  { type: "theme", label: "主题", icon: "📚" },
];

interface GroupedCollections {
  [type: string]: CollectionListItem[];
}

interface AggregationCollectionsManagerProps {
  showBreadcrumbs?: boolean;
  title?: string;
  description?: string;
}

export default function AggregationCollectionsManager({
  showBreadcrumbs = false,
  title = "一级聚合页管理",
  description = "管理首页展示的聚合区块，拖拽调整排序，控制显示/隐藏",
}: AggregationCollectionsManagerProps) {
  const HeadingTag = showBreadcrumbs ? "h1" : "h2";
  const [collections, setCollections] = useState<CollectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(TYPE_GROUPS.map((g) => g.type))
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{
    type: string;
    id: string;
  } | null>(null);

  const loadCollections = useCallback(async () => {
    setLoading(true);
    try {
      const pageSize = 100;
      let page = 1;
      let totalPages = 1;
      const all: CollectionListItem[] = [];

      while (page <= totalPages) {
        const response = await fetch(
          `/api/admin/collections?page=${page}&pageSize=${pageSize}`
        );
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error?.message || "加载失败");
        }
        all.push(...(data.data || []));
        totalPages = data.meta?.totalPages || 1;
        page += 1;
      }

      setCollections(all);
      setHasChanges(false);
    } catch (error) {
      console.error("加载聚合页列表失败:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // 按类型分组
  const groupedCollections: GroupedCollections = {};
  TYPE_GROUPS.forEach((group) => {
    groupedCollections[group.type] = collections
      .filter((c) => c.type === group.type)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  });

  // 切换分组展开/折叠
  const toggleGroup = (type: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedGroups(newExpanded);
  };

  // 切换显示状态（通过调整 sortOrder 实现）
  const toggleVisibility = (collectionId: string, type: string) => {
    const typeCollections = groupedCollections[type] || [];
    const collection = typeCollections.find(c => c.id === collectionId);
    if (!collection) return;

    // 获取该类型的 cardCount（从 TYPE_GROUPS 或默认值）
    const typeGroup = TYPE_GROUPS.find(g => g.type === type);
    const cardCount = 8; // 默认值，实际应该从配置读取

    // 判断当前是否在显示范围内
    const currentIndex = typeCollections.findIndex(c => c.id === collectionId);
    const isCurrentlyVisible = currentIndex < cardCount;

    // 更新本地状态
    const newCollections = [...typeCollections];
    const [movedItem] = newCollections.splice(currentIndex, 1);

    if (isCurrentlyVisible) {
      // 当前显示 → 隐藏：移到最后
      newCollections.push(movedItem);
    } else {
      // 当前隐藏 → 显示：移到显示范围的最后一个位置
      const insertIndex = Math.min(cardCount - 1, newCollections.length);
      newCollections.splice(insertIndex, 0, movedItem);
    }

    // 重新分配 sortOrder
    newCollections.forEach((c, index) => {
      c.sortOrder = index;
    });

    setCollections(prev => {
      const others = prev.filter(c => c.type !== type);
      return [...others, ...newCollections];
    });
    setHasChanges(true);
  };

  // 拖拽开始
  const handleDragStart = (type: string, id: string) => {
    setDraggedItem({ type, id });
  };

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // 拖拽放置
  const handleDrop = (type: string, targetId: string) => {
    if (!draggedItem || draggedItem.type !== type || draggedItem.id === targetId) {
      return;
    }

    const items = [...groupedCollections[type]];
    const draggedIndex = items.findIndex((c) => c.id === draggedItem.id);
    const targetIndex = items.findIndex((c) => c.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // 重新排序
    const [removed] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, removed);

    // 更新 sortOrder
    const updatedItems = items.map((item, index) => ({
      ...item,
      sortOrder: index,
    }));

    // 更新状态
    setCollections((prev) => {
      const otherItems = prev.filter((c) => c.type !== type);
      return [...otherItems, ...updatedItems];
    });
    setHasChanges(true);
  };

  // 保存排序
  const saveOrder = async () => {
    setSaving(true);
    try {
      // 按类型分组保存
      for (const group of TYPE_GROUPS) {
        const items = groupedCollections[group.type];
        if (items.length === 0) continue;

        // 批量更新排序和 isFeatured
        await fetch(`/api/admin/collections/batch/update-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: group.type,
            items: items.map((item, index) => ({
              id: item.id,
              sortOrder: index,
            })),
          }),
        });
      }

      setHasChanges(false);
      alert("保存成功");
      // 重新加载数据
      await loadCollections();
    } catch (error) {
      console.error("保存排序失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-brownWarm" />
        <span className="ml-2 text-textGray">加载中...</span>
      </div>
    );
  }

  return (
    <div>
      {showBreadcrumbs && (
        <div className="text-sm text-textGray mb-4">
          <Link href="/admin" className="hover:text-brownWarm">
            配置
          </Link>
          <span className="mx-2">/</span>
          <span className="text-textDark">一级聚合页管理</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <HeadingTag
            className={`font-serif font-medium text-textDark mb-2 ${
              showBreadcrumbs ? "text-3xl" : "text-2xl"
            }`}
          >
            {title}
          </HeadingTag>
          <p className="text-textGray">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadCollections}
            disabled={loading}
            className="p-2 text-textGray hover:text-brownWarm disabled:opacity-50"
            title="刷新列表"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={saveOrder}
            disabled={saving || !hasChanges}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brownWarm hover:bg-brownDark text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "保存中..." : "保存排序"}
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-700">
            您有未保存的更改，请点击"保存排序"按钮保存。
          </p>
        </div>
      )}

      <div className="space-y-4">
        {TYPE_GROUPS.map((group) => {
          const items = groupedCollections[group.type] || [];
          const publishedCount = items.filter((c) => c.status === "published").length;
          const isExpanded = expandedGroups.has(group.type);

          return (
            <div key={group.type} className="bg-white rounded-lg shadow-card overflow-hidden">
              <button
                onClick={() => toggleGroup(group.type)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{group.icon}</span>
                  <div className="text-left">
                    <h2 className="text-lg font-medium text-textDark">{group.label}</h2>
                    <p className="text-sm text-textGray">
                      {items.length} 个聚合页，{publishedCount} 个已发布
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {publishedCount > 0 ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      显示中
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-gray-400">
                      <AlertCircle className="h-4 w-4" />
                      未显示
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-textGray" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-textGray" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-cream">
                  {items.length === 0 ? (
                    <div className="px-6 py-8 text-center text-textGray">
                      暂无{group.label}类型的聚合页
                    </div>
                  ) : (
                    <div className="divide-y divide-cream">
                      {items.map((collection, index) => (
                        <div
                          key={collection.id}
                          draggable
                          onDragStart={() => handleDragStart(group.type, collection.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(group.type, collection.id)}
                          className={`flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors cursor-move ${
                            draggedItem?.id === collection.id ? "opacity-50 bg-gray-100" : ""
                          }`}
                        >
                          <GripVertical className="h-5 w-5 text-gray-300 flex-shrink-0" />

                          <span className="w-6 text-center text-sm text-textGray">
                            {index + 1}
                          </span>

                          {collection.coverImage ? (
                            <Image
                              src={collection.coverImage}
                              alt={collection.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded object-cover flex-shrink-0"
                              unoptimized
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-cream flex items-center justify-center flex-shrink-0">
                              <Layers className="h-5 w-5 text-textGray" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-textDark truncate">
                                {collection.name}
                              </span>
                              {collection.nameEn && (
                                <span className="text-sm text-textGray truncate">
                                  ({collection.nameEn})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-textGray">
                              <span>{collection.path}</span>
                              <span>·</span>
                              <span>{collection.cachedPublishedCount} 道菜谱</span>
                              <span>·</span>
                              <span>进度 {collection.progress}%</span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (collection.status !== "published") {
                                alert("请先发布该聚合页，才能设置为显示");
                                return;
                              }
                              toggleVisibility(collection.id, group.type);
                            }}
                            disabled={collection.status !== "published" && index >= 8}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                              collection.status !== "published"
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : index < 8  // 前8个为显示状态
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                            title={collection.status !== "published" ? "请先发布该聚合页" : ""}
                          >
                            {collection.status !== "published" ? (
                              <>
                                <EyeOff className="h-4 w-4" />
                                未发布
                              </>
                            ) : index < 8 ? (
                              <>
                                <Eye className="h-4 w-4" />
                                显示
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-4 w-4" />
                                隐藏
                              </>
                            )}
                          </button>

                          <Link
                            href={`/admin/collections/${collection.id}`}
                            className="text-sm text-brownWarm hover:text-brownDark"
                            onClick={(e) => e.stopPropagation()}
                          >
                            编辑
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
