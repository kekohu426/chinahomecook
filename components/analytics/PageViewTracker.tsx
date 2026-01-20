"use client";

import { useEffect } from "react";

interface PageViewTrackerProps {
  collectionId: string;
}

export function PageViewTracker({ collectionId }: PageViewTrackerProps) {
  useEffect(() => {
    // 记录访问（异步，不阻塞页面）
    fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId }),
    }).catch((error) => {
      console.error("Failed to track pageview:", error);
    });
  }, [collectionId]);

  return null; // 不渲染任何内容
}
