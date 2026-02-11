/**
 * AI 图片生成组件
 *
 * 使用 Evolink API 生成食谱图片
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/utils";

interface ImageGeneratorProps {
  recipeName?: string;
  onImageGenerated?: (url: string) => void;
  className?: string;
}

export function ImageGenerator({
  recipeName = "",
  onImageGenerated,
  className,
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 生成图片
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("请输入提示词");
      return;
    }

    setError(null);
    setGenerating(true);

    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${recipeName} ${prompt}`.trim(),
          negativePrompt: "模糊，低质量，变形，文字，水印",
          width: 1024,
          height: 1024,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setImageUrl(data.imageUrl);
        onImageGenerated?.(data.imageUrl);
      } else {
        setError(getErrorMessage(data.error, "生成失败"));
      }
    } catch (err) {
      setError("生成失败，请稍后重试");
    } finally {
      setGenerating(false);
    }
  };

  // 快速提示词
  const quickPrompts = [
    "成品图，俯视角度，美食摄影，自然光",
    "制作过程，特写镜头，手部动作",
    "食材摆放，清新背景，产品摄影",
  ];

  return (
    <div className={className}>
      <div className="bg-white rounded-md shadow-card p-6">
        <h3 className="text-lg font-medium text-textDark mb-4">
          🎨 AI 图片生成
        </h3>

        {/* 提示词输入 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-textDark mb-2">
            图片描述提示词
          </label>
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例：成品图，俯视角度，美食摄影"
            disabled={generating}
          />
        </div>

        {/* 快速提示词 */}
        <div className="mb-4">
          <p className="text-sm text-textGray mb-2">快速选择：</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrompt(p)}
                className="px-3 py-1 text-sm bg-cream hover:bg-brownWarm/10 rounded-sm transition-colors"
                disabled={generating}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 生成按钮 */}
        <Button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          className="w-full bg-brownWarm hover:bg-brownWarm/90"
        >
          {generating ? "生成中..." : "🎨 生成图片"}
        </Button>

        {/* 错误提示 */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 预览图片 */}
        {imageUrl && (
          <div className="mt-4">
            <p className="text-sm font-medium text-textDark mb-2">生成结果：</p>
            <img
              src={imageUrl}
              alt="AI 生成"
              className="w-full rounded-md border border-gray-200"
            />
            <p className="text-xs text-textGray mt-2 break-all">
              URL: {imageUrl}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
