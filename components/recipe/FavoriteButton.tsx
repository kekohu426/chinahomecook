"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n/translations";

interface FavoriteButtonProps {
  recipeId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function FavoriteButton({
  recipeId,
  className,
  size = "md",
  showText = true,
}: FavoriteButtonProps) {
  const { data: session, status } = useSession();
  const { t } = useTranslations();

  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // 检查是否已收藏
  useEffect(() => {
    async function checkFavorite() {
      if (status === "loading") return;
      if (!session?.user) {
        setIsChecking(false);
        return;
      }

      try {
        const res = await fetch(`/api/favorites?recipeId=${recipeId}`);
        const data = await res.json();
        if (data.success) {
          setIsFavorited(data.isFavorited);
        }
      } catch (error) {
        console.error("检查收藏状态失败:", error);
      } finally {
        setIsChecking(false);
      }
    }

    checkFavorite();
  }, [recipeId, session, status]);

  const handleToggleFavorite = async () => {
    // 未登录时提示登录，登录后返回当前页面
    if (!session?.user) {
      signIn("google", { callbackUrl: window.location.href });
      return;
    }

    setIsLoading(true);

    try {
      if (isFavorited) {
        // 取消收藏
        const res = await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId }),
        });
        const data = await res.json();
        if (data.success) {
          setIsFavorited(false);
        }
      } else {
        // 添加收藏
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId }),
        });
        const data = await res.json();
        if (data.success) {
          setIsFavorited(true);
        }
      }
    } catch (error) {
      console.error("收藏操作失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  if (isChecking && session?.user) {
    return (
      <button
        disabled
        className={cn(
          "flex items-center rounded-lg border border-lightGray",
          sizeClasses[size],
          className
        )}
      >
        <Loader2 className={cn(iconSizes[size], "animate-spin text-gray-400")} />
        {showText && <span className="text-gray-400">{t("status.loading")}</span>}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={cn(
        "flex items-center rounded-lg transition-all duration-200",
        sizeClasses[size],
        isFavorited
          ? "bg-brownWarm text-white hover:bg-brownWarm/90"
          : "border border-lightGray hover:bg-cream text-textDark",
        isLoading && "opacity-70 cursor-not-allowed",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className={cn(iconSizes[size], "animate-spin")} />
      ) : (
        <Heart className={cn(iconSizes[size], isFavorited && "fill-current")} />
      )}
      {showText && (
        <span>
          {isFavorited ? t("recipe.saved") : t("recipe.save")}
        </span>
      )}
    </button>
  );
}
