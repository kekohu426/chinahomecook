/**
 * 规则 Tab 组件
 *
 * 功能：
 * 1. 单标签模式：只读展示关联标签和匹配统计
 * 2. 主题模式：规则编辑器（OR/AND/NOT）
 * 3. 规则测试：实时预览匹配结果
 */

"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  Play,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  MapPin,
  Utensils,
  Eye,
  Save,
  Edit3,
  Sparkles,
  Loader2,
} from "lucide-react";
import type { CollectionDetail } from "@/lib/types/collection-api";
import type { RuleConfig } from "@/lib/types/collection";
import RuleEditor from "./RuleEditor";

interface RulesTabProps {
  collection: CollectionDetail;
  onRefresh: () => Promise<void>;
}

interface TestResult {
  counts: {
    matched: number;
    published: number;
    pending: number;
    draft: number;
  };
  samples: Array<{
    id: string;
    title: string;
    status: string;
    coverImage: string | null;
    cuisineName: string | null;
    locationName: string | null;
    tags: string[];
  }>;
  validation: {
    valid: boolean;
    errors: string[];
  };
  description: string;
}

export default function RulesTab({ collection, onRefresh }: RulesTabProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showSamples, setShowSamples] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedRules, setEditedRules] = useState<RuleConfig>(collection.rules);
  const [saving, setSaving] = useState(false);

  // AI 生成规则状态
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{
    rules: any[];
    explanation: string;
    confidence: number;
  } | null>(null);

  // 测试规则
  const handleTestRules = useCallback(async () => {
    setTesting(true);
    try {
      const rulesToTest = editing ? editedRules : collection.rules;
      const response = await fetch(`/api/admin/collections/${collection.id}/test-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules: rulesToTest,
          excludedRecipeIds: collection.excludedRecipeIds,
          limit: 20,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setTestResult(data.data);
        setShowSamples(true);
      }
    } catch (error) {
      console.error("规则测试失败:", error);
    } finally {
      setTesting(false);
    }
  }, [collection.id, collection.rules, collection.excludedRecipeIds, editing, editedRules]);

  // 保存规则
  const handleSaveRules = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/collections/${collection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleType: editedRules.mode,
          rules: editedRules,
        }),
      });
      const data = await response.json();
      if (data.success) {
        await onRefresh();
        setEditing(false);
        alert("规则保存成功");
      } else {
        alert(data.error?.message || "保存失败");
      }
    } catch (error) {
      console.error("保存规则失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditedRules(collection.rules);
    setEditing(false);
  };

  // AI 生成规则
  const handleGenerateRules = async () => {
    if (!aiInput.trim()) {
      alert("请输入描述");
      return;
    }

    setGenerating(true);
    setAiResult(null);

    try {
      const response = await fetch("/api/admin/collections/generate-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: aiInput }),
      });

      const data = await response.json();

      if (data.success) {
        setAiResult(data.data);
      } else {
        alert(data.error || "生成失败");
      }
    } catch (error) {
      console.error("AI 生成规则失败:", error);
      alert("生成失败，请稍后重试");
    } finally {
      setGenerating(false);
    }
  };

  // 应用 AI 生成的规则
  const handleApplyAiRules = () => {
    if (!aiResult) return;

    // 转换为 RuleConfig 格式
    // AI 返回的 rules 数组中每个 group 有 logic 和 rules 字段
    // 需要转换为 RuleEditor 期望的 logic 和 conditions 字段
    const newRules: RuleConfig = {
      mode: "custom",
      groups: aiResult.rules.map((group: any) => ({
        logic: group.logic,
        conditions: group.rules.map((rule: any) => ({
          field: "tagId",
          operator: rule.operator === "equals" ? "eq" : rule.operator === "in" ? "in" : "eq",
          value: rule.value,
          tagType: rule.field, // scene, method, taste, crowd, occasion
        })),
      })),
      exclude: [],
    };

    setEditedRules(newRules);
    setEditing(true);
    setShowAiGenerator(false);
    setAiInput("");
    setAiResult(null);
  };

  // 获取关联实体图标
  const getEntityIcon = () => {
    switch (collection.linkedEntityType) {
      case "cuisine":
        return <Utensils className="h-5 w-5 text-brownWarm" />;
      case "location":
        return <MapPin className="h-5 w-5 text-brownWarm" />;
      case "tag":
        return <Tag className="h-5 w-5 text-brownWarm" />;
      default:
        return <Tag className="h-5 w-5 text-brownWarm" />;
    }
  };

  // 获取关联实体类型名称
  const getEntityTypeName = () => {
    switch (collection.linkedEntityType) {
      case "cuisine":
        return "菜系";
      case "location":
        return "地区";
      case "tag":
        return "标签";
      default:
        return "关联";
    }
  };

  return (
    <div className="space-y-6">
      {/* 规则类型提示 */}
      <div className={`rounded-lg p-4 ${
        collection.ruleType === "auto"
          ? "bg-blue-50 border border-blue-200"
          : "bg-purple-50 border border-purple-200"
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            collection.ruleType === "auto" ? "bg-blue-100" : "bg-purple-100"
          }`}>
            {collection.ruleType === "auto" ? (
              <Tag className="h-5 w-5 text-blue-600" />
            ) : (
              <Utensils className="h-5 w-5 text-purple-600" />
            )}
          </div>
          <div>
            <h3 className={`font-medium ${
              collection.ruleType === "auto" ? "text-blue-800" : "text-purple-800"
            }`}>
              {collection.ruleType === "auto" ? "单标签模式" : "主题模式"}
            </h3>
            <p className={`text-sm mt-1 ${
              collection.ruleType === "auto" ? "text-blue-700" : "text-purple-700"
            }`}>
              {collection.ruleType === "auto"
                ? "自动匹配关联标签的所有食谱，规则由系统维护。"
                : "使用自定义规则组合匹配食谱，支持 OR/AND/NOT 逻辑。"}
            </p>
          </div>
        </div>
      </div>

      {/* 单标签模式：显示关联信息 */}
      {collection.ruleType === "auto" && collection.linkedEntityName && (
        <div className="bg-white border border-cream rounded-lg p-4">
          <h4 className="text-sm font-medium text-textDark mb-3">关联标签</h4>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {getEntityIcon()}
            <div>
              <div className="text-sm font-medium text-textDark">
                {collection.linkedEntityName}
              </div>
              <div className="text-xs text-textGray">
                {getEntityTypeName()} · {collection.type}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主题模式：规则编辑器 */}
      {collection.ruleType === "custom" && (
        <>
          {/* AI 智能生成入口 */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-purple-900">AI 智能生成规则</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    用自然语言描述你想要的食谱类型，AI 会自动生成匹配规则
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiGenerator(!showAiGenerator)}
                className="px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
              >
                {showAiGenerator ? "收起" : "展开"}
              </button>
            </div>

            {showAiGenerator && (
              <div className="mt-4 space-y-4">
                {/* 输入框 */}
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    描述你想要的食谱类型
                  </label>
                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="例如：产后产妇食谱、适合老人的清淡家常菜、快手下饭菜..."
                    className="w-full px-3 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm resize-none"
                    rows={3}
                    disabled={generating}
                  />
                </div>

                {/* 生成按钮 */}
                <button
                  onClick={handleGenerateRules}
                  disabled={generating || !aiInput.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI 生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      生成规则
                    </>
                  )}
                </button>

                {/* AI 生成结果 */}
                {aiResult && (
                  <div className="bg-white border border-purple-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-textDark">规则生成成功</span>
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            置信度: {(aiResult.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-sm text-textGray">{aiResult.explanation}</p>
                      </div>
                    </div>

                    {/* 规则预览 */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs font-mono text-textGray">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(aiResult.rules, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleApplyAiRules}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-brownWarm hover:bg-brownDark rounded-lg transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                        应用此规则
                      </button>
                      <button
                        onClick={() => setAiResult(null)}
                        className="px-4 py-2 text-sm text-textGray hover:text-textDark border border-cream rounded-lg transition-colors"
                      >
                        重新生成
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 规则编辑器 */}
          <div className="bg-white border border-cream rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-textDark">规则配置</h4>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-3 py-1.5 text-sm text-textGray hover:text-textDark border border-cream rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveRules}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-brownWarm hover:bg-brownDark rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saving ? "保存中..." : "保存规则"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-brownWarm hover:bg-brownWarm hover:text-white border border-brownWarm rounded-lg transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  编辑规则
                </button>
              )}
            </div>
          </div>

          {editing ? (
            <RuleEditor
              rules={editedRules}
              onChange={setEditedRules}
              disabled={saving}
              collectionId={collection.id}
              cuisineId={collection.cuisineId}
              locationId={collection.locationId}
              tagId={collection.tagId}
            />
          ) : (
            <div className="text-sm text-textGray">
              {collection.rules.mode === "custom" && (collection.rules as any).groups?.length === 0 ? (
                <p>暂无规则配置，点击"编辑规则"开始配置。</p>
              ) : (
                <p>已配置规则，点击"编辑规则"查看或修改。</p>
              )}
            </div>
          )}
        </div>
        </>
      )}

      {/* 匹配统计 */}
      <div className="bg-white border border-cream rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-textDark">匹配统计</h4>
          <button
            onClick={handleTestRules}
            disabled={testing}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-brownWarm hover:bg-brownWarm hover:text-white border border-brownWarm rounded-lg transition-colors disabled:opacity-50"
          >
            {testing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {testing ? "测试中..." : "测试规则"}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-textDark">
              {testResult?.counts.matched ?? collection.matchedCount}
            </div>
            <div className="text-xs text-textGray">总匹配</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {testResult?.counts.published ?? collection.publishedCount}
            </div>
            <div className="text-xs text-textGray">已发布</div>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">
              {testResult?.counts.pending ?? collection.pendingCount}
            </div>
            <div className="text-xs text-textGray">待审核</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {testResult?.counts.draft ?? collection.draftCount}
            </div>
            <div className="text-xs text-textGray">草稿</div>
          </div>
        </div>

        {/* 规则描述 */}
        {testResult?.description && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-textGray mb-1">规则描述</div>
            <div className="text-sm text-textDark">{testResult.description}</div>
          </div>
        )}

        {/* 验证结果 */}
        {testResult?.validation && !testResult.validation.valid && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">规则验证失败</span>
            </div>
            <ul className="text-sm text-red-600 list-disc list-inside">
              {testResult.validation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 样本预览 */}
      {testResult?.samples && testResult.samples.length > 0 && (
        <div className="bg-white border border-cream rounded-lg overflow-hidden">
          <button
            onClick={() => setShowSamples(!showSamples)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-textGray" />
              <span className="text-sm font-medium text-textDark">
                匹配样本预览 ({testResult.samples.length} 条)
              </span>
            </div>
            {showSamples ? (
              <ChevronUp className="h-4 w-4 text-textGray" />
            ) : (
              <ChevronDown className="h-4 w-4 text-textGray" />
            )}
          </button>

          {showSamples && (
            <div className="border-t border-cream">
              <div className="divide-y divide-cream">
                {testResult.samples.map((recipe) => (
                  <div key={recipe.id} className="flex items-center gap-4 p-4">
                    {recipe.coverImage ? (
                      <Image
                        src={recipe.coverImage}
                        alt={recipe.title}
                        width={60}
                        height={60}
                        className="w-15 h-15 rounded object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-15 h-15 rounded bg-gray-100 flex items-center justify-center">
                        <Utensils className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-textDark truncate">
                        {recipe.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {recipe.cuisineName && (
                          <span className="text-xs text-textGray">{recipe.cuisineName}</span>
                        )}
                        {recipe.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-100 text-textGray px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      {recipe.status === "published" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          已发布
                        </span>
                      ) : recipe.status === "pending" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <AlertCircle className="h-3 w-3" />
                          待审核
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <AlertCircle className="h-3 w-3" />
                          草稿
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 规则 JSON（可折叠） */}
      <div className="bg-white border border-cream rounded-lg overflow-hidden">
        <button
          onClick={() => setShowJson(!showJson)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <span className="text-sm font-medium text-textDark">规则配置 (JSON)</span>
          {showJson ? (
            <ChevronUp className="h-4 w-4 text-textGray" />
          ) : (
            <ChevronDown className="h-4 w-4 text-textGray" />
          )}
        </button>

        {showJson && (
          <div className="border-t border-cream p-4">
            <pre className="w-full px-4 py-3 font-mono text-xs bg-gray-50 border border-cream rounded-lg overflow-auto max-h-60">
              {JSON.stringify(collection.rules, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* 排除的食谱 */}
      {collection.excludedRecipeIds.length > 0 && (
        <div className="bg-white border border-cream rounded-lg p-4">
          <h4 className="text-sm font-medium text-textDark mb-2">排除的食谱</h4>
          <p className="text-sm text-textGray">
            已排除 <span className="font-medium text-red-600">{collection.excludedRecipeIds.length}</span> 个食谱，
            这些食谱不会出现在匹配结果中。
          </p>
        </div>
      )}
    </div>
  );
}
