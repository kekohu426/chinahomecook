"use client";

import { useState, useEffect } from "react";
import {
  Edit2,
  Trash2,
  Plus,
  Loader2,
  X,
  ChefHat,
  Utensils,
  Heart,
  Users,
  Calendar,
  BarChart3,
  Languages,
  Eye,
} from "lucide-react";

import { MapPin, Globe } from "lucide-react";

// 标签类型配置
const TAG_TYPES = {
  scene: {
    label: "场景",
    icon: ChefHat,
    apiPath: "scenes",
    description: "用餐场景，如早餐、午餐、下午茶等",
    isConfig: false,
  },
  method: {
    label: "烹饪方法",
    icon: Utensils,
    apiPath: "cooking-methods",
    description: "烹饪方式，如炒、煮、蒸、烤等",
    isConfig: false,
  },
  taste: {
    label: "口味",
    icon: Heart,
    apiPath: "tastes",
    description: "口味特征，如甜、咸、辣、麻辣等",
    isConfig: false,
  },
  crowd: {
    label: "适宜人群",
    icon: Users,
    apiPath: "crowds",
    description: "适合的人群，如儿童、老人、健身人群等",
    isConfig: false,
  },
  occasion: {
    label: "场合",
    icon: Calendar,
    apiPath: "occasions",
    description: "适合的场合，如春节、生日聚会、日常等",
    isConfig: false,
  },
  cuisine: {
    label: "菜系",
    icon: Globe,
    apiPath: "cuisines",
    description: "菜系分类，如川菜、粤菜、湘菜等",
    isConfig: true,
  },
  location: {
    label: "地点",
    icon: MapPin,
    apiPath: "locations",
    description: "地理位置，如四川、广东、湖南等",
    isConfig: true,
  },
} as const;

type TagType = keyof typeof TAG_TYPES;

interface TagItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  recipeCount?: number;
}

interface RecipePreview {
  id: string;
  titleZh: string;
  coverImage: string | null;
  viewCount: number;
}

