/**
 * 导入预览表格组件
 *
 * 显示验证结果，支持批量选择
 */

"use client";

import { useMemo } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { type ValidatedRecipe, extractDisplayInfo } from "@/lib/validators/recipe-import";

interface ImportPreviewTableProps {
  recipes: ValidatedRecipe[];
  selectedIndices: Set<number>;
  onSelectionChange: (indices: Set<number>) => void;
}

export function ImportPreviewTable({
  recipes,
  selectedIndices,
  onSelectionChange,
}: ImportPreviewTableProps) {
  const validRecipes = useMemo(
    () => recipes.filter((r) => r.isValid),
    [recipes]
  );

  const allValidSelected = useMemo(() => {
    if (validRecipes.length === 0) return false;
    return validRecipes.every((r) => {
      const originalIndex = recipes.indexOf(r);
      return selectedIndices.has(originalIndex);
    });
  }, [validRecipes, recipes, selectedIndices]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const validIndices = recipes
        .map((r, i) => (r.isValid ? i : -1))
        .filter((i) => i >= 0);
      onSelectionChange(new Set(validIndices));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectOne = (index: number, checked: boolean) => {
    const newSet = new Set(selectedIndices);
    if (checked) {
      newSet.add(index);
    } else {
      newSet.delete(index);
    }
    onSelectionChange(newSet);
  };

  return (
    <div className="border border-cream rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-cream/30">
          <tr>
            <th className="w-12 px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={allValidSelected && validRecipes.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
            </th>
            <th className="w-16 px-4 py-3 text-left text-sm font-medium text-textGray">
              状态
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-textGray">
              食谱名称
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-textGray">
              描述
            </th>
            <th className="w-24 px-4 py-3 text-left text-sm font-medium text-textGray">
              难度
            </th>
            <th className="w-24 px-4 py-3 text-left text-sm font-medium text-textGray">
              时长
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-textGray">
              来源
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cream">
          {recipes.map((recipe, index) => {
            const displayInfo = extractDisplayInfo(recipe.rawData);
            const isSelected = selectedIndices.has(index);

            return (
              <tr
                key={index}
                className={
                  !recipe.isValid
                    ? "bg-red-50"
                    : isSelected
                    ? "bg-brownWarm/5"
                    : ""
                }
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectOne(index, e.target.checked)}
                    disabled={!recipe.isValid}
                    className="w-4 h-4 rounded border-gray-300 disabled:opacity-50"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="relative group">
                    {recipe.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500 cursor-help" />
                        {/* 错误提示 Tooltip */}
                        <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                          <p className="font-medium mb-1">验证失败：</p>
                          <ul className="space-y-0.5">
                            {recipe.errors?.slice(0, 5).map((err, i) => (
                              <li key={i}>• {err}</li>
                            ))}
                            {(recipe.errors?.length || 0) > 5 && (
                              <li>...还有 {(recipe.errors?.length || 0) - 5} 个错误</li>
                            )}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-textDark">
                  {displayInfo.title || (
                    <span className="text-textGray italic">无标题</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-textGray max-w-xs truncate">
                  {displayInfo.description || "-"}
                </td>
                <td className="px-4 py-3">
                  {displayInfo.difficulty && (
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                        displayInfo.difficulty === "easy"
                          ? "bg-green-100 text-green-700"
                          : displayInfo.difficulty === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {displayInfo.difficulty === "easy"
                        ? "简单"
                        : displayInfo.difficulty === "medium"
                        ? "中等"
                        : "困难"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-textGray">
                  {displayInfo.time || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-textGray truncate max-w-[120px]">
                  {recipe.sourceFile}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
