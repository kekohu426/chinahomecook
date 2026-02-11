"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Edit2,
  Trash2,
  MapPin,
  UtensilsCrossed,
  Loader2,
  Users,
} from "lucide-react";

interface Location {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface Cuisine {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<
    "locations" | "cuisines"
  >("locations");
  const [locations, setLocations] = useState<Location[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    slug: "",
    description: "",
    sortOrder: "0",
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    resetForm();
  }, [activeTab]);

  const resetForm = () => {
    setEditingId(null);
    setFormState({
      name: "",
      slug: "",
      description: "",
      sortOrder: "0",
      isActive: true,
    });
  };

  async function loadData() {
    try {
      const [locationsRes, cuisinesRes] = await Promise.all([
        fetch("/api/config/locations"),
        fetch("/api/config/cuisines"),
      ]);

      const [locationsData, cuisinesData] = await Promise.all([
        locationsRes.json(),
        cuisinesRes.json(),
      ]);

      if (locationsData.success) {
        setLocations(locationsData.data);
      }

      if (cuisinesData.success) {
        setCuisines(cuisinesData.data);
      }
    } catch (error) {
      console.error("加载配置失败:", error);
      alert("加载配置失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(type: "location" | "cuisine", id: string) {
    if (!confirm("确定要删除吗？")) return;

    try {
      const endpoint =
        type === "location"
          ? `/api/config/locations/${id}`
          : `/api/config/cuisines/${id}`;

      const res = await fetch(endpoint, { method: "DELETE" });

      if (!res.ok) {
        throw new Error("删除失败");
      }

      alert("删除成功");
      loadData();
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败");
    }
  }

  const handleEdit = (
    type: "location" | "cuisine",
    item: Location | Cuisine
  ) => {
    setActiveTab(type === "location" ? "locations" : "cuisines");
    setEditingId(item.id);
    setFormState({
      name: item.name,
      slug: item.slug,
      description: item.description || "",
      sortOrder: String(item.sortOrder ?? 0),
      isActive: item.isActive,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: formState.name.trim(),
      slug: formState.slug.trim(),
      description: formState.description.trim() || null,
      sortOrder: Number(formState.sortOrder) || 0,
      isActive: formState.isActive,
    };

    if (!payload.name || !payload.slug) {
      alert("名称和 slug 为必填项");
      setSaving(false);
      return;
    }

    try {
      const isLocation = activeTab === "locations";
      const base = isLocation ? "/api/config/locations" : "/api/config/cuisines";
      const endpoint = editingId ? `${base}/${editingId}` : base;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("保存失败");
      }

      alert(editingId ? "更新成功" : "新增成功");
      resetForm();
      loadData();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  async function handleToggleActive(
    type: "location" | "cuisine",
    id: string,
    currentStatus: boolean
  ) {
    try {
      const endpoint =
        type === "location"
          ? `/api/config/locations/${id}`
          : `/api/config/cuisines/${id}`;

      const item =
        type === "location"
          ? locations.find((l) => l.id === id)
          : cuisines.find((c) => c.id === id);

      if (!item) return;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, isActive: !currentStatus }),
      });

      if (!res.ok) {
        throw new Error("更新失败");
      }

      loadData();
    } catch (error) {
      console.error("更新失败:", error);
      alert("更新失败");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-sage-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-medium text-sage-800 mb-2">
            配置管理
          </h1>
          <p className="text-sage-500">管理地点和菜系配置</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/config/team"
            className="px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            团队成员管理
          </Link>
          <Link
            href="/admin/recipes"
            className="px-4 py-2 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-lg transition-colors"
          >
            返回食谱管理
          </Link>
        </div>
      </div>

      {/* 标签页 */}
      <div className="flex gap-2 mb-6 border-b border-sage-200">
        <button
          onClick={() => setActiveTab("locations")}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === "locations"
              ? "text-sage-700 border-b-2 border-sage-600"
              : "text-sage-500 hover:text-sage-700"
          }`}
        >
          <MapPin className="w-4 h-4 inline mr-2" />
          地点配置 ({locations.length})
        </button>
        <button
          onClick={() => setActiveTab("cuisines")}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === "cuisines"
              ? "text-sage-700 border-b-2 border-sage-600"
              : "text-sage-500 hover:text-sage-700"
          }`}
        >
          <UtensilsCrossed className="w-4 h-4 inline mr-2" />
          菜系配置 ({cuisines.length})
        </button>
      </div>

