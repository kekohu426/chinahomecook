"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, MapPin, UtensilsCrossed, Loader2 } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"locations" | "cuisines">("locations");
  const [locations, setLocations] = useState<Location[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
        <Link
          href="/admin/recipes"
          className="px-4 py-2 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-lg transition-colors"
        >
          返回食谱管理
        </Link>
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
                      <button
                        onClick={() => handleDelete("location", location.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                      <button
                        onClick={() => handleDelete("cuisine", cuisine.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
