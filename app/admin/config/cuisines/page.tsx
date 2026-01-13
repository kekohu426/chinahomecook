"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Edit2,
  Trash2,
  Plus,
  Loader2,
  Save,
  X,
  Sparkles,
  Check,
  Eye,
  ChefHat,
} from "lucide-react";
import { DEFAULT_LOCALE, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";

interface CuisineItem {
  id: string;
  name: string;
  originalName: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  hasTranslation?: boolean;
  recipeCount?: number;
}

interface RecipePreview {
  id: string;
  titleZh: string;
  coverImage: string | null;
  viewCount: number;
}

export default function CuisinesConfigPage() {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cuisines, setCuisines] = useState<CuisineItem[]>([]);
  const [editingItem, setEditingItem] = useState<CuisineItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    sortOrder: "0",
    isActive: true,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [translating, setTranslating] = useState<string | null>(null);

  // 查看菜谱
  const [viewingCuisine, setViewingCuisine] = useState<CuisineItem | null>(null);
  const [cuisineRecipes, setCuisineRecipes] = useState<RecipePreview[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  useEffect(() => {
    loadData();
  }, [locale]);

  // 加载菜谱统计
  async function loadRecipeCounts(items: CuisineItem[]) {
    try {
      const res = await fetch("/api/admin/stats/recipe-counts?type=cuisine");
      const data = await res.json();
      if (data.success) {
        const counts = data.data as Record<string, number>;
        return items.map(item => ({
          ...item,
          recipeCount: counts[item.name] || counts[item.slug] || 0,
        }));
      }
    } catch (error) {
      console.error("加载菜谱统计失败:", error);
    }
    return items;
  }

  // 查看某菜系的菜谱
  async function viewRecipes(item: CuisineItem) {
    setViewingCuisine(item);
    setLoadingRecipes(true);
    try {
      const res = await fetch(`/api/admin/stats/recipes-by-category?type=cuisine&value=${encodeURIComponent(item.name)}`);
      const data = await res.json();
      if (data.success) {
        setCuisineRecipes(data.data);
      }
    } catch (error) {
      console.error("加载菜谱失败:", error);
    } finally {
      setLoadingRecipes(false);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/config/cuisines?locale=${locale}`);
      const data = await res.json();
      if (data.success) {
        // 检查翻译状态
        let items = await Promise.all(
          data.data.map(async (item: CuisineItem) => {
            if (locale !== DEFAULT_LOCALE) {
              const transRes = await fetch(
                `/api/config/cuisines/${item.id}/translations?locale=${locale}`
              );
              const transData = await transRes.json();
              return { ...item, hasTranslation: transData.success && transData.data };
            }
            return { ...item, hasTranslation: true };
          })
        );
        // 加载菜谱统计
        items = await loadRecipeCounts(items);
        setCuisines(items);
      }
    } catch (error) {
      console.error("加载失败:", error);
      alert("加载失败");
    } finally {
      setLoading(false);
    }
  }

  function openModal(item?: CuisineItem) {
    if (item) {
      setEditingItem(item);
      setForm({
        name: locale === DEFAULT_LOCALE ? item.originalName : item.name,
        slug: item.slug,
        description: item.description || "",
        sortOrder: String(item.sortOrder),
        isActive: item.isActive,
      });
    } else {
      setEditingItem(null);
      setForm({
        name: "",
        slug: "",
        description: "",
        sortOrder: "0",
        isActive: true,
      });
    }
    setShowModal(true);
  }

  async function saveItem() {
    if (!form.name || !form.slug) {
      alert("名称和 slug 为必填项");
      return;
    }

    setSaving(true);
    try {
      if (locale === DEFAULT_LOCALE) {
        // 保存主表
        const endpoint = editingItem
          ? `/api/config/cuisines/${editingItem.id}`
          : "/api/config/cuisines";
        const method = editingItem ? "PUT" : "POST";

        const res = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            slug: form.slug,
            description: form.description || null,
            sortOrder: Number(form.sortOrder) || 0,
            isActive: form.isActive,
          }),
        });

        if (!res.ok) throw new Error("保存失败");
      } else {
        // 保存翻译
        const res = await fetch(
          `/api/config/cuisines/${editingItem?.id}/translations`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              locale,
              name: form.name,
              description: form.description || null,
            }),
          }
        );

        if (!res.ok) throw new Error("保存翻译失败");
      }

      alert(editingItem ? "更新成功" : "创建成功");
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("确定要删除这个菜系吗？")) return;

    try {
      const res = await fetch(`/api/config/cuisines/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("删除失败");
      alert("删除成功");
      loadData();
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败");
    }
  }

  async function toggleActive(item: CuisineItem) {
    try {
      const res = await fetch(`/api/config/cuisines/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });

      if (!res.ok) throw new Error("更新失败");
      loadData();
    } catch (error) {
      console.error("更新失败:", error);
      alert("更新失败");
    }
  }

  async function translateItem(item: CuisineItem) {
    if (locale === DEFAULT_LOCALE) {
      alert("默认语言无需翻译");
      return;
    }

    setTranslating(item.id);
    try {
      const res = await fetch(
        `/api/admin/config/cuisines/${item.id}/translate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetLocales: [locale],
          }),
        }
      );

      if (!res.ok) throw new Error("翻译失败");
      alert("翻译完成");
      loadData();
    } catch (error) {
      console.error("翻译失败:", error);
      alert("翻译失败");
    } finally {
      setTranslating(null);
    }
  }

  async function translateSelected() {
    if (selectedIds.size === 0) {
      alert("请先选择要翻译的项目");
      return;
    }

    if (locale === DEFAULT_LOCALE) {
      alert("请先切换到目标语言");
      return;
    }

    setSaving(true);
    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        await fetch(`/api/admin/config/cuisines/${id}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetLocales: [locale] }),
        });
      }
      alert(`已翻译 ${ids.length} 个项目`);
      setSelectedIds(new Set());
      loadData();
    } catch (error) {
      console.error("批量翻译失败:", error);
      alert("批量翻译失败");
    } finally {
      setSaving(false);
    }
  }

  function toggleSelect(id: string) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  }

  function selectAll() {
    if (selectedIds.size === cuisines.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cuisines.map((c) => c.id)));
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
      {/* 头部 */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-serif font-medium text-textDark mb-2">
            菜系管理
          </h1>
          <p className="text-textGray">管理菜系分类及多语言翻译</p>
        </div>

        {/* 语言切换 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-textGray">当前语言：</span>
          {Object.entries(LOCALE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setLocale(key as Locale)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                locale === key
                  ? "bg-brownWarm text-white"
                  : "bg-cream text-textGray hover:text-textDark"
              }`}
            >
              {label}
            </button>
          ))}
          {locale !== DEFAULT_LOCALE && (
            <span className="text-xs text-textGray ml-2">
              当前为翻译内容编辑
            </span>
          )}
        </div>
      </div>

      {/* 操作栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {locale !== DEFAULT_LOCALE && (
            <>
              <button
                onClick={selectAll}
                className="px-3 py-2 text-sm border border-lightGray rounded-lg hover:border-brownWarm transition-colors"
              >
                {selectedIds.size === cuisines.length ? "取消全选" : "全选"}
              </button>
              <button
                onClick={translateSelected}
                disabled={saving || selectedIds.size === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                批量翻译 ({selectedIds.size})
              </button>
            </>
          )}
        </div>

        {locale === DEFAULT_LOCALE && (
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加菜系
          </button>
        )}
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-lg border border-lightGray overflow-hidden">
        <table className="w-full">
          <thead className="bg-cream">
            <tr>
              {locale !== DEFAULT_LOCALE && (
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === cuisines.length}
                    onChange={selectAll}
                    className="w-4 h-4"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                名称
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                Slug
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                描述
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                排序
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                菜谱数
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                状态
              </th>
              {locale !== DEFAULT_LOCALE && (
                <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                  翻译
                </th>
              )}
              <th className="px-4 py-3 text-right text-sm font-medium text-textDark">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-lightGray">
            {cuisines.map((item) => (
              <tr
                key={item.id}
                className={`hover:bg-cream/50 ${
                  !item.isActive ? "opacity-50" : ""
                }`}
              >
                {locale !== DEFAULT_LOCALE && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="w-4 h-4"
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="font-medium text-textDark">{item.name}</div>
                  {locale !== DEFAULT_LOCALE && item.name !== item.originalName && (
                    <div className="text-xs text-textGray">
                      原文: {item.originalName}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-textGray font-mono">
                  {item.slug}
                </td>
                <td className="px-4 py-3 text-sm text-textGray max-w-xs truncate">
                  {item.description || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-textGray">
                  {item.sortOrder}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => viewRecipes(item)}
                    className="inline-flex items-center gap-1 text-sm text-brownWarm hover:underline"
                  >
                    <ChefHat className="w-4 h-4" />
                    {item.recipeCount ?? 0} 道
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(item)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.isActive ? "启用" : "禁用"}
                  </button>
                </td>
                {locale !== DEFAULT_LOCALE && (
                  <td className="px-4 py-3">
                    {item.hasTranslation ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                        <Check className="w-3 h-3" />
                        已翻译
                      </span>
                    ) : (
                      <span className="text-orange-500 text-xs">未翻译</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {locale !== DEFAULT_LOCALE && !item.hasTranslation && (
                      <button
                        onClick={() => translateItem(item)}
                        disabled={translating === item.id}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="AI 翻译"
                      >
                        {translating === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => openModal(item)}
                      className="p-2 text-textGray hover:text-brownWarm hover:bg-cream rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {locale === DEFAULT_LOCALE && (
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-2 text-textGray hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {cuisines.length === 0 && (
          <div className="text-center py-12 text-textGray">
            暂无数据
          </div>
        )}
      </div>

      {/* 编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-medium text-textDark">
                  {editingItem ? "编辑菜系" : "添加菜系"}
                </h2>
                {locale !== DEFAULT_LOCALE && (
                  <p className="text-xs text-textGray mt-1">
                    当前编辑语言：{LOCALE_LABELS[locale]}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-textGray hover:text-textDark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  名称 *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  placeholder="如：川菜"
                />
              </div>

              {locale === DEFAULT_LOCALE && (
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    Slug *
                  </label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50 font-mono"
                    placeholder="如：chuan"
                  />
                  <p className="text-xs text-textGray mt-1">
                    用于 URL 参数，只能包含小写字母和数字
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  描述
                </label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  placeholder="如：麻辣鲜香，百菜百味"
                />
              </div>

              {locale === DEFAULT_LOCALE && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">
                      排序
                    </label>
                    <input
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) =>
                        setForm({ ...form, sortOrder: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-7">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm({ ...form, isActive: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <label htmlFor="isActive" className="text-sm text-textDark">
                      启用
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-textGray hover:text-textDark transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveItem}
                disabled={saving}
                className="px-6 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingItem ? "保存" : "创建"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 查看菜谱弹窗 */}
      {viewingCuisine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-lightGray">
              <div>
                <h2 className="text-xl font-medium text-textDark">
                  {viewingCuisine.name} 的菜谱
                </h2>
                <p className="text-sm text-textGray mt-1">
                  共 {cuisineRecipes.length} 道菜谱
                </p>
              </div>
              <button
                onClick={() => {
                  setViewingCuisine(null);
                  setCuisineRecipes([]);
                }}
                className="p-2 text-textGray hover:text-textDark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingRecipes ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-brownWarm" />
                </div>
              ) : cuisineRecipes.length === 0 ? (
                <div className="text-center py-12 text-textGray">
                  暂无菜谱
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {cuisineRecipes.map((recipe) => (
                    <a
                      key={recipe.id}
                      href={`/admin/recipes/${recipe.id}/edit`}
                      className="block group"
                    >
                      <div className="aspect-[4/3] rounded-lg bg-gray-100 overflow-hidden mb-2">
                        {recipe.coverImage && (
                          <Image
                            src={recipe.coverImage}
                            alt={recipe.titleZh}
                            width={200}
                            height={150}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            unoptimized
                          />
                        )}
                      </div>
                      <div className="text-sm font-medium text-textDark line-clamp-2 group-hover:text-brownWarm">
                        {recipe.titleZh}
                      </div>
                      <div className="text-xs text-textGray mt-1">
                        {recipe.viewCount} 次浏览
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