      {/* 新增/编辑表单 */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-sage-200 p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-sage-800">
              {activeTab === "locations" ? "地点" : "菜系"}
              {editingId ? "编辑" : "新增"}
            </h2>
            <p className="text-sm text-sage-500">
              {editingId ? "修改现有配置" : "新增一条配置"}
            </p>
          </div>
          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm text-sage-600 border border-sage-200 rounded-lg hover:border-sage-400"
              >
                取消编辑
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-sage-600 text-white rounded-lg hover:bg-sage-700 disabled:opacity-60"
            >
              {saving ? "保存中..." : editingId ? "保存更新" : "新增"}
            </button>
          </div>
        </div>

        {/* 地点/菜系表单 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="config-name" className="block text-sm text-sage-600 mb-2">
                名称
              </label>
              <input
                id="config-name"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className="w-full px-3 py-2 border border-sage-200 rounded-md"
                placeholder={activeTab === "locations" ? "例：川渝" : "例：川菜"}
              />
            </div>
            <div>
              <label htmlFor="config-slug" className="block text-sm text-sage-600 mb-2">
                Slug
              </label>
              <input
                id="config-slug"
                value={formState.slug}
                onChange={(e) => setFormState({ ...formState, slug: e.target.value })}
                className="w-full px-3 py-2 border border-sage-200 rounded-md"
                placeholder="例：chuanyu"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="config-description" className="block text-sm text-sage-600 mb-2">
                描述
              </label>
              <textarea
                id="config-description"
                value={formState.description}
                onChange={(e) =>
                  setFormState({ ...formState, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-sage-200 rounded-md"
                rows={2}
                placeholder="补充说明（可选）"
              />
            </div>
            <div>
              <label htmlFor="config-sort" className="block text-sm text-sage-600 mb-2">
                排序
              </label>
              <input
                id="config-sort"
                type="number"
                value={formState.sortOrder}
                onChange={(e) => setFormState({ ...formState, sortOrder: e.target.value })}
                className="w-full px-3 py-2 border border-sage-200 rounded-md"
              />
            </div>
            <div className="flex items-center gap-3 mt-7">
              <input
                id="config-active"
                type="checkbox"
                checked={formState.isActive}
                onChange={(e) =>
                  setFormState({ ...formState, isActive: e.target.checked })
                }
                className="w-4 h-4"
              />
              <label htmlFor="config-active" className="text-sm text-sage-600">
                启用该配置
              </label>
            </div>
          </div>
      </form>

      {/* 地点列表 */}
      {activeTab === "locations" && (
        <div>
          <div className="bg-white rounded-lg border border-sage-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-sage-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase">
                    名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase">
                    描述
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase">
                    排序
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase">
                    状态
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-sage-700 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {locations.map((location) => (
                  <tr key={location.id} className="hover:bg-sage-50">
                    <td className="px-6 py-4 text-sm font-medium text-sage-800">
                      📍 {location.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-sage-600">
                      {location.slug}
                    </td>
                    <td className="px-6 py-4 text-sm text-sage-600">
                      {location.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-sage-600">
                      {location.sortOrder}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          handleToggleActive("location", location.id, location.isActive)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          location.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {location.isActive ? "启用" : "禁用"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-3">
                        <button
                          onClick={() => handleEdit("location", location)}
                          className="text-sage-600 hover:text-sage-800"
                          aria-label={`编辑地点 ${location.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete("location", location.id)}
                          className="text-red-600 hover:text-red-800"
                          aria-label={`删除地点 ${location.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 菜系列表 */}
      {activeTab === "cuisines" && (
        <div>
          <div className="bg-white rounded-lg border border-sage-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-sage-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase">
                    名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase">
                    描述
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase">
                    排序
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase">
                    状态
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-sage-700 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {cuisines.map((cuisine) => (
                  <tr key={cuisine.id} className="hover:bg-sage-50">
                    <td className="px-6 py-4 text-sm font-medium text-sage-800">
                      🍜 {cuisine.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-sage-600">
                      {cuisine.slug}
                    </td>
                    <td className="px-6 py-4 text-sm text-sage-600">
                      {cuisine.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-sage-600">
                      {cuisine.sortOrder}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          handleToggleActive("cuisine", cuisine.id, cuisine.isActive)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          cuisine.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {cuisine.isActive ? "启用" : "禁用"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-3">
                        <button
                          onClick={() => handleEdit("cuisine", cuisine)}
                          className="text-sage-600 hover:text-sage-800"
                          aria-label={`编辑菜系 ${cuisine.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete("cuisine", cuisine.id)}
                          className="text-red-600 hover:text-red-800"
                          aria-label={`删除菜系 ${cuisine.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
