/**
 * 批量导入食谱页面
 *
 * 路由：/admin/recipes/import
 * 支持上传多个 JSON 文件批量导入食谱
 */

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, FileJson, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { ImportPreviewTable } from "@/components/admin/recipes/ImportPreviewTable";
import { ImportResultDialog } from "@/components/admin/recipes/ImportResultDialog";
import {
  parseAndValidateRecipes,
  type ValidatedRecipe,
} from "@/lib/validators/recipe-import";

type ImportStatus = "idle" | "validating" | "previewing" | "importing" | "completed";

// 完整的 JSON 模板 (Schema 2.0.0)
const JSON_TEMPLATE = `{
  "schemaVersion": "2.0.0",
  "recipe": {
    "id": "",
    "titleZh": "????",
    "titleEn": "Sample Recipe",
    "aliases": [],
    "primaryIngredients": ["??"],
    "origin": {
      "country": "??",
      "region": "????",
      "cuisine": "????",
      "notes": ""
    },
    "summary": {
      "oneLine": "?????????",
      "healingTone": "???????????????",
      "flavorTags": [],
      "difficulty": "easy",
      "timeTotalMin": 10,
      "timeActiveMin": 10,
      "servings": 2,
      "scaleHint": ""
    },
    "story": "??????????????????",
    "culturalStory": "",
    "nutrition": {
      "perServing": {
        "calories": 120,
        "protein": 3,
        "fat": 5,
        "carbs": 15,
        "fiber": 2,
        "sodium": 300
      },
      "dietaryLabels": [],
      "disclaimer": ""
    },
    "equipment": [
      { "name": "??", "required": true, "notes": "" },
      { "name": "??", "required": true, "notes": "" }
    ],
    "ingredients": [
      {
        "section": "??",
        "items": [
          {
            "name": "??",
            "iconKey": "veg",
            "amount": 1,
            "unit": "?",
            "prep": "??",
            "optional": false,
            "substitutes": [],
            "allergens": [],
            "notes": ""
          }
        ]
      }
    ],
    "steps": [
      {
        "id": "step01",
        "title": "????",
        "action": "?????????????",
        "speechText": "",
        "timerSec": 0,
        "visualCue": "???????",
        "failPoint": "",
        "photoBrief": "",
        "heat": "low",
        "timeMin": 3,
        "timeMax": 5,
        "statusChecks": [],
        "failurePoints": [],
        "recovery": "",
        "safeNote": null,
        "imagePrompt": "",
        "negativePrompt": "",
        "ingredientRefs": [],
        "equipmentRefs": []
      }
    ],
    "faq": [
      { "question": "?????????", "answer": "??????????" }
    ],
    "tips": [
      "????????????????"
    ],
    "troubleshooting": [
      { "problem": "????", "cause": "?????????", "fix": "?????????" }
    ],
    "relatedRecipes": { "similar": ["???"], "pairing": ["??"] },
    "pairing": { "suggestions": ["??"], "sauceOrSide": ["????"] },
    "tags": {
      "scenes": ["???"],
      "cookingMethods": ["?"],
      "tastes": ["??"],
      "crowds": ["???"],
      "occasions": ["??"]
    },
    "seo": {
      "slug": "sample-recipe",
      "metaTitle": "????",
      "metaDescription": "??????",
      "keywords": ["??", "???"]
    },
    "notes": []
  }
}`;

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ index: number; name: string; error: string }>;
  createdIds: string[];
  createdRecipes?: Array<{ id: string; name: string }>;
}

interface UploadedFile {
  name: string;
  size: number;
}

