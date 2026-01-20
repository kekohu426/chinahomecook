/**
 * 模式选择组件
 *
 * 3 种模式：智能匹配、手动选择、AI 生成
 */

"use client";

import { Target, Edit3, Sparkles } from "lucide-react";

export type ContentMode = "smart-match" | "manual-select" | "ai-generate";

interface ModeSelectorProps {
  currentMode: ContentMode | null;
  onModeChange: (mode: ContentMode) => void;
}

const MODES = [
  {
    id: "smart-match" as ContentMode,
    icon: Target,
    title: "智能匹配模式",
    badge: "推荐",
    description: "AI 自动生成规则，从现有库中筛选",
    color: "blue",
  },
  {
    id: "manual-select" as ContentMode,
    icon: Edit3,
    title: "手动选择模式",
    description: "从食谱库中手动挑选",
    color: "green",
  },
  {
    id: "ai-generate" as ContentMode,
    icon: Sparkles,
    title: "AI 生成模式",
    description: "AI 批量生成新食谱",
    color: "purple",
  },
];

export default function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-textDark mb-2">选择一种模式来配置食谱</h3>
        <p className="text-sm text-textGray">
          根据您的需求选择最合适的方式来管理聚合页的食谱内容
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`relative p-6 rounded-lg border-2 transition-all text-left ${
                isActive
                  ? "border-brownWarm bg-brownWarm/5 shadow-md"
                  : "border-cream hover:border-brownWarm/50 hover:shadow-sm"
              }`}
            >
              {/* 推荐标签 */}
              {mode.badge && (
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 text-xs font-medium bg-brownWarm text-white rounded-full">
                    {mode.badge}
                  </span>
                </div>
              )}

              {/* 图标 */}
              <div className={`inline-flex p-3 rounded-lg mb-4 ${
                isActive ? "bg-brownWarm text-white" : "bg-gray-100 text-textGray"
              }`}>
                <Icon className="h-6 w-6" />
              </div>

              {/* 标题 */}
              <h4 className={`text-base font-medium mb-2 ${
                isActive ? "text-brownWarm" : "text-textDark"
              }`}>
                {mode.title}
              </h4>

              {/* 描述 */}
              <p className="text-sm text-textGray mb-4">
                {mode.description}
              </p>

              {/* 按钮 */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brownWarm text-white"
                  : "bg-gray-100 text-textGray hover:bg-gray-200"
              }`}>
                {isActive ? "已启用" : "启用"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
