/**
 * 规则编辑器组件
 *
 * 用于编辑主题模式的自定义规则
 * 支持 OR/AND/NOT 逻辑组合
 */

"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import type { RuleConfig, CustomRuleConfig, RuleGroup, RuleCondition } from "@/lib/types/collection";

interface RuleEditorProps {
  rules: RuleConfig;
  onChange: (rules: RuleConfig) => void;
  disabled?: boolean;
}

// 字段选项
const FIELD_OPTIONS = [
  { value: "tagId", label: "标签", group: "关联" },
  { value: "cuisineId", label: "菜系", group: "关联" },
  { value: "locationId", label: "地区", group: "关联" },
  { value: "cookTime", label: "烹饪时间", group: "数值" },
  { value: "prepTime", label: "准备时间", group: "数值" },
  { value: "difficulty", label: "难度", group: "数值" },
  { value: "servings", label: "份量", group: "数值" },
];

// 操作符选项
const OPERATOR_OPTIONS = {
  relation: [
    { value: "eq", label: "等于" },
    { value: "neq", label: "不等于" },
    { value: "in", label: "包含任一" },
    { value: "nin", label: "不包含" },
  ],
  numeric: [
    { value: "eq", label: "等于" },
    { value: "neq", label: "不等于" },
    { value: "lt", label: "小于" },
    { value: "lte", label: "小于等于" },
    { value: "gt", label: "大于" },
    { value: "gte", label: "大于等于" },
  ],
};

// 标签类型选项
const TAG_TYPE_OPTIONS = [
  { value: "scene", label: "场景" },
  { value: "taste", label: "口味" },
  { value: "method", label: "烹饪方式" },
  { value: "crowd", label: "人群" },
  { value: "occasion", label: "场合" },
  { value: "ingredient", label: "食材" },
];

// 判断是否为数值字段
const isNumericField = (field: string) => {
  return ["cookTime", "prepTime", "difficulty", "servings"].includes(field);
};

// 获取字段的操作符选项
const getOperatorOptions = (field: string) => {
  return isNumericField(field) ? OPERATOR_OPTIONS.numeric : OPERATOR_OPTIONS.relation;
};

// 空条件
const createEmptyCondition = (): RuleCondition => ({
  field: "tagId",
  operator: "eq",
  value: "",
  tagType: "scene",
});

// 空规则组
const createEmptyGroup = (): RuleGroup => ({
  logic: "OR",
  conditions: [createEmptyCondition()],
});

