"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Sparkles, Image as ImageIcon, FileText } from "lucide-react";

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
  recipePromptTemplate: string | null;
  recipeSystemPrompt: string | null;
  chefSystemPrompt: string | null;
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
  recipePromptTemplate: "",
  recipeSystemPrompt: "",
  chefSystemPrompt: "",
};

export default function AIConfigPage() {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

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
            管理 AI 接口与系统提示词（仅配置，不会自动改业务逻辑）
          </p>
        </div>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brownWarm text-white text-sm hover:bg-brownWarm/90 disabled:opacity-70"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "保存中..." : "保存配置"}
        </button>
      </div>

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

      <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
        <div className="flex items-center gap-2 text-lg font-medium text-textDark">
          <FileText className="w-5 h-5" />
          系统提示词
        </div>

        <div>
          <label className="block text-sm font-medium text-textDark mb-2">菜谱生成提示词模板</label>
          <textarea
            value={config.recipePromptTemplate || ""}
            onChange={(e) => setConfig({ ...config, recipePromptTemplate: e.target.value })}
            className="w-full px-4 py-2 border border-lightGray rounded-lg min-h-[160px]"
            placeholder="输入提示词模板"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-textDark mb-2">菜谱生成系统提示词</label>
          <textarea
            value={config.recipeSystemPrompt || ""}
            onChange={(e) => setConfig({ ...config, recipeSystemPrompt: e.target.value })}
            className="w-full px-4 py-2 border border-lightGray rounded-lg min-h-[140px]"
            placeholder="输入系统提示词"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-textDark mb-2">AI 主厨系统提示词</label>
          <textarea
            value={config.chefSystemPrompt || ""}
            onChange={(e) => setConfig({ ...config, chefSystemPrompt: e.target.value })}
            className="w-full px-4 py-2 border border-lightGray rounded-lg min-h-[140px]"
            placeholder="输入系统提示词"
          />
        </div>
      </div>
    </div>
  );
}
