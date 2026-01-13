/**
 * SafeImage 组件
 *
 * 带有加载失败回退的图片组件
 * - 支持加载失败显示占位图
 * - 支持加载状态显示
 * - 支持图片代理配置
 */

"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/image-utils";
import { ImageIcon } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";

export interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackType?: "cover" | "step" | "ingredient";
  showLoadingState?: boolean;
  /** 是否使用懒加载，默认 false（为兼容 html2canvas 截图） */
  lazy?: boolean;
  /** 是否使用 fill 模式（绝对定位填充容器） */
  fill?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function SafeImage({
  src,
  alt,
  className,
  containerClassName,
  fallbackType = "cover",
  showLoadingState = true,
  lazy = false,
  fill = false,
  onLoad,
  onError,
}: SafeImageProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  // 处理图片URL
  const imageUrl = getImageUrl(src);

  const handleLoad = useCallback(() => {
    setStatus("loaded");
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setStatus("error");
    onError?.();
  }, [onError]);

  // 无图片URL
  if (!imageUrl) {
    return (
      <PlaceholderImage
        type={fallbackType}
        alt={alt}
        className={className}
        containerClassName={containerClassName}
      />
    );
  }

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* 加载中状态 */}
      {showLoadingState && status === "loading" && (
        <div className="absolute inset-0 bg-stone-100 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 加载失败状态 */}
      {status === "error" && (
        <PlaceholderImage
          type={fallbackType}
          alt={alt}
          className={className}
          containerClassName="absolute inset-0"
        />
      )}

      {/* 实际图片 */}
      <img
        src={imageUrl}
        alt={alt}
        className={cn(
          className,
          fill && "absolute inset-0 w-full h-full",
          status === "error" && "opacity-0"
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading={lazy ? "lazy" : "eager"}
      />
    </div>
  );
}

/**
 * 占位图组件
 */
interface PlaceholderImageProps {
  type: "cover" | "step" | "ingredient";
  alt: string;
  className?: string;
  containerClassName?: string;
}

function PlaceholderImage({
  type,
  alt,
  className,
  containerClassName,
}: PlaceholderImageProps) {
  const locale = useLocale();
  const isEn = locale === "en";
  const bgColors: Record<string, string> = {
    cover: "from-amber-100 via-orange-50 to-amber-100",
    step: "from-stone-100 via-stone-50 to-stone-100",
    ingredient: "from-sage-100 via-sage-50 to-sage-100",
  };

  const icons: Record<string, React.ReactNode> = {
    cover: (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-200/50 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-amber-600/60" />
        </div>
        <p className="text-amber-700/60 text-sm">
          {isEn ? "Loading image..." : "图片加载中..."}
        </p>
      </div>
    ),
    step: (
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-stone-200/50 flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-stone-500/60" />
        </div>
        <p className="text-stone-500/60 text-xs">
          {isEn ? "Step image" : "步骤配图"}
        </p>
      </div>
    ),
    ingredient: (
      <div className="w-full h-full flex items-center justify-center">
        <ImageIcon className="w-5 h-5 text-sage-400/60" />
      </div>
    ),
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br",
        bgColors[type],
        containerClassName
      )}
    >
      <div className={cn("flex items-center justify-center", className)}>
        {icons[type]}
      </div>
    </div>
  );
}

/**
 * 封面图专用组件
 */
interface CoverImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

export function CoverImage({ src, alt, className }: CoverImageProps) {
  return (
    <SafeImage
      src={src}
      alt={alt}
      className={cn("w-full h-full object-cover", className)}
      containerClassName="w-full h-full"
      fallbackType="cover"
    />
  );
}

/**
 * 步骤图专用组件
 */
interface StepImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

export function StepImage({ src, alt, className }: StepImageProps) {
  return (
    <SafeImage
      src={src}
      alt={alt}
      className={cn("w-full h-full object-cover", className)}
      containerClassName="w-full h-full"
      fallbackType="step"
    />
  );
}
