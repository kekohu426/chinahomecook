/**
 * 后台管理 - 食谱列表页
 *
 * 路由：/admin/recipes
 * 显示所有食谱，支持搜索、筛选、删除
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Recipe {
  id: string;
  titleZh: string;
  titleEn: string;
  isPublished: boolean;
  createdAt: string;
  story?: {
    tags?: string[];
  };
}

export default function RecipesListPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<string>("all");

  // 加载食谱列表
  const loadRecipes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (publishedFilter !== "all") {
        params.append("published", publishedFilter);
      }

      const response = await fetch(`/api/recipes?${params}`);
      const data = await response.json();

      if (data.success) {
        setRecipes(data.data);
      }
    } catch (error) {
      console.error("加载食谱失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 删除食谱
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定要删除《${title}》吗？`)) return;

    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadRecipes();
      } else {
        alert("删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败");
    }
  };

  // 发布/下架
  const handleTogglePublish = async (id: string, current: boolean) => {
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !current }),
      });

      if (!response.ok) {
        alert("更新状态失败");
        return;
      }

      loadRecipes();
    } catch (error) {
      console.error("更新发布状态失败:", error);
      alert("更新状态失败");
    }
  };

  useEffect(() => {
    loadRecipes();
  }, [search, publishedFilter]);

  return (
    <div>
      {/* 页头 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-serif font-medium text-textDark">
            食谱管理
          </h1>
          <Link href="/admin/recipes/new">
            <Button className="bg-brownWarm hover:bg-brownWarm/90">
              ➕ 创建新食谱
            </Button>
          </Link>
        </div>

        {/* 快捷导航 */}
        <div className="flex gap-3">
          <Link
            href="/admin/generate"
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm rounded-lg transition-all"
          >
            ✨ AI生成菜谱
          </Link>
          <Link
            href="/admin/config"
            className="px-4 py-2 bg-sage-100 hover:bg-sage-200 text-sage-700 text-sm rounded-lg transition-colors"
          >
            ⚙️ 配置管理
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-sage-100 hover:bg-sage-200 text-sage-700 text-sm rounded-lg transition-colors"
          >
            🏠 返回首页
          </Link>
        </div>
      </div>

      {/* 筛选工具栏 */}
      <div className="bg-white rounded-md shadow-card p-4 mb-6 flex gap-4">
        <Input
          placeholder="搜索食谱名称..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />

        <select
          value={publishedFilter}
          onChange={(e) => setPublishedFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-sm"
        >
          <option value="all">全部状态</option>
          <option value="true">已发布</option>
          <option value="false">草稿</option>
        </select>
      </div>

      {/* 食谱列表 */}
      {loading ? (
        <div className="text-center py-12 text-textGray">加载中...</div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 text-textGray">
          暂无食谱
          <Link
            href="/admin/recipes/new"
            className="block mt-4 text-brownWarm hover:underline"
          >
            创建第一个食谱
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-textDark">
                  食谱名称
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-textDark">
                  标签
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-textDark">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-textDark">
                  创建时间
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-textDark">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recipes.map((recipe) => (
                <tr key={recipe.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-textDark">
                        {recipe.titleZh}
                      </div>
                      <div className="text-sm text-textGray">
                        {recipe.titleEn}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {(recipe.story?.tags || []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-cream text-xs rounded-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {recipe.isPublished ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-sm">
                        已发布
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-sm">
                        草稿
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-textGray">
                    {new Date(recipe.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/recipe/${recipe.id}`}>
                        <Button variant="outline" size="sm">
                          查看
                        </Button>
                      </Link>
                      <Link href={`/admin/recipes/${recipe.id}/edit`}>
                        <Button variant="outline" size="sm">
                          编辑
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(recipe.id, recipe.titleZh)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        删除
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePublish(recipe.id, recipe.isPublished)}
                        className="text-brownWarm hover:text-brownWarm/90 hover:bg-cream"
                      >
                        {recipe.isPublished ? "下架" : "发布"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
