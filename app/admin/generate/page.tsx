"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Sparkles, Loader2, CheckCircle, XCircle, List } from "lucide-react";

interface Location {
  id: string;
  name: string;
}

interface Cuisine {
  id: string;
  name: string;
}

const SINGLE_STAGES = [
  { label: "准备任务", detail: "校验输入并组装提示词" },
  { label: "生成菜谱文本", detail: "调用 AI 生成结构化内容" },
  { label: "清洗与校验", detail: "解析 JSON、补全字段、校验 Schema" },
  { label: "生成图片", detail: "生成封面/步骤图并转存" },
  { label: "保存入库", detail: "写入数据库并建立索引" },
  { label: "完成", detail: "生成结束，等待审核" },
];

const BATCH_STAGES = [
  { label: "准备任务", detail: "设置参数并创建请求" },
  { label: "生成菜谱文本", detail: "调用 AI 生成结构化内容" },
  { label: "清洗与校验", detail: "解析 JSON、补全字段、校验 Schema" },
  { label: "生成图片", detail: "生成封面/步骤图并转存" },
  { label: "保存入库", detail: "写入数据库并建立索引" },
];

export default function GeneratePage() {
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [locations, setLocations] = useState<Location[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [batchProgress, setBatchProgress] = useState<
    Array<{
      dishName: string;
      status: "pending" | "generating" | "success" | "failed";
      error?: string;
      warning?: string;
    }>
  >([]);

  // 单个生成表单
  const [singleForm, setSingleForm] = useState({
    dishName: "",
    location: "",
    cuisine: "",
    mainIngredients: "",
  });

  // 批量生成表单
  const [batchForm, setBatchForm] = useState({
    dishNames: "",
    location: "",
    cuisine: "",
  });

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [singleStageIndex, setSingleStageIndex] = useState<number | null>(null);
  const [singleStartedAt, setSingleStartedAt] = useState<number | null>(null);
  const [batchStageIndex, setBatchStageIndex] = useState<number | null>(null);
  const [batchStageDish, setBatchStageDish] = useState<string | null>(null);
  const [batchStageStatus, setBatchStageStatus] = useState<"running" | "success" | "failed" | null>(null);
  const [batchStartedAt, setBatchStartedAt] = useState<number | null>(null);
  const singleStageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const batchStageTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    try {
      const [locationsRes, cuisinesRes] = await Promise.all([
        fetch("/api/config/locations?active=true"),
        fetch("/api/config/cuisines?active=true"),
      ]);

      const [locationsData, cuisinesData] = await Promise.all([
        locationsRes.json(),
        cuisinesRes.json(),
      ]);

      if (locationsData.success) setLocations(locationsData.data);
      if (cuisinesData.success) setCuisines(cuisinesData.data);
    } catch (error) {
      console.error("加载配置失败:", error);
    }
  }

  async function handleSingleGenerate(e: React.FormEvent) {
    e.preventDefault();

    if (!singleForm.dishName) {
      alert("请输入菜名");
      return;
    }

    setGenerating(true);
    setResult(null);
    setSingleStageIndex(0);
    setSingleStartedAt(Date.now());
    if (singleStageTimerRef.current) {
      clearInterval(singleStageTimerRef.current);
    }
    singleStageTimerRef.current = setInterval(() => {
      setSingleStageIndex((prev) => {
        if (prev === null) return prev;
        const max = SINGLE_STAGES.length - 2;
        return prev >= max ? prev : prev + 1;
      });
    }, 4000);

    try {
      const res = await fetch("/api/ai/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dishName: singleForm.dishName,
          location: singleForm.location || undefined,
          cuisine: singleForm.cuisine || undefined,
          mainIngredients: singleForm.mainIngredients
            ? singleForm.mainIngredients.split(",").map((i) => i.trim())
            : undefined,
          autoSave: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({
          success: true,
          message: data.message,
          recipe: data.data,
          warning: data.warning,
          stats: data.stats,
        });
        // 清空表单
        setSingleForm({
          dishName: "",
          location: "",
          cuisine: "",
          mainIngredients: "",
        });
      } else {
        setResult({
          success: false,
          error: data.error,
        });
      }
    } catch (error) {
      console.error("生成失败:", error);
      setResult({
        success: false,
        error: "生成失败",
      });
    } finally {
      setGenerating(false);
      if (singleStageTimerRef.current) {
        clearInterval(singleStageTimerRef.current);
      }
      setSingleStageIndex(SINGLE_STAGES.length - 1);
    }
  }

  async function handleBatchGenerate(e: React.FormEvent) {
    e.preventDefault();

    if (!batchForm.dishNames) {
      alert("请输入菜名列表");
      return;
    }

    const dishNames = batchForm.dishNames
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name);

    if (dishNames.length === 0) {
      alert("请输入至少一个菜名");
      return;
    }

    setGenerating(true);
    setResult(null);
    setBatchProgress(
      dishNames.map((dishName) => ({ dishName, status: "pending" }))
    );
    setBatchStartedAt(Date.now());

    let successCount = 0;
    let failedCount = 0;
    const results: Array<{ dishName: string; success: boolean; error?: string }> = [];

    for (let i = 0; i < dishNames.length; i++) {
      const dishName = dishNames[i];
      setBatchProgress((prev) =>
        prev.map((item) =>
          item.dishName === dishName
            ? { ...item, status: "generating" }
            : item
        )
      );
      setBatchStageDish(dishName);
      setBatchStageIndex(0);
      setBatchStageStatus("running");
      if (batchStageTimerRef.current) {
        clearInterval(batchStageTimerRef.current);
      }
      batchStageTimerRef.current = setInterval(() => {
        setBatchStageIndex((prev) => {
          if (prev === null) return prev;
          const max = BATCH_STAGES.length - 1;
          return prev >= max ? prev : prev + 1;
        });
      }, 3500);

      try {
        const res = await fetch("/api/ai/generate-recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dishName,
            location: batchForm.location || undefined,
            cuisine: batchForm.cuisine || undefined,
            autoSave: true,
          }),
        });

        const data = await res.json();

        if (data.success) {
          successCount += 1;
          results.push({ dishName, success: true });
          setBatchProgress((prev) =>
            prev.map((item) =>
              item.dishName === dishName
                ? { ...item, status: "success", warning: data.warning }
                : item
            )
          );
          setBatchStageStatus("success");
        } else {
          failedCount += 1;
          results.push({ dishName, success: false, error: data.error });
          setBatchProgress((prev) =>
            prev.map((item) =>
              item.dishName === dishName
                ? { ...item, status: "failed", error: data.error }
                : item
            )
          );
          setBatchStageStatus("failed");
        }
      } catch (error) {
        failedCount += 1;
        results.push({ dishName, success: false, error: "生成失败" });
        setBatchProgress((prev) =>
          prev.map((item) =>
            item.dishName === dishName
              ? { ...item, status: "failed", error: "生成失败" }
              : item
          )
        );
        setBatchStageStatus("failed");
      }
      if (batchStageTimerRef.current) {
        clearInterval(batchStageTimerRef.current);
      }
      setBatchStageIndex(BATCH_STAGES.length - 1);
    }

    setResult({
      success: failedCount === 0,
      message:
        failedCount === 0
          ? `批量生成完成：成功 ${successCount}/${dishNames.length}`
          : `批量生成完成：成功 ${successCount}/${dishNames.length}，失败 ${failedCount}`,
      stats: {
        total: dishNames.length,
        generated: successCount,
        failed: failedCount,
        results,
      },
    });

    setBatchForm({
      dishNames: "",
      location: "",
      cuisine: "",
    });
    setGenerating(false);
    setBatchStageDish(null);
    setBatchStageIndex(null);
    setBatchStageStatus(null);
  }

  useEffect(() => {
    return () => {
      if (singleStageTimerRef.current) clearInterval(singleStageTimerRef.current);
      if (batchStageTimerRef.current) clearInterval(batchStageTimerRef.current);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-medium text-sage-800 mb-2">
            <Sparkles className="w-8 h-8 inline mr-2 text-purple-500" />
            AI生成菜谱
          </h1>
          <p className="text-sage-500">使用AI快速生成高质量菜谱</p>
        </div>
        <Link
          href="/admin/recipes"
          className="px-4 py-2 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-lg transition-colors"
        >
          返回食谱管理
        </Link>
      </div>

      {/* 模式切换 */}
      <div className="flex gap-2 mb-6 border-b border-sage-200">
        <button
          onClick={() => setMode("single")}
          className={`px-6 py-3 font-medium transition-colors ${
            mode === "single"
              ? "text-sage-700 border-b-2 border-sage-600"
              : "text-sage-500 hover:text-sage-700"
          }`}
        >
          单个生成
        </button>
        <button
          onClick={() => setMode("batch")}
          className={`px-6 py-3 font-medium transition-colors ${
            mode === "batch"
              ? "text-sage-700 border-b-2 border-sage-600"
              : "text-sage-500 hover:text-sage-700"
          }`}
        >
          <List className="w-4 h-4 inline mr-2" />
          批量生成
        </button>
      </div>

      {/* 单个生成表单 */}
      {mode === "single" && (
        <form onSubmit={handleSingleGenerate} className="space-y-6">
          <div className="bg-white rounded-lg border border-sage-200 p-6">
            {/* 菜名 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-sage-700 mb-2">
                菜名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={singleForm.dishName}
                onChange={(e) =>
                  setSingleForm({ ...singleForm, dishName: e.target.value })
                }
                placeholder="例如：麻婆豆腐"
                className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                disabled={generating}
              />
            </div>

            {/* 地点 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-sage-700 mb-2">
                地点（可选）
              </label>
              <select
                value={singleForm.location}
                onChange={(e) =>
                  setSingleForm({ ...singleForm, location: e.target.value })
                }
                className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                disabled={generating}
              >
                <option value="">不指定</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 菜系 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-sage-700 mb-2">
                菜系（可选）
              </label>
              <select
                value={singleForm.cuisine}
                onChange={(e) =>
                  setSingleForm({ ...singleForm, cuisine: e.target.value })
                }
                className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                disabled={generating}
              >
                <option value="">不指定</option>
                {cuisines.map((cui) => (
                  <option key={cui.id} value={cui.name}>
                    {cui.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 主要食材 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-sage-700 mb-2">
                主要食材（可选，用逗号分隔）
              </label>
              <input
                type="text"
                value={singleForm.mainIngredients}
                onChange={(e) =>
                  setSingleForm({
                    ...singleForm,
                    mainIngredients: e.target.value,
                  })
                }
                placeholder="例如：豆腐,猪肉"
                className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                disabled={generating}
              />
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={generating}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 inline animate-spin mr-2" />
                  正在生成...（约3-5秒）
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 inline mr-2" />
                  生成菜谱
                </>
              )}
            </button>

            {(generating || singleStageIndex !== null) && (
              <div className="mt-6 bg-sage-50 border border-sage-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-sage-700">生成进度</span>
                  {singleStartedAt && (
                    <span className="text-xs text-sage-500">
                      已用时 {Math.max(1, Math.round((Date.now() - singleStartedAt) / 1000))} 秒
                    </span>
                  )}
                </div>
                <ol className="space-y-2">
                  {SINGLE_STAGES.map((stage, idx) => {
                    const status =
                      singleStageIndex === null
                        ? "pending"
                        : idx < singleStageIndex
                        ? "done"
                        : idx === singleStageIndex
                        ? "current"
                        : "pending";
                    return (
                      <li key={stage.label} className="flex items-start gap-3">
                        <span
                          className={`mt-1 h-2.5 w-2.5 rounded-full ${
                            status === "done"
                              ? "bg-green-500"
                              : status === "current"
                              ? "bg-purple-500"
                              : "bg-sage-300"
                          }`}
                        />
                        <div>
                          <div className="text-sm text-sage-700">
                            {stage.label}
                            {status === "current" ? " · 进行中" : status === "done" ? " · 完成" : ""}
                          </div>
                          <div className="text-xs text-sage-500">{stage.detail}</div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {result?.stats && (
                  <div className="mt-3 text-xs text-sage-600">
                    生成图片：步骤图 {result.stats.stepImages} 张，成品图 {result.stats.coverImages} 张
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      )}

      {/* 批量生成表单 */}
      {mode === "batch" && (
        <form onSubmit={handleBatchGenerate} className="space-y-6">
          <div className="bg-white rounded-lg border border-sage-200 p-6">
            {/* 菜名列表 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-sage-700 mb-2">
                菜名列表 <span className="text-red-500">*</span>
                <span className="text-sage-400 text-xs ml-2">
                  （每行一个菜名）
                </span>
              </label>
              <textarea
                value={batchForm.dishNames}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, dishNames: e.target.value })
                }
                placeholder={"麻婆豆腐\n宫保鸡丁\n回锅肉\n鱼香肉丝\n水煮鱼"}
                rows={8}
                className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent font-mono text-sm"
                disabled={generating}
              />
              <p className="text-xs text-sage-400 mt-1">
                当前: {batchForm.dishNames.split("\n").filter((n) => n.trim()).length}{" "}
                个菜名
              </p>
            </div>

            {/* 地点 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-sage-700 mb-2">
                统一地点（可选）
              </label>
              <select
                value={batchForm.location}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, location: e.target.value })
                }
                className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                disabled={generating}
              >
                <option value="">不指定</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 菜系 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-sage-700 mb-2">
                统一菜系（可选）
              </label>
              <select
                value={batchForm.cuisine}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, cuisine: e.target.value })
                }
                className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                disabled={generating}
              >
                <option value="">不指定</option>
                {cuisines.map((cui) => (
                  <option key={cui.id} value={cui.name}>
                    {cui.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={generating}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 inline animate-spin mr-2" />
                  正在批量生成...（预计{" "}
                  {batchForm.dishNames.split("\n").filter((n) => n.trim()).length * 4}
                  -
                  {batchForm.dishNames.split("\n").filter((n) => n.trim()).length * 6}
                  秒）
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 inline mr-2" />
                  开始批量生成
                </>
              )}
            </button>
          </div>

          {batchProgress.length > 0 && (
            <div className="bg-white rounded-lg border border-sage-200 p-6">
              <h3 className="text-sm font-medium text-sage-700 mb-4">
                生成进度
              </h3>
              {(batchStageDish || batchStageIndex !== null) && (
                <div className="mb-4 p-3 bg-sage-50 border border-sage-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-sage-700">
                      当前任务：{batchStageDish || "处理中"}
                    </span>
                    {batchStartedAt && (
                      <span className="text-xs text-sage-500">
                        已用时 {Math.max(1, Math.round((Date.now() - batchStartedAt) / 1000))} 秒
                      </span>
                    )}
                  </div>
                  <ol className="space-y-2">
                    {BATCH_STAGES.map((stage, idx) => {
                      const status =
                        batchStageIndex === null
                          ? "pending"
                          : idx < batchStageIndex
                          ? "done"
                          : idx === batchStageIndex
                          ? "current"
                          : "pending";
                      return (
                        <li key={stage.label} className="flex items-start gap-3">
                          <span
                            className={`mt-1 h-2.5 w-2.5 rounded-full ${
                              status === "done"
                                ? "bg-green-500"
                                : status === "current"
                                ? "bg-purple-500"
                                : "bg-sage-300"
                            }`}
                          />
                          <div>
                            <div className="text-sm text-sage-700">
                              {stage.label}
                              {status === "current" ? " · 进行中" : status === "done" ? " · 完成" : ""}
                            </div>
                            <div className="text-xs text-sage-500">{stage.detail}</div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  {batchStageStatus && (
                    <div className="mt-2 text-xs text-sage-600">
                      当前菜谱状态：{batchStageStatus === "running" ? "生成中" : batchStageStatus === "success" ? "成功" : "失败"}
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-3" data-testid="batch-progress">
                {batchProgress.map((item) => (
                  <div
                    key={item.dishName}
                    className="flex items-center justify-between border border-sage-100 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {item.status === "generating" && (
                        <Loader2 className="w-4 h-4 animate-spin text-sage-500" />
                      )}
                      {item.status === "success" && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      {item.status === "failed" && (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      {item.status === "pending" && (
                        <span className="w-4 h-4 rounded-full border border-sage-300" />
                      )}
                      <span className="text-sm text-sage-700">{item.dishName}</span>
                  </div>
                    <div className="text-xs text-sage-500">
                      {item.status === "pending" && "等待中"}
                      {item.status === "generating" && "生成中"}
                      {item.status === "success" && (item.warning ? "成功（有警告）" : "成功")}
                      {item.status === "failed" && (item.error || "失败")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      )}

      {/* 结果显示 */}
      {result && (
        <div
          className={`mt-6 p-6 rounded-lg border-2 ${
            result.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            )}
            <div className="flex-1">
              <h3
                className={`font-medium mb-2 ${
                  result.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {result.success ? "✨ 生成成功！" : "❌ 生成失败"}
              </h3>
              <p
                className={`text-sm mb-4 ${
                  result.success ? "text-green-700" : "text-red-700"
                }`}
              >
                {result.message || result.error}
              </p>
              {result.warning && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-amber-800">
                    ⚠️ {result.warning}
                  </p>
                </div>
              )}

              {/* 单个生成结果 */}
              {result.recipe && (
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-sage-800 mb-2">
                    菜谱信息：
                  </p>
                  <p className="text-sm text-sage-600">
                    标题：{result.recipe.titleZh}
                  </p>
                  <p className="text-sm text-sage-600 mb-2">ID：{result.recipe.id}</p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-yellow-800">
                      ⚠️ 菜谱已保存为<strong>待审核状态</strong>，需要审核后发布
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/recipes/${result.recipe.id}/edit`}
                      className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      📝 编辑并发布
                    </Link>
                    <Link
                      href={`/recipe/${result.recipe.id}`}
                      className="inline-block px-4 py-2 bg-sage-100 hover:bg-sage-200 text-sage-700 text-sm rounded-lg transition-colors"
                    >
                      👁️ 预览
                    </Link>
                  </div>
                </div>
              )}

              {/* 批量生成结果 */}
              {result.stats && (
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-sage-800 mb-3">
                    批量生成统计：
                  </p>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-sage-500">总数</p>
                      <p className="text-2xl font-bold text-sage-800">
                        {result.stats.total}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-sage-500">成功</p>
                      <p className="text-2xl font-bold text-green-600">
                        {result.stats.generated}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-sage-500">失败</p>
                      <p className="text-2xl font-bold text-red-600">
                        {result.stats.failed}
                      </p>
                    </div>
                  </div>

                  {/* 失败的菜名 */}
                  {result.stats.failedDishes &&
                    result.stats.failedDishes.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-sage-200">
                        <p className="text-sm font-medium text-red-700 mb-2">
                          失败的菜谱：
                        </p>
                        <ul className="text-sm text-red-600 space-y-1">
                          {result.stats.failedDishes.map(
                            (item: any, index: number) => (
                              <li key={index}>
                                {item.dishName}: {item.error}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  <Link
                    href="/admin/recipes"
                    className="inline-block mt-4 px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white text-sm rounded-lg transition-colors"
                  >
                    查看所有菜谱 →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 使用提示 */}
      <div className="mt-8 p-6 bg-sage-50 rounded-lg border border-sage-200">
        <h3 className="font-medium text-sage-800 mb-3">💡 使用提示</h3>
        <ul className="text-sm text-sage-600 space-y-2">
          <li>• 单个生成适合快速创建单个菜谱，3-5秒完成</li>
          <li>• 批量生成适合快速扩充菜谱库，每个菜谱约4-6秒</li>
          <li>• 生成的菜谱会自动保存到数据库，标记为&quot;未发布&quot;状态</li>
          <li>
            • 生成的菜谱符合PRD v1.1.0格式，包含完整的食材、步骤、配图方案等
          </li>
          <li>• 建议先审核生成的菜谱，确认无误后再发布</li>
        </ul>
      </div>
    </div>
  );
}
