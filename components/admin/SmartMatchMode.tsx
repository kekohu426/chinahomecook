/**
 * 智能匹配模式组件
 *
 * AI 自动生成规则，从现有库中筛选食谱
 */

"use client";

import { useState, useEffect } from "react";
import { Sparkles, Settings, Play, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { CollectionDetail } from "@/lib/types/collection-api";

interface SmartMatchModeProps {
  collection: CollectionDetail;
  onRefresh: () => Promise<void>;
}

interface TagData {
  scenes: Array<{ id: string; name: string }>;
  cookingMethods: Array<{ id: string; name: string }>;
  tastes: Array<{ id: string; name: string }>;
  crowds: Array<{ id: string; name: string }>;
  occasions: Array<{ id: string; name: string }>;
}

export default function SmartMatchMode({ collection, onRefresh }: SmartMatchModeProps) {
  const [generating, setGenerating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tags, setTags] = useState<TagData | null>(null);
  const [justGenerated, setJustGenerated] = useState(false); // 标记刚生成的规则
  const [generatedInfo, setGeneratedInfo] = useState<{ explanation: string; confidence: number } | null>(null); // 生成信息

  // 加载标签数据
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await fetch("/api/admin/config/tags/available");
        const data = await response.json();
        if (data.success) {
          setTags(data.data);
        }
      } catch (error) {
        console.error("加载标签失败:", error);
      }
    };
    loadTags();
  }, []);

  // AI 生成规则
  const handleGenerateRules = async () => {
    if (!aiInput.trim()) {
      alert("请输入描述");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/admin/collections/generate-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: aiInput }),
      });

      const data = await response.json();
      if (data.success) {
        // 保存生成的规则
        const saveResponse = await fetch(`/api/admin/collections/${collection.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ruleType: "custom",
            rules: {
              mode: "custom",
              groups: data.data.rules.map((group: any) => ({
                logic: group.logic,
                conditions: group.rules.map((rule: any) => ({
                  field: "tagId",
                  operator: rule.operator === "equals" ? "eq" : "in",
                  value: rule.value,
                  tagType: rule.field,
                })),
              })),
              exclude: [],
            },
          }),
        });

        if (saveResponse.ok) {
          await onRefresh();
          setJustGenerated(true); // 标记刚生成
          setGeneratedInfo({
            explanation: data.data.explanation,
            confidence: data.data.confidence,
          });
          setAiInput("");

          // 滚动到顶部查看规则
          window.scrollTo({ top: 0, behavior: "smooth" });

          // 5秒后移除高亮
          setTimeout(() => {
            setJustGenerated(false);
            setGeneratedInfo(null);
          }, 5000);
        }
      } else {
        alert(data.error || "生成失败");
      }
    } catch (error) {
      console.error("生成规则失败:", error);
      alert("生成失败，请稍后重试");
    } finally {
      setGenerating(false);
    }
  };

  // 测试规则
  const handleTestRules = async () => {
    setTesting(true);
    try {
      const response = await fetch(`/api/admin/collections/${collection.id}/test-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules: collection.rules,
          excludedRecipeIds: collection.excludedRecipeIds,
          limit: 20,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`匹配结果：\n\n总匹配: ${data.data.counts.matched}\n已发布: ${data.data.counts.published}\n待审核: ${data.data.counts.pending}\n草稿: ${data.data.counts.draft}`);
      }
    } catch (error) {
      console.error("测试失败:", error);
    } finally {
      setTesting(false);
    }
  };

  const hasRules = collection.rules.mode === "custom" && (collection.rules as any).groups?.length > 0;
  const ruleGroups = hasRules ? (collection.rules as any).groups : [];

  // 格式化规则显示
  const formatRuleDisplay = () => {
    if (!hasRules || !tags) return null;

    const tagTypeLabels: Record<string, string> = {
      scene: "场景",
      method: "烹饪方式",
      taste: "口味",
      crowd: "人群",
      occasion: "场合",
    };

    // 根据 ID 查找标签名称
    const getTagName = (tagType: string, tagId: string): string => {
      const tagMap: Record<string, Array<{ id: string; name: string }>> = {
        scene: tags.scenes,
        method: tags.cookingMethods,
        taste: tags.tastes,
        crowd: tags.crowds,
        occasion: tags.occasions,
      };

      const tagList = tagMap[tagType];
      if (!tagList) return tagId;

      const tag = tagList.find(t => t.id === tagId);
      return tag ? tag.name : tagId;
    };

    return ruleGroups.map((group: any, idx: number) => (
      <div key={idx} className="mb-3 last:mb-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
            规则组 {idx + 1}
          </span>
          <span className="text-xs text-blue-600">
            {group.logic === "AND" ? "同时满足以下条件" : "满足以下任一条件"}
          </span>
        </div>
        <div className="space-y-1.5 pl-4 border-l-2 border-blue-200">
          {group.conditions?.map((condition: any, condIdx: number) => (
            <div key={condIdx} className="flex items-center gap-2">
              <span className="text-xs text-blue-600">•</span>
              <span className="text-sm text-textDark">
                <span className="font-medium">{tagTypeLabels[condition.tagType] || condition.tagType}</span>
                {" = "}
                <span className="text-blue-700">{getTagName(condition.tagType, condition.value)}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* 当前配置 */}
      <div className="bg-white rounded-lg border border-cream p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-medium text-textDark">当前配置</h4>
          <div className="flex items-center gap-3">
            {hasRules && (
              <button
                onClick={handleTestRules}
                disabled={testing}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-brownWarm hover:bg-brownWarm hover:text-white border border-brownWarm rounded-lg transition-colors disabled:opacity-50"
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                测试规则
              </button>
            )}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-textGray hover:text-textDark border border-cream rounded-lg transition-colors"
            >
              <Settings className="h-4 w-4" />
              {showAdvanced ? "隐藏" : "高级"}设置
            </button>
          </div>
        </div>

        {hasRules ? (
          <div className="space-y-4">
            {/* 生成成功提示 */}
            {justGenerated && generatedInfo && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-4 shadow-lg animate-pulse">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-base font-medium text-green-900 mb-2">
                      ✨ 规则生成成功！
                    </div>
                    <div className="text-sm text-green-800 mb-2">
                      {generatedInfo.explanation}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        置信度: {(generatedInfo.confidence * 100).toFixed(0)}%
                      </span>
                      <span className="text-xs text-green-600">
                        👇 请查看下方的匹配规则
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 匹配规则展示 - 添加高亮动画 */}
            <div className={`rounded-lg p-4 border transition-all duration-500 ${
              justGenerated
                ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-400 shadow-lg ring-2 ring-blue-300"
                : "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-blue-900">📋 当前匹配规则</div>
                {justGenerated && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                    <Sparkles className="h-3 w-3" />
                    新生成
                  </span>
                )}
              </div>
              {formatRuleDisplay()}
            </div>

            {/* 匹配结果 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-textDark">{collection.matchedCount}</div>
                <div className="text-xs text-textGray">总匹配</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{collection.publishedCount}</div>
                <div className="text-xs text-textGray">已发布</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{collection.pendingCount}</div>
                <div className="text-xs text-textGray">待审核</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{collection.draftCount}</div>
                <div className="text-xs text-textGray">草稿</div>
              </div>
            </div>

            {/* 达标状态 */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              {collection.publishedCount >= collection.minRequired ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-800">
                    已达标！当前 {collection.publishedCount} 道，最低要求 {collection.minRequired} 道
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <span className="text-sm text-amber-800">
                    还需 {collection.minRequired - collection.publishedCount} 道食谱才能达标
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-textGray mx-auto mb-3" />
            <p className="text-sm text-textGray mb-4">还未配置匹配规则</p>
            <p className="text-xs text-textGray">使用下方的 AI 智能生成功能快速创建规则</p>
          </div>
        )}
      </div>

      {/* AI 智能生成 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
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

        <div className="space-y-4">
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

          {/* 提示：生成后在哪里查看 */}
          {!hasRules && (
            <div className="flex items-start gap-2 p-3 bg-purple-100 rounded-lg">
              <AlertCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-purple-800">
                生成成功后，规则将显示在上方的"当前配置"区域中
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 高级设置（折叠） */}
      {showAdvanced && hasRules && (
        <div className="bg-white rounded-lg border border-cream p-6">
          <h4 className="text-base font-medium text-textDark mb-4">高级设置</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                规则配置 (JSON)
              </label>
              <pre className="w-full px-4 py-3 font-mono text-xs bg-gray-50 border border-cream rounded-lg overflow-auto max-h-60">
                {JSON.stringify(collection.rules, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