export default function TagsConfigPage() {
  const [activeTab, setActiveTab] = useState<TagType>("scene");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [editingItem, setEditingItem] = useState<TagItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    sortOrder: "0",
    isActive: true,
  });
  const [stats, setStats] = useState<Record<TagType, number>>({
    scene: 0,
    method: 0,
    taste: 0,
    crowd: 0,
    occasion: 0,
    cuisine: 0,
    location: 0,
  });

  // 翻译相关状态
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [translatingItem, setTranslatingItem] = useState<TagItem | null>(null);
  const [translationLocale, setTranslationLocale] = useState("en");
  const [translationForm, setTranslationForm] = useState({ name: "", description: "" });
  const [translations, setTranslations] = useState<Array<{ locale: string; name: string; description: string | null }>>([]);
  const [loadingTranslations, setLoadingTranslations] = useState(false);
  const [savingTranslation, setSavingTranslation] = useState(false);

  // 查看菜谱相关状态
  const [viewingTag, setViewingTag] = useState<TagItem | null>(null);
  const [tagRecipes, setTagRecipes] = useState<RecipePreview[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  const LOCALES = [
    { code: "en", label: "English" },
    { code: "zh", label: "中文" },
    { code: "ja", label: "日本語" },
    { code: "ko", label: "한국어" },
  ];

  useEffect(() => {
    loadData();
    loadStats();
  }, [activeTab]);

  async function loadStats() {
    try {
      const res = await fetch("/api/admin/config/tags/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("加载统计失败:", error);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const config = TAG_TYPES[activeTab];
      // 菜系和地点使用不同的 API 路径
      const apiBase = config.isConfig ? "/api/config" : "/api/admin/config/tags";
      const res = await fetch(`${apiBase}/${config.apiPath}`);
      const data = await res.json();
      if (data.success) {
        setTags(data.data);
      }
    } catch (error) {
      console.error("加载失败:", error);
      alert("加载失败");
    } finally {
      setLoading(false);
    }
  }

  function openModal(item?: TagItem) {
    if (item) {
      setEditingItem(item);
      setForm({
        name: item.name,
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
      const config = TAG_TYPES[activeTab];
      const apiBase = config.isConfig ? "/api/config" : "/api/admin/config/tags";
      const endpoint = editingItem
        ? `${apiBase}/${config.apiPath}/${editingItem.id}`
        : `${apiBase}/${config.apiPath}`;
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

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "保存失败");
      }

      alert(editingItem ? "更新成功" : "创建成功");
      setShowModal(false);
      loadData();
      loadStats();
    } catch (error: any) {
      console.error("保存失败:", error);
      alert(error.message || "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("确定要删除这个标签吗？")) return;

    try {
      const config = TAG_TYPES[activeTab];
      const apiBase = config.isConfig ? "/api/config" : "/api/admin/config/tags";
      const res = await fetch(
        `${apiBase}/${config.apiPath}/${id}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("删除失败");
      alert("删除成功");
      loadData();
      loadStats();
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败");
    }
  }

  async function toggleActive(item: TagItem) {
    try {
      const config = TAG_TYPES[activeTab];
      const apiBase = config.isConfig ? "/api/config" : "/api/admin/config/tags";
      const res = await fetch(
        `${apiBase}/${config.apiPath}/${item.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !item.isActive }),
        }
      );

      if (!res.ok) throw new Error("更新失败");
      loadData();
    } catch (error) {
      console.error("更新失败:", error);
      alert("更新失败");
    }
  }

  async function openTranslateModal(item: TagItem) {
    setTranslatingItem(item);
    setTranslationLocale("en");
    setTranslationForm({ name: "", description: "" });
    setShowTranslateModal(true);
    await loadTranslations(item.id);
  }

  async function loadTranslations(id: string) {
    setLoadingTranslations(true);
    try {
      const config = TAG_TYPES[activeTab];
      const apiBase = config.isConfig ? "/api/config" : "/api/admin/config/tags";
      const res = await fetch(
        `${apiBase}/${config.apiPath}/${id}/translations`
      );
      const data = await res.json();
      if (data.success) {
        setTranslations(data.data);
        // 如果有英文翻译，自动加载
        const enTranslation = data.data.find((t: any) => t.locale === "en");
        if (enTranslation) {
          setTranslationForm({
            name: enTranslation.name,
            description: enTranslation.description || "",
          });
        }
      }
    } catch (error) {
      console.error("加载翻译失败:", error);
    } finally {
      setLoadingTranslations(false);
    }
  }

  function handleLocaleChange(locale: string) {
    setTranslationLocale(locale);
    const existing = translations.find((t) => t.locale === locale);
    if (existing) {
      setTranslationForm({
        name: existing.name,
        description: existing.description || "",
      });
    } else {
      setTranslationForm({ name: "", description: "" });
    }
  }

  async function saveTranslation() {
    if (!translatingItem || !translationForm.name) {
      alert("名称为必填项");
      return;
    }

    setSavingTranslation(true);
    try {
      const config = TAG_TYPES[activeTab];
      const apiBase = config.isConfig ? "/api/config" : "/api/admin/config/tags";
      const res = await fetch(
        `${apiBase}/${config.apiPath}/${translatingItem.id}/translations`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale: translationLocale,
            name: translationForm.name,
            description: translationForm.description || null,
          }),
        }
      );

      if (!res.ok) throw new Error("保存失败");
      alert("翻译已保存");
      await loadTranslations(translatingItem.id);
    } catch (error) {
      console.error("保存翻译失败:", error);
      alert("保存翻译失败");
    } finally {
      setSavingTranslation(false);
    }
  }

  async function deleteTranslation() {
    if (!translatingItem) return;
    if (!confirm(`确定要删除 ${translationLocale} 翻译吗？`)) return;

    try {
      const config = TAG_TYPES[activeTab];
      const apiBase = config.isConfig ? "/api/config" : "/api/admin/config/tags";
      const res = await fetch(
        `${apiBase}/${config.apiPath}/${translatingItem.id}/translations?locale=${translationLocale}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("删除失败");
      alert("翻译已删除");
      setTranslationForm({ name: "", description: "" });
      await loadTranslations(translatingItem.id);
    } catch (error) {
      console.error("删除翻译失败:", error);
      alert("删除翻译失败");
    }
  }

  // 查看标签下的菜谱
  async function viewRecipes(tag: TagItem) {
    setViewingTag(tag);
    setTagRecipes([]);
    setLoadingRecipes(true);

    try {
      // 将标签类型映射到 API 查询类型
      const typeMap: Record<TagType, string> = {
        scene: "scene",
        method: "method",
        taste: "taste",
        crowd: "crowd",
        occasion: "occasion",
        cuisine: "cuisine",
        location: "location",
      };
      const queryType = typeMap[activeTab] || "scene";

      // 使用 slug 来查询，因为 Recipe 模型存储的是 slug 数组
      const res = await fetch(
        `/api/admin/stats/recipes-by-category?type=${queryType}&value=${encodeURIComponent(tag.slug)}&limit=50`
      );
      const data = await res.json();
      if (data.success) {
        setTagRecipes(data.data);
      }
    } catch (error) {
      console.error("加载菜谱失败:", error);
    } finally {
      setLoadingRecipes(false);
    }
  }

  const TabIcon = TAG_TYPES[activeTab].icon;

  return (
    <div className="space-y-8">
      {/* 头部 */}
      <div>
        <h1 className="text-3xl font-serif font-medium text-textDark mb-2">
          标签管理
        </h1>
        <p className="text-textGray">管理食谱标签分类，用于聚合页和筛选</p>
      </div>

      {/* 标签类型切换 */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAG_TYPES) as TagType[]).map((type) => {
          const Icon = TAG_TYPES[type].icon;
          return (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === type
                  ? "bg-brownWarm text-white"
                  : "bg-cream text-textGray hover:text-textDark"
              }`}
            >
              <Icon className="w-4 h-4" />
              {TAG_TYPES[type].label}
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === type
                    ? "bg-white/20"
                    : "bg-lightGray"
                }`}
              >
                {stats[type]}
              </span>
            </button>
          );
        })}
      </div>

      {/* 当前类型描述 */}
      <div className="flex items-center justify-between bg-cream/50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <TabIcon className="w-6 h-6 text-brownWarm" />
          <div>
            <h2 className="font-medium text-textDark">
              {TAG_TYPES[activeTab].label}
            </h2>
            <p className="text-sm text-textGray">
              {TAG_TYPES[activeTab].description}
            </p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加{TAG_TYPES[activeTab].label}
        </button>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-brownWarm" />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-lightGray overflow-hidden">
          <table className="w-full">
            <thead className="bg-cream">
              <tr>
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
                  食谱数
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                  状态
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-textDark">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lightGray">
              {tags.map((item) => (
                <tr
                  key={item.id}
                  className={`group hover:bg-cream/50 ${
                    !item.isActive ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-textDark">{item.name}</div>
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
                      className="inline-flex items-center gap-1 text-sm text-textGray hover:text-brownWarm transition-colors"
                      title="点击查看菜谱"
                    >
                      <BarChart3 className="w-3 h-3" />
                      {item.recipeCount ?? 0}
                      <Eye className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" />
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
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openTranslateModal(item)}
                        className="p-2 text-textGray hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="翻译"
                      >
                        <Languages className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal(item)}
                        className="p-2 text-textGray hover:text-brownWarm hover:bg-cream rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-2 text-textGray hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tags.length === 0 && (
            <div className="text-center py-12 text-textGray">暂无数据</div>
          )}
        </div>
      )}

      {/* 编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-textDark">
                {editingItem ? "编辑" : "添加"}
                {TAG_TYPES[activeTab].label}
              </h2>
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
                  placeholder="如：早餐"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  Slug *
                </label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50 font-mono"
                  placeholder="如：breakfast"
                />
                <p className="text-xs text-textGray mt-1">
                  用于 URL 和筛选，只能包含小写字母、数字和连字符
                </p>
              </div>

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
                  placeholder="如：适合早晨食用的美味食谱"
                />
              </div>

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

      {/* 翻译弹窗 */}
      {showTranslateModal && translatingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-medium text-textDark flex items-center gap-2">
                  <Languages className="w-5 h-5" />
                  翻译管理
                </h2>
                <p className="text-sm text-textGray mt-1">
                  {TAG_TYPES[activeTab].label}: {translatingItem.name}
                </p>
              </div>
              <button
                onClick={() => setShowTranslateModal(false)}
                className="p-2 text-textGray hover:text-textDark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingTranslations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-brownWarm" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* 语言选择 */}
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    选择语言
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LOCALES.map((locale) => {
                      const hasTranslation = translations.some(
                        (t) => t.locale === locale.code
                      );
                      return (
                        <button
                          key={locale.code}
                          onClick={() => handleLocaleChange(locale.code)}
                          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                            translationLocale === locale.code
                              ? "bg-brownWarm text-white"
                              : hasTranslation
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-cream text-textGray hover:bg-lightGray"
                          }`}
                        >
                          {locale.label}
                          {hasTranslation && translationLocale !== locale.code && (
                            <span className="ml-1">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 翻译表单 */}
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    名称 ({LOCALES.find((l) => l.code === translationLocale)?.label}) *
                  </label>
                  <input
                    value={translationForm.name}
                    onChange={(e) =>
                      setTranslationForm({ ...translationForm, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder={`输入 ${LOCALES.find((l) => l.code === translationLocale)?.label} 名称`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    描述 ({LOCALES.find((l) => l.code === translationLocale)?.label})
                  </label>
                  <input
                    value={translationForm.description}
                    onChange={(e) =>
                      setTranslationForm({
                        ...translationForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder={`输入 ${LOCALES.find((l) => l.code === translationLocale)?.label} 描述`}
                  />
                </div>

                {/* 已有翻译列表 */}
                {translations.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-textDark mb-2">已有翻译</p>
                    <div className="space-y-2">
                      {translations.map((t) => (
                        <div
                          key={t.locale}
                          className="flex items-center justify-between p-2 bg-cream/50 rounded-lg"
                        >
                          <div>
                            <span className="text-xs font-medium text-textGray uppercase">
                              {t.locale}
                            </span>
                            <span className="ml-2 text-sm text-textDark">
                              {t.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between gap-3 mt-6">
              <button
                onClick={deleteTranslation}
                disabled={!translations.some((t) => t.locale === translationLocale)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                删除此翻译
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTranslateModal(false)}
                  className="px-4 py-2 text-textGray hover:text-textDark transition-colors"
                >
                  关闭
                </button>
                <button
                  onClick={saveTranslation}
                  disabled={savingTranslation || !translationForm.name}
                  className="px-6 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {savingTranslation && <Loader2 className="w-4 h-4 animate-spin" />}
                  保存翻译
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 查看菜谱弹窗 */}
      {viewingTag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-medium text-textDark">
                  {TAG_TYPES[activeTab].label}「{viewingTag.name}」的菜谱
                </h2>
                <p className="text-sm text-textGray mt-1">
                  共 {viewingTag.recipeCount ?? 0} 道菜谱
                </p>
              </div>
              <button
                onClick={() => setViewingTag(null)}
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
              ) : tagRecipes.length === 0 ? (
                <div className="text-center py-12 text-textGray">
                  暂无菜谱
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {tagRecipes.map((recipe) => (
                    <a
                      key={recipe.id}
                      href={`/admin/recipes/${recipe.id}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-cream/50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-[4/3] bg-lightGray relative">
                        {recipe.coverImage ? (
                          <img
                            src={recipe.coverImage}
                            alt={recipe.titleZh}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-textGray">
                            <ChefHat className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-textDark text-sm line-clamp-2 group-hover:text-brownWarm transition-colors">
                          {recipe.titleZh}
                        </h3>
                        <p className="text-xs text-textGray mt-1">
                          浏览: {recipe.viewCount}
                        </p>
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
