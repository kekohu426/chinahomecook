"use client";

import { useState, useRef, useCallback } from "react";
import { Image as ImageIcon, Link2, Bold, Italic, List, Loader2, Upload } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function MarkdownEditor({ value, onChange, placeholder, rows = 20 }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // 在光标位置插入文本
  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + text + value.substring(end);
    onChange(newValue);

    // 设置光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    }, 0);
  }, [value, onChange]);

  // 上传图片
  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "blog");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "上传失败");
      }

      const data = await res.json();
      return data.url;
    } catch (error) {
      console.error("Upload error:", error);
      alert("图片上传失败: " + (error as Error).message);
      return null;
    }
  };

  // 处理图片上传
  const handleImageUpload = async (files: FileList | File[]) => {
    setUploading(true);

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        alert("请选择图片文件");
        continue;
      }

      const url = await uploadImage(file);
      if (url) {
        const alt = file.name.replace(/\.[^/.]+$/, "");
        insertAtCursor(`\n![${alt}](${url})\n`);
      }
    }

    setUploading(false);
  };

  // 点击上传按钮
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageUpload(e.target.files);
      e.target.value = "";
    }
  };

  // 插入图片 URL
  const handleInsertImageUrl = () => {
    const url = prompt("请输入图片 URL:");
    if (url) {
      const alt = prompt("请输入图片描述 (可选):") || "image";
      insertAtCursor(`![${alt}](${url})`);
    }
  };

  // 粘贴处理
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageItems: File[] = [];

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          imageItems.push(file);
        }
      }
    }

    if (imageItems.length > 0) {
      e.preventDefault();
      await handleImageUpload(imageItems);
    }
  };

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    const imageFiles: File[] = [];

    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      await handleImageUpload(imageFiles);
    }
  };

  // 工具栏按钮
  const handleBold = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const newValue = value.substring(0, start) + `**${selected || "粗体文本"}**` + value.substring(end);
    onChange(newValue);
  };

  const handleItalic = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const newValue = value.substring(0, start) + `*${selected || "斜体文本"}*` + value.substring(end);
    onChange(newValue);
  };

  const handleLink = () => {
    const url = prompt("请输入链接 URL:");
    if (url) {
      const text = prompt("请输入链接文本:") || "链接";
      insertAtCursor(`[${text}](${url})`);
    }
  };

  const handleList = () => {
    insertAtCursor("\n- 列表项\n- 列表项\n- 列表项\n");
  };

  return (
    <div className="space-y-2">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <button
          type="button"
          onClick={handleBold}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          title="加粗"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleItalic}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          title="斜体"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleLink}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          title="插入链接"
        >
          <Link2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleList}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          title="插入列表"
        >
          <List className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploading}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded disabled:opacity-50"
          title="上传图片"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          上传图片
        </button>
        <button
          type="button"
          onClick={handleInsertImageUrl}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          title="插入图片URL"
        >
          <ImageIcon className="w-4 h-4" />
          图片URL
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* 编辑区 */}
      <div
        className={`relative ${dragOver ? "ring-2 ring-orange-500 ring-offset-2" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm"
        />

        {/* 拖拽提示 */}
        {dragOver && (
          <div className="absolute inset-0 bg-orange-50/90 flex items-center justify-center rounded-lg border-2 border-dashed border-orange-400">
            <div className="text-center">
              <Upload className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-orange-600 font-medium">释放以上传图片</p>
            </div>
          </div>
        )}

        {/* 上传中提示 */}
        {uploading && (
          <div className="absolute bottom-2 right-2 flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-lg border">
            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
            <span className="text-sm text-gray-600">上传中...</span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        支持拖拽或粘贴图片直接上传，也可以点击工具栏按钮插入
      </p>
    </div>
  );
}
