"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Save,
  Sparkles,
  Image as ImageIcon,
  Settings,
  MessageSquare,
  RotateCcw,
  Check,
  X,
  Edit3,
  AlertCircle,
} from "lucide-react";

interface AIConfig {
  id: string;
  textProvider: string | null;
  textApiKey: string | null;
  textBaseUrl: string | null;
  textModel: string | null;
  imageProvider: string | null;
  imageApiKey: string | null;
  imageBaseUrl: string | null;
  imageModel: string | null;
  imageNegativePrompt: string | null;
  recipePrompt: string | null;
  recipeSystemPrompt: string | null;
  seoPrompt: string | null;
}

interface PromptConfig {
  key: string;
  name: string;
  description: string | null;
  category: string;
  prompt: string;
  systemPrompt: string | null;
  variables: string[];
  isCustomized: boolean;
  defaultPrompt?: string;
  defaultSystemPrompt?: string;
}

const DEFAULT_CONFIG: AIConfig = {
  id: "default",
  textProvider: "glm",
  textApiKey: "",
  textBaseUrl: "",
  textModel: "",
  imageProvider: "evolink",
  imageApiKey: "",
  imageBaseUrl: "",
  imageModel: "",
  imageNegativePrompt: "",
  recipePrompt: "",
  recipeSystemPrompt: "",
  seoPrompt: "",
};

// Tab 类型
type TabType = "config" | "prompts";

const MODULE_LABELS: Record<string, string> = {
  home: "首页",
  collection: "聚合页",
  recipe_page: "/recipe 页面",
  recipe_detail: "菜谱详情",
  custom_recipes: "定制菜谱",
  translation: "翻译",
  generation: "菜谱生成",
  other: "其他",
};

const MODULE_ORDER = [
  "home",
  "collection",
  "recipe_page",
  "recipe_detail",
  "custom_recipes",
  "translation",
  "generation",
  "other",
];

const PROMPT_MODULE_MAP: Record<string, string> = {
  translate_home_config: "home",
  seo_generate: "collection",
  dish_recommend: "collection",
  recipe_page_copy: "recipe_page",
  chef_chat: "recipe_detail",
  custom_recipe_suggest: "custom_recipes",
  translate_recipe: "translation",
  translate_recipe_full: "translation",
  translate_cuisine: "translation",
  translate_location: "translation",
  translate_tag: "translation",
  translate_collection: "translation",
  translate_ingredient: "translation",
  recipe_generate: "generation",
};

function groupPromptsByModule(items: PromptConfig[]) {
  const grouped: Record<string, PromptConfig[]> = {};
  items.forEach((prompt) => {
    const moduleKey = PROMPT_MODULE_MAP[prompt.key] || "other";
    if (!grouped[moduleKey]) {
      grouped[moduleKey] = [];
    }
    grouped[moduleKey].push(prompt);
  });
  return grouped;
}

