/**
 * 食材图标 Hook
 *
 * 用于在客户端获取和缓存食材图标库
 */

import { useState, useEffect } from "react";
import { IngredientIcon } from "@/lib/ingredient-icons";

interface UseIngredientIconsReturn {
  icons: IngredientIcon[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// 全局缓存，避免重复请求
let cachedIcons: IngredientIcon[] | null = null;
let cacheTime: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 分钟缓存

/**
 * 使用食材图标库
 *
 * 该 Hook 会自动获取所有启用的食材图标，并缓存结果
 */
export function useIngredientIcons(): UseIngredientIconsReturn {
  const [icons, setIcons] = useState<IngredientIcon[]>(cachedIcons || []);
  const [loading, setLoading] = useState(!cachedIcons);
  const [error, setError] = useState<Error | null>(null);

  const fetchIcons = async () => {
    // 检查缓存是否有效
    if (
      cachedIcons &&
      cacheTime &&
      Date.now() - cacheTime < CACHE_DURATION
    ) {
      setIcons(cachedIcons);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 获取所有图标（包括待补充的），匹配时会检查 iconUrl 是否存在
      const response = await fetch("/api/config/ingredient-icons");

      if (!response.ok) {
        // API 返回错误时，静默处理，使用空数组
        console.warn("获取食材图标失败，使用空数据:", response.status);
        cachedIcons = [];
        cacheTime = Date.now();
        setIcons([]);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        // 更新缓存
        cachedIcons = data.data;
        cacheTime = Date.now();
        setIcons(data.data);
      } else {
        // 数据格式不正确时，也静默处理
        console.warn("食材图标数据格式错误，使用空数据");
        cachedIcons = [];
        cacheTime = Date.now();
        setIcons([]);
      }
    } catch (err) {
      // 网络错误等异常情况，静默处理
      console.warn("获取食材图标异常:", err);
      setError(err instanceof Error ? err : new Error("未知错误"));
      // 使用空数组作为降级方案
      cachedIcons = [];
      cacheTime = Date.now();
      setIcons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIcons();
  }, []);

  return {
    icons,
    loading,
    error,
    refetch: fetchIcons,
  };
}
