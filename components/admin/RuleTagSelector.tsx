/**
 * 规则标签选择器组件
 *
 * 用于在规则编辑器中选择单个标签，替代文本输入
 */

"use client";

import { useState, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

interface RuleTagSelectorProps {
  tagType: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

interface TagOption {
  id: string;
  name: string;
  slug: string;
}

interface AvailableTags {
  scenes: TagOption[];
  cookingMethods: TagOption[];
  tastes: TagOption[];
  crowds: TagOption[];
  occasions: TagOption[];
}

// 标签类型映射
const TAG_TYPE_MAP: Record<string, keyof AvailableTags> = {
  scene: "scenes",
  taste: "tastes",
  method: "cookingMethods",
  crowd: "crowds",
  occasion: "occasions",
};

export default function RuleTagSelector({ tagType, value, onChange, disabled }: RuleTagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<AvailableTags | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 获取可用标签
  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await fetch("/api/admin/config/tags/available");
        const data = await res.json();
        if (data.success) {
          setAvailableTags(data.data);
        }
      } catch (error) {
        console.error("获取标签失败:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTags();
  }, []);

  // 获取当前类型的标签列表
  const tagKey = TAG_TYPE_MAP[tagType] || "scenes";
  const tags = availableTags?.[tagKey] || [];

  // 根据 value (ID) 查找对应的标签名称
  const selectedTag = tags.find((tag) => tag.id === value);
  const displayValue = selectedTag ? selectedTag.name : value;

  // 如果正在加载或没有标签，显示文本输入
  if (loading || tags.length === 0) {
    return (
      <input
        type="text"
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        placeholder={loading ? "加载中..." : "标签名称"}
        className="flex-1 min-w-[100px] px-2 py-1.5 text-sm border border-cream rounded focus:outline-none focus:border-brownWarm"
      />
    );
  }

  return (
    <div className="relative flex-1 min-w-[100px]">
      {/* 选择按钮 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-2 py-1.5 text-sm text-left border border-cream rounded focus:outline-none focus:border-brownWarm bg-white flex items-center justify-between disabled:opacity-50"
      >
        <span className={value ? "text-textDark" : "text-textGray"}>
          {displayValue || "选择标签"}
        </span>
        <ChevronDown className={`h-4 w-4 text-textGray transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* 下拉列表 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* 选项列表 */}
          <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto bg-white border border-cream rounded-lg shadow-lg">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  onChange(tag.id); // 传递标签 ID
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-cream flex items-center justify-between"
              >
                <span>{tag.name}</span>
                {value === tag.id && (
                  <Check className="h-4 w-4 text-brownWarm" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