export default function AIConfigPage() {
  const [activeTab, setActiveTab] = useState<TabType>("config");
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 提示词管理状态
  const [prompts, setPrompts] = useState<PromptConfig[]>([]);
  const [groupedPrompts, setGroupedPrompts] = useState<Record<string, PromptConfig[]>>({});
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activePromptKey, setActivePromptKey] = useState<string>("");
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ prompt: string; systemPrompt: string }>({
    prompt: "",
    systemPrompt: "",
  });
  const [promptTabs, setPromptTabs] = useState<Record<string, "system" | "user">>({});
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [resettingPrompt, setResettingPrompt] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  // 当切换到提示词Tab时加载提示词
  useEffect(() => {
    if (activeTab === "prompts" && prompts.length === 0) {
      loadPrompts();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!activeCategory) return;
    const firstPrompt = groupedPrompts[activeCategory]?.[0];
    if (firstPrompt) {
      setActivePromptKey(firstPrompt.key);
    }
  }, [activeCategory, groupedPrompts]);

  async function loadPrompts() {
    setPromptsLoading(true);
    try {
      const res = await fetch("/api/admin/config/ai/prompts");
      const data = await res.json();
      if (data.success && data.data) {
        setPrompts(data.data.prompts);
        const grouped = groupPromptsByModule(data.data.prompts);
        setGroupedPrompts(grouped);
        const firstModule = MODULE_ORDER.find((key) => grouped[key]?.length) || Object.keys(grouped)[0];
        if (firstModule) {
          setActiveCategory(firstModule);
          const firstPrompt = grouped[firstModule]?.[0];
          if (firstPrompt) {
            setActivePromptKey(firstPrompt.key);
          }
        }
      }
    } catch (error) {
      console.error("加载提示词失败:", error);
      alert("加载提示词失败");
    } finally {
      setPromptsLoading(false);
    }
  }

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/config/ai");
      const data = await res.json();
      if (data.success && data.data) {
        setConfig({
          ...DEFAULT_CONFIG,
          ...data.data,
        });
      }
    } catch (error) {
      console.error("加载 AI 配置失败:", error);
      alert("加载 AI 配置失败");
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "保存失败");
      }
      alert("保存成功");
      setConfig({
        ...DEFAULT_CONFIG,
        ...data.data,
      });
    } catch (error) {
      console.error("保存 AI 配置失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  }

  // 开始编辑提示词
  async function startEditPrompt(promptKey: string) {
    try {
      const res = await fetch(`/api/admin/config/ai/prompts/${promptKey}`);
      const data = await res.json();
      if (data.success && data.data) {
        setEditForm({
          prompt: data.data.prompt,
          systemPrompt: data.data.systemPrompt || "",
        });
        setEditingPrompt(promptKey);
      }
    } catch (error) {
      console.error("获取提示词详情失败:", error);
      alert("获取提示词详情失败");
    }
  }

  // 取消编辑
  function cancelEdit() {
    setEditingPrompt(null);
    setEditForm({ prompt: "", systemPrompt: "" });
  }

  // 保存提示词
  async function savePrompt() {
    if (!editingPrompt) return;

    setSavingPrompt(true);
    try {
      const res = await fetch(`/api/admin/config/ai/prompts/${editingPrompt}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: editForm.prompt,
          systemPrompt: editForm.systemPrompt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "保存失败");
      }
      alert("保存成功");
      setEditingPrompt(null);
      setEditForm({ prompt: "", systemPrompt: "" });
      // 刷新提示词列表
      loadPrompts();
    } catch (error) {
      console.error("保存提示词失败:", error);
      alert(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSavingPrompt(false);
    }
  }

  // 重置提示词为默认值
  async function resetPrompt(promptKey: string) {
    if (!confirm("确定要重置为默认提示词吗？自定义内容将丢失。")) {
      return;
    }

    setResettingPrompt(promptKey);
    try {
      const res = await fetch(`/api/admin/config/ai/prompts/${promptKey}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "重置失败");
      }
      alert("已重置为默认值");
      // 刷新提示词列表
      loadPrompts();
    } catch (error) {
      console.error("重置提示词失败:", error);
      alert(error instanceof Error ? error.message : "重置失败");
    } finally {
      setResettingPrompt(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brownWarm" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-medium text-textDark mb-2">
            AI 配置管理
          </h1>
          <p className="text-textGray">
            统一管理模型配置与所有 AI 功能提示词
          </p>
        </div>
        {activeTab === "config" && (
          <button
            onClick={saveConfig}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brownWarm text-white text-sm hover:bg-brownWarm/90 disabled:opacity-70"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "保存中..." : "保存配置"}
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-lightGray">
        <button
          onClick={() => setActiveTab("config")}
          className={`px-5 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === "config"
              ? "text-brownWarm border-b-2 border-brownWarm"
              : "text-textGray hover:text-textDark"
          }`}
        >
          <Settings className="w-4 h-4" />
          模型配置
        </button>
        <button
          onClick={() => setActiveTab("prompts")}
          className={`px-5 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === "prompts"
              ? "text-brownWarm border-b-2 border-brownWarm"
              : "text-textGray hover:text-textDark"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          提示词管理
        </button>
      </div>

      {activeTab === "config" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
            <div className="flex items-center gap-2 text-lg font-medium text-textDark">
              <Sparkles className="w-5 h-5" />
              文本模型配置
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-textDark mb-2">Provider</label>
                <select
                  value={config.textProvider || ""}
                  onChange={(e) => setConfig({ ...config, textProvider: e.target.value })}
                  className="w-full px-4 py-2 border border-lightGray rounded-lg"
                >
                  <option value="glm">GLM</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-2">模型名称</label>
                <input
                  value={config.textModel || ""}
                  onChange={(e) => setConfig({ ...config, textModel: e.target.value })}
                  className="w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholder="glm-4-flash / gpt-4o-mini"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-2">API Base URL</label>
                <input
                  value={config.textBaseUrl || ""}
                  onChange={(e) => setConfig({ ...config, textBaseUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-2">API Key</label>
                <input
                  type="password"
                  value={config.textApiKey || ""}
                  onChange={(e) => setConfig({ ...config, textApiKey: e.target.value })}
                  className="w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholder="sk-***"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
            <div className="flex items-center gap-2 text-lg font-medium text-textDark">
              <ImageIcon className="w-5 h-5" />
              图片模型配置
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-textDark mb-2">Provider</label>
                <select
                  value={config.imageProvider || ""}
                  onChange={(e) => setConfig({ ...config, imageProvider: e.target.value })}
                  className="w-full px-4 py-2 border border-lightGray rounded-lg"
                >
                  <option value="evolink">Evolink</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-2">模型名称</label>
                <input
                  value={config.imageModel || ""}
                  onChange={(e) => setConfig({ ...config, imageModel: e.target.value })}
                  className="w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholder="z-image-turbo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-2">API Base URL</label>
                <input
                  value={config.imageBaseUrl || ""}
                  onChange={(e) => setConfig({ ...config, imageBaseUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-2">API Key</label>
                <input
                  type="password"
                  value={config.imageApiKey || ""}
                  onChange={(e) => setConfig({ ...config, imageApiKey: e.target.value })}
                  className="w-full px-4 py-2 border border-lightGray rounded-lg"
                  placeholder="sk-***"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-textDark mb-2">默认负面提示词</label>
              <textarea
                value={config.imageNegativePrompt || ""}
                onChange={(e) => setConfig({ ...config, imageNegativePrompt: e.target.value })}
                className="w-full px-4 py-2 border border-lightGray rounded-lg min-h-[120px]"
                placeholder="no text, no watermark..."
              />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <div>
              提示词已统一迁移到「提示词管理」中配置，模型配置只影响调用的 API 与模型。
            </div>
          </div>
        </div>
      )}

      {activeTab === "prompts" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-lightGray bg-white/80 p-4 text-sm text-textGray">
            <AlertCircle className="w-4 h-4 mt-0.5 text-brownWarm" />
            <div>
              所有 AI 功能都会读取此处的提示词。保存后立即生效，可按分类折叠管理。
            </div>
          </div>

          {promptsLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="w-6 h-6 animate-spin text-brownWarm" />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)] gap-6">
              {Object.keys(groupedPrompts).length === 0 && (
                <div className="text-sm text-textGray text-center py-12 col-span-full">
                  暂无提示词配置
                </div>
              )}

              {Object.keys(groupedPrompts).length > 0 && (
                <>
                  <div className="bg-white rounded-lg border border-lightGray p-3 h-fit">
                    <div className="text-xs font-medium text-textDark mb-2">模块导航</div>
                    <nav className="flex flex-col gap-1">
                  {MODULE_ORDER.filter((key) => groupedPrompts[key]?.length).map((category) => {
                    const items = groupedPrompts[category] || [];
                    const label = MODULE_LABELS[category] || category;
                    const isActive = activeCategory === category;
                    return (
                          <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                              isActive
                                ? "bg-cream text-brownWarm font-medium"
                                : "text-textGray hover:text-textDark hover:bg-cream/60"
                            }`}
                          >
                            {label}
                            <span className="text-xs text-textGray ml-2">({items.length})</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  <div className="space-y-4">
                    {activeCategory && groupedPrompts[activeCategory] && (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {groupedPrompts[activeCategory].map((prompt) => {
                            const isActive = activePromptKey === prompt.key;
                            return (
                              <button
                                key={prompt.key}
                                onClick={() => setActivePromptKey(prompt.key)}
                                className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                                  isActive
                                    ? "border-brownWarm text-brownWarm bg-cream"
                                    : "border-lightGray text-textGray hover:text-textDark"
                                }`}
                              >
                                {prompt.name}
                              </button>
                            );
                          })}
                        </div>

                        {(() => {
                          const prompt = groupedPrompts[activeCategory].find(
                            (item) => item.key === activePromptKey
                          );
                          if (!prompt) return null;
                          const isEditing = editingPrompt === prompt.key;
                          const activePromptTab = promptTabs[prompt.key] || "user";

                          return (
                            <div className="bg-white rounded-lg border border-lightGray p-4 space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="text-sm font-medium text-textDark">{prompt.name}</div>
                                  {prompt.description && (
                                    <div className="text-xs text-textGray mt-1">{prompt.description}</div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      prompt.isCustomized
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-cream text-textGray"
                                    }`}
                                  >
                                    {prompt.isCustomized ? "已自定义" : "默认"}
                                  </span>
                                  <button
                                    onClick={() => startEditPrompt(prompt.key)}
                                    className="inline-flex items-center gap-1 text-xs text-textGray hover:text-textDark"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    编辑
                                  </button>
                                  <button
                                    onClick={() => resetPrompt(prompt.key)}
                                    disabled={resettingPrompt === prompt.key}
                                    className="inline-flex items-center gap-1 text-xs text-textGray hover:text-textDark disabled:opacity-50"
                                  >
                                    {resettingPrompt === prompt.key ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    )}
                                    重置
                                  </button>
                                </div>
                              </div>

                              <div className="text-xs text-textGray">
                                变量：{prompt.variables?.length ? prompt.variables.map((v) => `{${v}}`).join("、") : "无"}
                              </div>

                              {!isEditing && (
                                <div className="space-y-3">
                                  <div className="flex gap-2 border-b border-lightGray">
                                    <button
                                      onClick={() =>
                                        setPromptTabs((prev) => ({ ...prev, [prompt.key]: "user" }))
                                      }
                                      className={`px-3 py-2 text-xs font-medium transition-colors ${
                                        activePromptTab === "user"
                                          ? "text-brownWarm border-b-2 border-brownWarm"
                                          : "text-textGray hover:text-textDark"
                                      }`}
                                    >
                                      用户提示词
                                    </button>
                                    <button
                                      onClick={() =>
                                        setPromptTabs((prev) => ({ ...prev, [prompt.key]: "system" }))
                                      }
                                      className={`px-3 py-2 text-xs font-medium transition-colors ${
                                        activePromptTab === "system"
                                          ? "text-brownWarm border-b-2 border-brownWarm"
                                          : "text-textGray hover:text-textDark"
                                      }`}
                                    >
                                      系统提示词
                                    </button>
                                  </div>
                                  {activePromptTab === "user" ? (
                                    <div className="w-full px-3 py-2 border border-lightGray rounded-lg min-h-[160px] text-sm font-mono bg-cream/30 whitespace-pre-wrap">
                                      {prompt.prompt}
                                    </div>
                                  ) : (
                                    <div className="w-full px-3 py-2 border border-lightGray rounded-lg min-h-[160px] text-sm bg-cream/30 whitespace-pre-wrap">
                                      {prompt.systemPrompt || "（无系统提示词）"}
                                    </div>
                                  )}
                                </div>
                              )}

                              {isEditing && (
                                <div className="space-y-3 rounded-lg border border-lightGray bg-cream/40 p-4">
                                  <div className="flex gap-2 border-b border-lightGray">
                                    <button
                                      onClick={() =>
                                        setPromptTabs((prev) => ({ ...prev, [prompt.key]: "user" }))
                                      }
                                      className={`px-3 py-2 text-xs font-medium transition-colors ${
                                        activePromptTab === "user"
                                          ? "text-brownWarm border-b-2 border-brownWarm"
                                          : "text-textGray hover:text-textDark"
                                      }`}
                                    >
                                      用户提示词
                                    </button>
                                    <button
                                      onClick={() =>
                                        setPromptTabs((prev) => ({ ...prev, [prompt.key]: "system" }))
                                      }
                                      className={`px-3 py-2 text-xs font-medium transition-colors ${
                                        activePromptTab === "system"
                                          ? "text-brownWarm border-b-2 border-brownWarm"
                                          : "text-textGray hover:text-textDark"
                                      }`}
                                    >
                                      系统提示词
                                    </button>
                                  </div>
                                  {activePromptTab === "user" ? (
                                    <div>
                                      <label className="block text-xs font-medium text-textDark mb-2">
                                        用户提示词
                                      </label>
                                      <textarea
                                        value={editForm.prompt}
                                        onChange={(e) =>
                                          setEditForm((prev) => ({ ...prev, prompt: e.target.value }))
                                        }
                                        className="w-full px-3 py-2 border border-lightGray rounded-lg min-h-[180px] text-sm font-mono"
                                        placeholder="请输入提示词内容"
                                      />
                                    </div>
                                  ) : (
                                    <div>
                                      <label className="block text-xs font-medium text-textDark mb-2">
                                        系统提示词（可选）
                                      </label>
                                      <textarea
                                        value={editForm.systemPrompt}
                                        onChange={(e) =>
                                          setEditForm((prev) => ({ ...prev, systemPrompt: e.target.value }))
                                        }
                                        className="w-full px-3 py-2 border border-lightGray rounded-lg min-h-[160px] text-sm"
                                        placeholder="系统角色、风格要求等"
                                      />
                                    </div>
                                  )}
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={cancelEdit}
                                      className="px-3 py-1.5 text-xs rounded-full border border-lightGray text-textGray hover:text-textDark"
                                    >
                                      <X className="w-3.5 h-3.5 inline-block mr-1" />
                                      取消
                                    </button>
                                    <button
                                      onClick={savePrompt}
                                      disabled={savingPrompt}
                                      className="px-3 py-1.5 text-xs rounded-full bg-brownWarm text-white hover:bg-brownWarm/90 disabled:opacity-60"
                                    >
                                      {savingPrompt ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin inline-block mr-1" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5 inline-block mr-1" />
                                      )}
                                      保存
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