function parseRecipeJson(text: string, sourceLabel: string): unknown[] {
  const normalized = text.replace(/^\uFEFF/, "").trim();
  if (!normalized) {
    throw new Error(`文件 "${sourceLabel}" 为空`);
  }

  try {
    const parsed = JSON.parse(normalized);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") return [parsed];
  } catch {
    // fallback to block parsing
  }

  const blocks = normalized
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    throw new Error(`文件 "${sourceLabel}" 不是有效的 JSON 格式`);
  }

  const results: unknown[] = [];
  const errors: string[] = [];

  blocks.forEach((block, index) => {
    try {
      results.push(JSON.parse(block));
    } catch (error) {
      const message = error instanceof Error ? error.message : "解析失败";
      errors.push(`第 ${index + 1} 段: ${message}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(
      `文件 "${sourceLabel}" 包含无效 JSON 段落：${errors.slice(0, 3).join("；")}${
        errors.length > 3 ? ` 等 ${errors.length} 处` : ""
      }`
    );
  }

  return results;
}

export default function ImportRecipesPage() {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [validatedRecipes, setValidatedRecipes] = useState<ValidatedRecipe[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"file" | "text">("file");
  const [jsonText, setJsonText] = useState("");
  const [templateExpanded, setTemplateExpanded] = useState(false);
  const [templateCopied, setTemplateCopied] = useState(false);

  const handleCopyTemplate = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON_TEMPLATE);
      setTemplateCopied(true);
      setTimeout(() => setTemplateCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = JSON_TEMPLATE;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setTemplateCopied(true);
      setTimeout(() => setTemplateCopied(false), 2000);
    }
  }, []);

  const handleTextImport = useCallback(() => {
    if (!jsonText.trim()) return;

    setStatus("validating");
    setParseError(null);

    try {
      const recipes = parseRecipeJson(jsonText, "text_input.json");
      const validated = parseAndValidateRecipes(recipes, "text_input.json");

      setValidatedRecipes(validated);
      setUploadedFiles([{ name: "Text Input", size: jsonText.length }]);

      // 默认选中所有验证通过的
      const validIndices = new Set(
        validated.map((r, i) => (r.isValid ? i : -1)).filter((i) => i >= 0)
      );
      setSelectedIndices(validIndices);
      setStatus("previewing");
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "解析失败");
      setStatus("idle");
    }
  }, [jsonText]);

  // 处理文件选择
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setStatus("validating");
      setParseError(null);

      try {
        const allRecipes: ValidatedRecipe[] = [];
        const fileInfos: UploadedFile[] = [];

        for (const file of Array.from(files)) {
          fileInfos.push({ name: file.name, size: file.size });

          const text = await file.text();
          const recipes = parseRecipeJson(text, file.name);
          const validated = parseAndValidateRecipes(recipes, file.name);
          allRecipes.push(...validated);
        }

        setUploadedFiles(fileInfos);
        setValidatedRecipes(allRecipes);

        // 默认选中所有验证通过的
        const validIndices = new Set(
          allRecipes.map((r, i) => (r.isValid ? i : -1)).filter((i) => i >= 0)
        );
        setSelectedIndices(validIndices);
        setStatus("previewing");
      } catch (error) {
        setParseError(error instanceof Error ? error.message : "文件解析失败");
        setStatus("idle");
      }

      // 清空 input 以便重复选择同一文件
      event.target.value = "";
    },
    []
  );

  // 处理拖放
  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const files = event.dataTransfer.files;
      if (!files || files.length === 0) return;

      // 过滤只接受 JSON 和 TXT 文件
      const jsonFiles = Array.from(files).filter(
        (f) => f.type === "application/json" || f.type === "text/plain" || f.name.endsWith(".json") || f.name.endsWith(".txt")
      );

      if (jsonFiles.length === 0) {
        setParseError("请上传 JSON 或 TXT 文件");
        return;
      }

      setStatus("validating");
      setParseError(null);

      try {
        const allRecipes: ValidatedRecipe[] = [];
        const fileInfos: UploadedFile[] = [];

        for (const file of jsonFiles) {
          fileInfos.push({ name: file.name, size: file.size });

          const text = await file.text();
          const recipes = parseRecipeJson(text, file.name);
          const validated = parseAndValidateRecipes(recipes, file.name);
          allRecipes.push(...validated);
        }

        setUploadedFiles(fileInfos);
        setValidatedRecipes(allRecipes);

        const validIndices = new Set(
          allRecipes.map((r, i) => (r.isValid ? i : -1)).filter((i) => i >= 0)
        );
        setSelectedIndices(validIndices);
        setStatus("previewing");
      } catch (error) {
        setParseError(error instanceof Error ? error.message : "文件解析失败");
        setStatus("idle");
      }
    },
    []
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  // 执行批量导入
  const handleImport = useCallback(async () => {
    const recipesToImport = validatedRecipes
      .filter((_, index) => selectedIndices.has(index))
      .filter((r) => r.isValid)
      .map((r) => r.data);

    if (recipesToImport.length === 0) {
      return;
    }

    setStatus("importing");

    try {
      const aggregated: ImportResult = {
        success: 0,
        failed: 0,
        errors: [],
        createdIds: [],
        createdRecipes: [],
      };

      for (let i = 0; i < recipesToImport.length; i += 1) {
        const recipe = recipesToImport[i] as any;
        const recipeName =
          (recipe?.titleZh as string) || (recipe?.title as string) || `食谱 ${i + 1}`;

        try {
          const response = await fetch("/api/admin/recipes/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipes: [recipe] }),
          });

          const result = await response.json();

          if (result.success) {
            const data = result.data || {};
            aggregated.success += data.success || 0;
            aggregated.failed += data.failed || 0;

            if (Array.isArray(data.createdIds)) {
              aggregated.createdIds.push(...data.createdIds);
            }
            if (Array.isArray(data.createdRecipes)) {
              aggregated.createdRecipes?.push(...data.createdRecipes);
            }

            if (Array.isArray(data.errors) && data.errors.length > 0) {
              aggregated.errors.push(
                ...data.errors.map((err: { name?: string; error?: string }) => ({
                  index: i,
                  name: err.name || recipeName,
                  error: err.error || "导入失败",
                }))
              );
            } else if ((data.failed || 0) > 0 && (data.success || 0) === 0) {
              aggregated.errors.push({ index: i, name: recipeName, error: "导入失败" });
            }
          } else {
            aggregated.failed += 1;
            aggregated.errors.push({
              index: i,
              name: recipeName,
              error: result.error || "导入失败",
            });
          }
        } catch {
          aggregated.failed += 1;
          aggregated.errors.push({
            index: i,
            name: recipeName,
            error: "网络请求失败",
          });
        }
      }

      setImportResult(aggregated);
      setStatus("completed");
    } catch (error) {
      setImportResult({
        success: 0,
        failed: recipesToImport.length,
        errors: [{ index: -1, name: "全部", error: "导入失败" }],
        createdIds: [],
        createdRecipes: [],
      });
      setStatus("completed");
    }
  }, [validatedRecipes, selectedIndices]);

  // 重置状态
  const handleReset = useCallback(() => {
    setStatus("idle");
    setUploadedFiles([]);
    setValidatedRecipes([]);
    setSelectedIndices(new Set());
    setImportResult(null);
    setParseError(null);
  }, []);

  const validCount = validatedRecipes.filter((r) => r.isValid).length;
  const invalidCount = validatedRecipes.length - validCount;
  const selectedValidCount = [...selectedIndices].filter(
    (i) => validatedRecipes[i]?.isValid
  ).length;

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/recipes"
          className="p-2 hover:bg-cream rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-textGray" />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-medium text-textDark">
            批量导入食谱
          </h1>
          <p className="text-sm text-textGray mt-1">
            上传 JSON 文件批量导入食谱数据
          </p>
        </div>
      </div>

      {/* 上传区域 */}
      {status === "idle" && (
        <div className="bg-white rounded-xl border border-cream p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileJson className="h-5 w-5 text-brownWarm" />
            <h2 className="text-lg font-medium text-textDark">选择 JSON 数据</h2>
          </div>

          {/* Import Mode Tabs */}
          <div className="flex gap-4 mb-6 border-b border-cream">
            <button
              onClick={() => setImportMode("file")}
              className={`pb-2 text-sm font-medium transition-colors ${importMode === "file" ? "text-brownDark border-b-2 border-brownDark" : "text-textGray hover:text-textDark"}`}
            >
              文件上传
            </button>
            <button
              onClick={() => setImportMode("text")}
              className={`pb-2 text-sm font-medium transition-colors ${importMode === "text" ? "text-brownDark border-b-2 border-brownDark" : "text-textGray hover:text-textDark"}`}
            >
              粘贴文本
            </button>
          </div>

          {importMode === "file" ? (
            <>
              <p className="text-sm text-textGray mb-6">
                支持上传多个 JSON 文件，或一个包含多段 JSON（空行分隔）/数组的 JSON 文件
              </p>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-cream rounded-lg p-8 text-center hover:border-brownWarm transition-colors cursor-pointer"
              >
                <input
                  type="file"
                  accept=".json,.txt,application/json,text/plain"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="json-upload"
                />
                <label htmlFor="json-upload" className="cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto mb-4 text-textGray" />
                  <p className="font-medium text-textDark">拖放 JSON 文件到此处</p>
                  <p className="text-sm text-textGray mt-1">
                    或点击选择文件（最多 10 个，单个不超过 5MB）
                  </p>
                </label>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder="在此粘贴 JSON 内容（多段 JSON 用空行分隔）..."
                className="w-full h-[300px] p-4 border border-cream rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brownWarm"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleTextImport}
                  disabled={!jsonText.trim()}
                  className="px-6 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownWarm/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  解析 JSON
                </button>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {parseError && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg text-sm text-red-700">
              {parseError}
            </div>
          )}

          {/* JSON 模板格式 */}
          <div className="mt-6 p-4 bg-cream/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-textDark">
                JSON 模板格式
              </p>
              <button
                onClick={handleCopyTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brownDark bg-white border border-cream rounded-md hover:bg-cream/50 transition-colors"
              >
                {templateCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    复制模板
                  </>
                )}
              </button>
            </div>

            {/* 可展开/收起的模板 */}
            <button
              onClick={() => setTemplateExpanded(!templateExpanded)}
              className="flex items-center gap-2 text-sm text-textGray hover:text-textDark transition-colors mb-2"
            >
              {templateExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              查看完整 JSON 模板 (点击展开/收起)
            </button>

            {templateExpanded && (
              <pre className="text-xs text-textGray bg-white p-3 rounded overflow-x-auto max-h-[400px] overflow-y-auto border border-cream">
                {JSON_TEMPLATE}
              </pre>
            )}

            {/* 字段说明 */}
            <div className="mt-3 text-xs text-textGray space-y-1">
              <p><span className="font-medium">iconKey 可选值:</span> meat, veg, seafood, spice, sauce, grain, dairy, other</p>
              <p><span className="font-medium">heat 可选值:</span> low, medium, high 或中文（小火、中火、大火）</p>
              <p><span className="font-medium">difficulty 可选值:</span> easy, medium, hard</p>
            </div>
          </div>
        </div>
      )
      }

      {/* 验证中状态 */}
      {
        status === "validating" && (
          <div className="bg-white rounded-xl border border-cream p-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-brownWarm border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-textGray">正在验证 JSON 数据...</p>
          </div>
        )
      }

      {/* 预览表格 */}
      {
        status === "previewing" && (
          <>
            {/* 统计信息 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-cream p-4">
                <div className="text-2xl font-bold text-textDark">
                  {validatedRecipes.length}
                </div>
                <p className="text-sm text-textGray">总计食谱</p>
              </div>
              <div className="bg-white rounded-xl border border-cream p-4">
                <div className="text-2xl font-bold text-green-600">{validCount}</div>
                <p className="text-sm text-textGray">验证通过</p>
              </div>
              <div className="bg-white rounded-xl border border-cream p-4">
                <div className="text-2xl font-bold text-red-600">{invalidCount}</div>
                <p className="text-sm text-textGray">验证失败</p>
              </div>
            </div>

            {/* 预览表格 */}
            <div className="bg-white rounded-xl border border-cream p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-medium text-textDark">预览导入内容</h2>
                  <p className="text-sm text-textGray mt-1">
                    已选择 {selectedValidCount} 个有效食谱准备导入
                  </p>
                </div>
                <div className="text-sm text-textGray">
                  来自 {uploadedFiles.length} 个文件
                </div>
              </div>

              <ImportPreviewTable
                recipes={validatedRecipes}
                selectedIndices={selectedIndices}
                onSelectionChange={setSelectedIndices}
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-2 text-sm font-medium text-textGray hover:text-textDark transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                disabled={selectedValidCount === 0}
                className="px-6 py-2 text-sm font-medium bg-brownDark text-white rounded-lg hover:bg-brownDark/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                导入 {selectedValidCount} 个食谱
              </button>
            </div>
          </>
        )
      }

      {/* 导入中状态 */}
      {
        status === "importing" && (
          <div className="bg-white rounded-xl border border-cream p-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-brownWarm border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-textGray">正在批量导入食谱...</p>
          </div>
        )
      }

      {/* 导入结果弹窗 */}
      <ImportResultDialog
        open={status === "completed"}
        result={importResult}
        onClose={handleReset}
      />
    </div >
  );
}
