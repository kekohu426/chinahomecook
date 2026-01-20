/**
 * 一级聚合页配置
 *
 * 路由: /admin/featured
 * 功能:
 * - 二级聚合卡片管理（排序、显示/隐藏）
 * - /recipe 页面配置（列表排序、文案）
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import AggregationCollectionsManager from "@/components/admin/AggregationCollectionsManager";

interface FeaturedConfig {
  defaultSort?: "latest" | "popular";
  h1?: string;
  subtitle?: string;
  footerText?: string;
}

const FEATURED_KEYS = {
  RECIPE_PAGE: "recipePageConfig",
};

export default function FeaturedPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingCopy, setGeneratingCopy] = useState(false);

  // 配置数据
  const [configs, setConfigs] = useState<Record<string, FeaturedConfig>>({});

  // 加载配置
  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/featured");
      const data = await response.json();
      if (data.success) {
        setConfigs(data.data);
      }
    } catch (error) {
      console.error("加载配置失败:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  // 保存配置
  const saveConfig = async (key: string, value: FeaturedConfig) => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await response.json();
      if (data.success) {
        await loadConfigs();
        alert("保存成功");
      } else {
        alert(data.error || "保存失败");
      }
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const generateRecipePageCopy = async () => {
    const current = configs[FEATURED_KEYS.RECIPE_PAGE] || {};
    setGeneratingCopy(true);
    try {
      const response = await fetch("/api/admin/recipe-page/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          h1: current.h1 || "",
          subtitle: current.subtitle || "",
          footerText: current.footerText || "",
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message || data?.error || "生成失败");
      }
      setConfigs({
        ...configs,
        [FEATURED_KEYS.RECIPE_PAGE]: {
          ...current,
          h1: data.data.h1 || current.h1,
          subtitle: data.data.subtitle || current.subtitle,
          footerText: data.data.footerText || current.footerText,
        },
      });
    } catch (error) {
      console.error("生成文案失败:", error);
      alert(error instanceof Error ? error.message : "生成文案失败");
    } finally {
      setGeneratingCopy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brownWarm" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div>
        <h1 className="text-3xl font-serif font-medium text-textDark mb-2">
          一级聚合页配置
        </h1>
        <p className="text-textGray">管理 /recipe 页面的二级聚合卡片与页面配置</p>
      </div>

      {/* 二级聚合卡片管理 */}
      <div className="bg-white rounded-lg border border-lightGray p-6">
        <AggregationCollectionsManager
          title="二级聚合卡片管理"
          description="按类型分组展示所有二级聚合卡片，可拖拽排序并控制显示/隐藏"
        />
      </div>

      {/* /recipe 页面配置 */}
      <div className="space-y-6">
        <h2 className="text-xl font-medium text-textDark">/recipe 页面配置</h2>

        <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)] gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-lightGray p-4 sticky top-6">
              <div className="text-sm font-medium text-textDark">/recipe 配置步骤</div>
              <ol className="mt-3 space-y-2 text-sm text-textGray">
                <li>
                  <a href="#recipe-step-sort" className="hover:text-textDark">
                    1. 列表排序
                  </a>
                </li>
                <li>
                  <a href="#recipe-step-copy" className="hover:text-textDark">
                    2. 文案配置
                  </a>
                </li>
              </ol>
              <div className="mt-4 text-xs text-textGray">
                生效范围：/recipe 首页（无筛选时）
              </div>
              <Link
                href="/recipe"
                target="_blank"
                className="mt-2 inline-flex text-xs text-brownWarm hover:text-brownDark"
              >
                前台预览 →
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <section id="recipe-step-sort" className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-0.5 bg-cream text-brownWarm rounded-full text-xs font-medium">
                  步骤 1
                </span>
                <span className="font-medium text-textDark">列表排序</span>
                <span className="text-textGray">（默认排序，前台可切换）</span>
              </div>

              <div className="bg-white rounded-lg border border-lightGray p-6 space-y-4">
                <h3 className="text-lg font-medium text-textDark">列表默认排序</h3>
                <div>
                  <label className="block text-sm font-medium text-textDark mb-3">
                    食谱列表默认排序
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="defaultSort"
                        value="latest"
                        checked={(configs[FEATURED_KEYS.RECIPE_PAGE]?.defaultSort ?? "latest") === "latest"}
                        onChange={() =>
                          setConfigs({
                            ...configs,
                            [FEATURED_KEYS.RECIPE_PAGE]: {
                              ...configs[FEATURED_KEYS.RECIPE_PAGE],
                              defaultSort: "latest",
                            },
                          })
                        }
                        className="text-brownWarm focus:ring-brownWarm"
                      />
                      <span className="text-sm">最新发布</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="defaultSort"
                        value="popular"
                        checked={configs[FEATURED_KEYS.RECIPE_PAGE]?.defaultSort === "popular"}
                        onChange={() =>
                          setConfigs({
                            ...configs,
                            [FEATURED_KEYS.RECIPE_PAGE]: {
                              ...configs[FEATURED_KEYS.RECIPE_PAGE],
                              defaultSort: "popular",
                            },
                          })
                        }
                        className="text-brownWarm focus:ring-brownWarm"
                      />
                      <span className="text-sm">最热门</span>
                    </label>
                  </div>
                </div>
                <p className="text-xs text-textGray">
                  仅影响 /recipe 首页默认排序；用户在前台切换排序会覆盖此设置。
                </p>
              </div>
            </section>

            <section id="recipe-step-copy" className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-0.5 bg-cream text-brownWarm rounded-full text-xs font-medium">
                  步骤 2
                </span>
                <span className="font-medium text-textDark">文案配置</span>
                <span className="text-textGray">（影响 H1/副标题/底部文案）</span>
              </div>

              <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-textDark">页面文案</h3>
                  <button
                    type="button"
                    onClick={generateRecipePageCopy}
                    disabled={generatingCopy}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-full border border-brownWarm text-brownWarm hover:bg-brownWarm hover:text-white transition-colors disabled:opacity-60"
                  >
                    {generatingCopy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {generatingCopy ? "生成中..." : "AI 生成"}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    页面标题 (H1)
                  </label>
                  <input
                    type="text"
                    value={configs[FEATURED_KEYS.RECIPE_PAGE]?.h1 ?? "中国美食食谱大全"}
                    onChange={(e) =>
                      setConfigs({
                        ...configs,
                        [FEATURED_KEYS.RECIPE_PAGE]: {
                          ...configs[FEATURED_KEYS.RECIPE_PAGE],
                          h1: e.target.value,
                        },
                      })
                    }
                    placeholder="中国美食食谱大全"
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    副标题
                  </label>
                  <input
                    type="text"
                    value={configs[FEATURED_KEYS.RECIPE_PAGE]?.subtitle ?? ""}
                    onChange={(e) =>
                      setConfigs({
                        ...configs,
                        [FEATURED_KEYS.RECIPE_PAGE]: {
                          ...configs[FEATURED_KEYS.RECIPE_PAGE],
                          subtitle: e.target.value,
                        },
                      })
                    }
                    placeholder="系统整理中国各地家常菜做法，按菜系/场景快速找到适合做的菜。"
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    底部收口文案（SEO）
                  </label>
                  <textarea
                    value={configs[FEATURED_KEYS.RECIPE_PAGE]?.footerText ?? ""}
                    onChange={(e) =>
                      setConfigs({
                        ...configs,
                        [FEATURED_KEYS.RECIPE_PAGE]: {
                          ...configs[FEATURED_KEYS.RECIPE_PAGE],
                          footerText: e.target.value,
                        },
                      })
                    }
                    rows={4}
                    placeholder="这里收录了中国各地的家常菜谱，从川菜到粤菜，从快手菜到宴客菜，帮你解决「今天吃什么」的烦恼。每道食谱都经过专业团队审核，配有详细步骤和精美图片，让你轻松做出美味佳肴。"
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  />
                  <p className="text-xs text-textGray mt-1">建议 100-200 字，用于 SEO 语义闭环</p>
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <button
                onClick={() => saveConfig(FEATURED_KEYS.RECIPE_PAGE, configs[FEATURED_KEYS.RECIPE_PAGE] || {})}
                disabled={saving}
                className="px-6 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存配置
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
