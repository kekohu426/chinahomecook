/**
 * ImageUploader 组件
 *
 * 图片上传组件，支持拖拽上传和预览
 * 用于后台管理界面
 */

"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  category?: string;
  onUploadSuccess?: (url: string) => void;
  className?: string;
}

export function ImageUploader({
  category = "general",
  onUploadSuccess,
  className,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // 处理文件上传
  const handleUpload = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      // 创建表单数据
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      // 发送上传请求
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "上传失败");
      }

      const data = await response.json();

      // 设置预览
      setPreview(data.url);

      // 调用成功回调
      onUploadSuccess?.(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  };

  // 文件选择处理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  // 拖拽处理
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleUpload(file);
    } else {
      setError("请上传图片文件");
    }
  }, []);

  return (
    <div className={cn("w-full", className)}>
      {/* 上传区域 */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-md p-8 text-center transition-colors",
          dragActive
            ? "border-brownWarm bg-brownWarm/5"
            : "border-gray-300 hover:border-brownWarm/50",
          preview && "border-solid border-gray-200"
        )}
      >
        {preview ? (
          // 预览区域
          <div className="space-y-4">
            <img
              src={preview}
              alt="上传预览"
              className="max-w-full max-h-64 mx-auto rounded-lg"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreview(null)}
            >
              重新上传
            </Button>
          </div>
        ) : (
          // 上传提示
          <div className="space-y-4">
            <div className="text-4xl">📸</div>
            <div>
              <p className="text-sm text-textDark font-medium mb-1">
                拖拽图片到这里，或点击上传
              </p>
              <p className="text-xs text-textGray">
                支持 JPG、PNG、WebP、GIF，最大 5MB
              </p>
            </div>

            <input
              type="file"
              id="file-upload"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />

            <Button
              asChild
              disabled={uploading}
              className="bg-brownWarm hover:bg-brownWarm/90"
            >
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploading ? "上传中..." : "选择图片"}
              </label>
            </Button>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-sm">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