export default function RuleEditor({ rules, onChange, disabled }: RuleEditorProps) {
  // 确保是 custom 规则
  const customRules: CustomRuleConfig = rules.mode === "custom"
    ? rules as CustomRuleConfig
    : { mode: "custom", groups: [], exclude: [] };

  // 更新规则
  const updateRules = (updates: Partial<CustomRuleConfig>) => {
    onChange({ ...customRules, ...updates });
  };

  // 添加规则组
  const addGroup = () => {
    updateRules({
      groups: [...customRules.groups, createEmptyGroup()],
    });
  };

  // 删除规则组
  const removeGroup = (index: number) => {
    updateRules({
      groups: customRules.groups.filter((_, i) => i !== index),
    });
  };

  // 更新规则组
  const updateGroup = (index: number, updates: Partial<RuleGroup>) => {
    const newGroups = [...customRules.groups];
    newGroups[index] = { ...newGroups[index], ...updates };
    updateRules({ groups: newGroups });
  };

  // 添加条件到组
  const addCondition = (groupIndex: number) => {
    const newGroups = [...customRules.groups];
    newGroups[groupIndex].conditions.push(createEmptyCondition());
    updateRules({ groups: newGroups });
  };

  // 删除条件
  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    const newGroups = [...customRules.groups];
    newGroups[groupIndex].conditions = newGroups[groupIndex].conditions.filter(
      (_, i) => i !== conditionIndex
    );
    // 如果组内没有条件了，删除整个组
    if (newGroups[groupIndex].conditions.length === 0) {
      newGroups.splice(groupIndex, 1);
    }
    updateRules({ groups: newGroups });
  };

  // 更新条件
  const updateCondition = (
    groupIndex: number,
    conditionIndex: number,
    updates: Partial<RuleCondition>
  ) => {
    const newGroups = [...customRules.groups];
    newGroups[groupIndex].conditions[conditionIndex] = {
      ...newGroups[groupIndex].conditions[conditionIndex],
      ...updates,
    };
    updateRules({ groups: newGroups });
  };

  // 添加排除条件
  const addExclude = () => {
    updateRules({
      exclude: [...(customRules.exclude || []), createEmptyCondition()],
    });
  };

  // 删除排除条件
  const removeExclude = (index: number) => {
    updateRules({
      exclude: (customRules.exclude || []).filter((_, i) => i !== index),
    });
  };

  // 更新排除条件
  const updateExclude = (index: number, updates: Partial<RuleCondition>) => {
    const newExclude = [...(customRules.exclude || [])];
    newExclude[index] = { ...newExclude[index], ...updates };
    updateRules({ exclude: newExclude });
  };

  return (
    <div className="space-y-6">
      {/* 规则组列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-textDark">匹配规则</h4>
          <button
            onClick={addGroup}
            disabled={disabled}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-brownWarm hover:bg-brownWarm hover:text-white border border-brownWarm rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            添加规则组
          </button>
        </div>

        {customRules.groups.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-sm text-textGray mb-3">暂无规则，将匹配所有食谱</p>
            <button
              onClick={addGroup}
              disabled={disabled}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-brownWarm hover:bg-brownWarm hover:text-white border border-brownWarm rounded-lg transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              添加第一个规则组
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {customRules.groups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* 组间 AND 提示 */}
                {groupIndex > 0 && (
                  <div className="flex items-center justify-center py-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      AND
                    </span>
                  </div>
                )}

                {/* 规则组 */}
                <div className="border border-cream rounded-lg overflow-hidden">
                  {/* 组头 */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-cream">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-textDark">
                        规则组 {groupIndex + 1}
                      </span>
                      <select
                        value={group.logic}
                        onChange={(e) => updateGroup(groupIndex, { logic: e.target.value as "AND" | "OR" })}
                        disabled={disabled}
                        className="px-2 py-1 text-xs border border-cream rounded focus:outline-none focus:border-brownWarm"
                      >
                        <option value="OR">满足任一 (OR)</option>
                        <option value="AND">满足全部 (AND)</option>
                      </select>
                    </div>
                    <button
                      onClick={() => removeGroup(groupIndex)}
                      disabled={disabled}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* 条件列表 */}
                  <div className="p-4 space-y-3">
                    {group.conditions.map((condition, conditionIndex) => (
                      <ConditionRow
                        key={conditionIndex}
                        condition={condition}
                        onChange={(updates) => updateCondition(groupIndex, conditionIndex, updates)}
                        onRemove={() => removeCondition(groupIndex, conditionIndex)}
                        disabled={disabled}
                        showLogic={conditionIndex > 0}
                        logic={group.logic}
                      />
                    ))}

                    <button
                      onClick={() => addCondition(groupIndex)}
                      disabled={disabled}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-textGray hover:text-brownWarm"
                    >
                      <Plus className="h-3 w-3" />
                      添加条件
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 排除条件 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-textDark">排除条件 (NOT)</h4>
          <button
            onClick={addExclude}
            disabled={disabled}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            添加排除
          </button>
        </div>

        {(customRules.exclude || []).length > 0 && (
          <div className="border border-red-200 rounded-lg p-4 bg-red-50/50 space-y-3">
            {(customRules.exclude || []).map((condition, index) => (
              <ConditionRow
                key={index}
                condition={condition}
                onChange={(updates) => updateExclude(index, updates)}
                onRemove={() => removeExclude(index)}
                disabled={disabled}
                showLogic={index > 0}
                logic="OR"
                isExclude
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 条件行组件
interface ConditionRowProps {
  condition: RuleCondition;
  onChange: (updates: Partial<RuleCondition>) => void;
  onRemove: () => void;
  disabled?: boolean;
  showLogic?: boolean;
  logic?: "AND" | "OR";
  isExclude?: boolean;
}

function ConditionRow({
  condition,
  onChange,
  onRemove,
  disabled,
  showLogic,
  logic,
  isExclude,
}: ConditionRowProps) {
  const operatorOptions = getOperatorOptions(condition.field);
  const needsTagType = condition.field === "tagId" || condition.field === "tag";

  return (
    <div className="flex items-center gap-2">
      {/* 逻辑连接符 */}
      {showLogic && (
        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
          isExclude
            ? "bg-red-100 text-red-600"
            : logic === "OR"
            ? "bg-amber-100 text-amber-700"
            : "bg-blue-100 text-blue-700"
        }`}>
          {isExclude ? "或" : logic}
        </span>
      )}

      {/* 字段选择 */}
      <select
        value={condition.field}
        onChange={(e) => {
          const newField = e.target.value;
          const updates: Partial<RuleCondition> = { field: newField };
          // 切换字段时重置操作符
          if (isNumericField(newField) !== isNumericField(condition.field)) {
            updates.operator = isNumericField(newField) ? "lte" : "eq";
          }
          onChange(updates);
        }}
        disabled={disabled}
        className="px-2 py-1.5 text-sm border border-cream rounded focus:outline-none focus:border-brownWarm"
      >
        {FIELD_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 标签类型（仅标签字段） */}
      {needsTagType && (
        <select
          value={condition.tagType || "scene"}
          onChange={(e) => onChange({ tagType: e.target.value })}
          disabled={disabled}
          className="px-2 py-1.5 text-sm border border-cream rounded focus:outline-none focus:border-brownWarm"
        >
          {TAG_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {/* 操作符选择 */}
      <select
        value={condition.operator}
        onChange={(e) => onChange({ operator: e.target.value })}
        disabled={disabled}
        className="px-2 py-1.5 text-sm border border-cream rounded focus:outline-none focus:border-brownWarm"
      >
        {operatorOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 值输入 */}
      <input
        type={isNumericField(condition.field) ? "number" : "text"}
        value={condition.value as string}
        onChange={(e) => onChange({
          value: isNumericField(condition.field)
            ? parseInt(e.target.value) || 0
            : e.target.value,
        })}
        disabled={disabled}
        placeholder={isNumericField(condition.field) ? "数值" : "标签ID或名称"}
        className="flex-1 min-w-[100px] px-2 py-1.5 text-sm border border-cream rounded focus:outline-none focus:border-brownWarm"
      />

      {/* 删除按钮 */}
      <button
        onClick={onRemove}
        disabled={disabled}
        className="p-1 text-red-500 hover:bg-red-50 rounded"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
