"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FixTagsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFix = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/recipes/fix-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ limit: 10 }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>修复菜谱标签</CardTitle>
          <CardDescription>
            为没有标签的菜谱自动生成标签（场景、烹饪方式、口味、人群、场合）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleFix} disabled={loading}>
            {loading ? "处理中..." : "修复标签（最多50个）"}
          </Button>

          {result && (
            <div className="mt-4 p-4 border rounded-lg">
              {result.success ? (
                <div className="space-y-2">
                  <p className="font-semibold text-green-600">{result.message}</p>
                  <p>处理数量: {result.processed}</p>
                  <p>成功: {result.successCount}</p>
                  <p>失败: {result.failCount}</p>

                  {result.results && result.results.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="font-semibold">详细结果:</p>
                      {result.results.map((item: any, index: number) => (
                        <div key={index} className="p-2 border rounded">
                          <p className="font-medium">{item.title}</p>
                          {item.success ? (
                            <div className="text-sm text-gray-600">
                              <p>✅ 成功</p>
                              {item.tags && (
                                <pre className="mt-1 text-xs">
                                  {JSON.stringify(item.tags, null, 2)}
                                </pre>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-red-600">❌ 失败: {item.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-red-600">错误: {result.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
