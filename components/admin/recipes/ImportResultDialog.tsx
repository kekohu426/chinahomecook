/**
 * 导入结果弹窗组件
 *
 * 显示导入成功/失败统计和详情
 */

"use client";

import { CheckCircle, XCircle, AlertTriangle, X, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ index: number; name: string; error: string }>;
  createdIds: string[];
  createdRecipes?: Array<{ id: string; name: string }>;
}

interface ImportResultDialogProps {
  open: boolean;
  result: ImportResult | null;
  onClose: () => void;
}

export function ImportResultDialog({
  open,
  result,
  onClose,
}: ImportResultDialogProps) {
  if (!open || !result) return null;

  const isAllSuccess = result.failed === 0;
  const isAllFailed = result.success === 0;
  const isPartial = !isAllSuccess && !isAllFailed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream">
          <div className="flex items-center gap-3">
            {isAllSuccess && (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                <h3 className="text-lg font-medium text-textDark">导入成功</h3>
              </>
            )}
            {isAllFailed && (
              <>
                <XCircle className="h-6 w-6 text-red-500" />
                <h3 className="text-lg font-medium text-textDark">导入失败</h3>
              </>
            )}
            {isPartial && (
              <>
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                <h3 className="text-lg font-medium text-textDark">部分导入成功</h3>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-cream rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-textGray" />
          </button>
        </div>

        {/* 统计信息 */}
        <div className="px-6 py-4">
          <p className="text-textGray">
            成功导入 <span className="font-medium text-green-600">{result.success}</span> 个食谱
            {result.failed > 0 && (
              <>
                ，<span className="font-medium text-red-600">{result.failed}</span> 个失败
              </>
            )}
          </p>
        </div>

        {/* 成功导入的食谱列表 */}
        {result.createdIds.length > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-green-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-sm font-medium text-green-800 mb-2">已导入食谱：</p>
              <ul className="text-sm space-y-2">
                {result.createdIds.map((id, i) => (
                  <li key={id} className="flex items-center justify-between text-green-700">
                    <span>
                      {result.createdRecipes?.[i]?.name || `食谱 ${i + 1}`}
                    </span>
                    <Link
                      href={`/admin/recipes/${id}/edit`}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 hover:bg-green-200 rounded transition-colors"
                    >
                      查看 <ExternalLink className="h-3 w-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 错误详情 */}
        {result.errors.length > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-red-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-sm font-medium text-red-800 mb-2">失败详情：</p>
              <ul className="text-sm space-y-1">
                {result.errors.map((err, i) => (
                  <li key={i} className="text-red-700">
                    • <span className="font-medium">{err.name}</span>: {err.error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="px-6 py-4 bg-cream/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-textGray hover:text-textDark transition-colors"
          >
            继续导入
          </button>
          <Link
            href="/admin/recipes"
            className="px-4 py-2 text-sm font-medium bg-brownDark text-white rounded-lg hover:bg-brownDark/90 transition-colors"
          >
            返回食谱列表
          </Link>
        </div>
      </div>
    </div>
  );
}
