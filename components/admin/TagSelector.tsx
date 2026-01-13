/**
 * 标签选择器组件
 *
 * 用于食谱表单中选择多个标签（场景、烹饪方法、口味等）
 */

"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface Tag {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
}

interface TagSelectorProps {
  /** 标签类型：scenes, cooking-methods, tastes, crowds, occasions */
  type: "scenes" | "cooking-methods" | "tastes" | "crowds" | "occasions";
  /** 已选中的标签 slug 列表 */
  selected: string[];
  /** 选中状态变化回调 */
  onChange: (selected: string[]) => void;
  /** 标签 */
  label: string;
  /** 最大可选数量（可选） */
  maxSelect?: number;
}

export function TagSelector({
  type,
  selected,
  onChange,
  label,
  maxSelect,
}: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/config/tags/${type}`);
        const data = await response.json();
        if (data.success) {
          // 只显示激活的标签
          setTags(data.data.filter((tag: Tag & { isActive?: boolean }) => tag.isActive !== false));
        } else {
          setError(data.error || "加载标签失败");
        }
      } catch (err) {
        setError("加载标签失败");
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [type]);

  const handleToggle = (slug: string) => {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else {
      if (maxSelect && selected.length >= maxSelect) {
        return; // 达到最大选择数量
      }
      onChange([...selected, slug]);
    }
  };

  // 显示的标签数量（未展开时）
  const displayLimit = 8;
  const displayTags = expanded ? tags : tags.slice(0, displayLimit);
  const hasMore = tags.length > displayLimit;

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-textDark">{label}</label>
        <div className="text-sm text-textGray">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-textDark">{label}</label>
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-textDark">{label}</label>
        <div className="text-sm text-textGray">暂无可用标签</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-textDark">
          {label}
          {maxSelect && (
            <span className="text-textGray font-normal ml-2">
              (已选 {selected.length}/{maxSelect})
            </span>
          )}
          {!maxSelect && selected.length > 0 && (
            <span className="text-textGray font-normal ml-2">
              (已选 {selected.length})
            </span>
          )}
        </label>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-brownWarm hover:underline"
          >
            清空
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag) => {
          const isSelected = selected.includes(tag.slug);
          const isDisabled = !isSelected && maxSelect !== undefined && selected.length >= maxSelect;

          return (
            <label
              key={tag.id}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-pointer
                border transition-colors
                ${isSelected
                  ? "bg-brownWarm text-white border-brownWarm"
                  : isDisabled
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white text-textDark border-lightGray hover:border-brownWarm"
                }
              `}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => !isDisabled && handleToggle(tag.slug)}
                disabled={isDisabled}
                className="sr-only"
              />
              <span>{tag.name}</span>
            </label>
          );
        })}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-brownWarm hover:underline"
        >
          {expanded ? "收起" : `展开更多 (${tags.length - displayLimit})`}
        </button>
      )}

      {/* 已选标签提示 */}
      {selected.length > 0 && (
        <div className="text-xs text-textGray mt-1">
          已选: {selected.join(", ")}
        </div>
      )}
    </div>
  );
}
