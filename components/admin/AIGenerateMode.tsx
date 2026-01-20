/**
 * AI 生成模式组件
 *
 * AI 批量生成新食谱
 */

"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import type { CollectionDetail } from "@/lib/types/collection-api";

interface AIGenerateModeProps {
  collection: CollectionDetail;
  onRefresh: () => Promise<void>;
}

export default function AIGenerateMode({ collection, onRefresh }: AIGenerateModeProps) {
  const [generating, setGenerating] = useState(false);
  const [batchSize, setBatchSize] = useState(10);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [progress, setProgress] = useState(0);

  // AI 批量生成
  const handleBatchGenerate = async () => {
    if (!confirm(`确定要生成 ${batchSize} 道食谱吗？\n\n生成的食谱将进入待审核状态，您可以在审核后发布。`)) {
      return;
    }

    setGenerating(true);
    setGeneratedCount(0);
    setProgress(0);

    try {
      // 批量调用 AI 生成接口
      const promises = [];
      for (let i = 0; i < batchSize; i++) {
        const promise = fetch(`/api/admin/collections/${collection.id}/ai/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }).then(async (response) => {
          const data = await response.json();
          if (data.success) {
            setGeneratedCount(prev => prev + 1);
            setProgress(prev => Math.min(prev + (100 / batchSize), 100));
          }
          return data;
        });
        promises.push(promise);

        // 每次请求间隔 500ms，避免并发过高
        if (i < batchSize - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      await Promise.all(promises);
      await onRefresh();
      alert(`成功生成 ${generatedCount} 道食谱！\n\n请前往"审核"页面查看并发布。`);
    } catch (error) {
      console.error("批量生成失败:", error);
      alert("批量生成失败，请稍后重试");
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* 当前状态 */}
      <div className="bg-white rounded-lg border border-cream p-6">
        <h4 className="text-base font-medium text-textDark mb-4">当前状态</h4>

        <div className="grid grid-cols-3 gap-4 mb-4">
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

      {/* AI 批量生成 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h4 className="font-medium text-purple-900">AI 批量生成食谱</h4>
            <p className="text-sm text-purple-700 mt-1">
              AI 将根据"{collection.name}"主题批量生成食谱，生成的食谱将进入待审核状态
            </p>
          </div>
        </div>

        {!generating ? (
          <div className="space-y-4">
            {/* 生成数量 */}
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                生成数量
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value))}
                  className="flex-1"
                />
                <div className="w-20 text-center">
                  <span className="text-2xl font-bold text-purple-600">{batchSize}</span>
                  <span className="text-sm text-textGray ml-1">道</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-textGray mt-1">
                <span>5 道</span>
                <span>50 道</span>
              </div>
            </div>

            {/* 质量说明 */}
            <div className="p-4 bg-white rounded-lg border border-purple-200">
              <div className="text-sm font-medium text-textDark mb-2">生成说明</div>
              <ul className="text-sm text-textGray space-y-1">
                <li>• AI 将根据聚合页主题生成相关食谱</li>
                <li>• 生成的食谱包含完整的食材、步骤、营养信息</li>
                <li>• 所有食谱将进入"待审核"状态，需要人工审核后发布</li>
                <li>• 建议每次生成 10-20 道，确保质量</li>
              </ul>
            </div>

            {/* 生成按钮 */}
            <button
              onClick={handleBatchGenerate}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <Sparkles className="h-5 w-5" />
              开始生成 {batchSize} 道食谱
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 生成进度 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-900">
                  正在生成食谱...
                </span>
                <span className="text-sm text-purple-700">
                  {generatedCount} / {batchSize}
                </span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-purple-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-purple-700 mt-1 text-right">
                {progress.toFixed(0)}%
              </div>
            </div>

            {/* 生成提示 */}
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-purple-200">
              <Loader2 className="h-5 w-5 text-purple-600 animate-spin flex-shrink-0" />
              <span className="text-sm text-purple-800">
                AI 正在努力生成中，请稍候...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 使用建议 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-amber-900 mb-1">使用建议</div>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• 首次使用建议生成 10-15 道食谱测试效果</li>
              <li>• 生成后请及时审核，确保内容质量</li>
              <li>• 如果生成的食谱不符合要求，可以删除后重新生成</li>
              <li>• 建议配合"智能匹配模式"使用，先匹配现有食谱，再用 AI 补充</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
