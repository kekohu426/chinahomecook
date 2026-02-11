"use client";

/**
 * 团队成员管理页面
 *
 * 管理探寻者、厨师、营养师等团队成员
 * 数据同时用于：关于我们页面展示 + 食谱内容归属
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Edit2,
  Trash2,
  Plus,
  Loader2,
  Users,
  ChefHat,
  Search,
  Camera,
  Heart,
  Crown,
  X,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface TeamMember {
  id: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  role: string;
  bioZh: string | null;
  bioEn: string | null;
  mottoZh: string | null;
  mottoEn: string | null;
  avatarUrl: string | null;
  specialtyCuisines: string[];
  specialtyRegions: string[];
  sortOrder: number;
  isActive: boolean;
  _count?: {
    exploredRecipes: number;
    reviewedRecipes: number;
  };
}

const ROLE_CONFIG: Record<
  string,
  { label: string; labelEn: string; icon: typeof Users; color: string }
> = {
  founder: {
    label: "创始人",
    labelEn: "Founder",
    icon: Crown,
    color: "bg-amber-100 text-amber-700",
  },
  explorer: {
    label: "美食探寻者",
    labelEn: "Food Explorer",
    icon: Search,
    color: "bg-blue-100 text-blue-700",
  },
  chef: {
    label: "专业厨师",
    labelEn: "Professional Chef",
    icon: ChefHat,
    color: "bg-orange-100 text-orange-700",
  },
  nutritionist: {
    label: "注册营养师",
    labelEn: "Registered Dietitian",
    icon: Heart,
    color: "bg-green-100 text-green-700",
  },
  photographer: {
    label: "美食摄影师",
    labelEn: "Food Photographer",
    icon: Camera,
    color: "bg-purple-100 text-purple-700",
  },
};

const TEAM_BANNER_DEFAULT_URL = "/team/team-banner.webp";
const TEAM_BANNER_DEFAULT = {
  titleZh: "团队展示图",
  contentZh: "用于食谱详情页作者信息下方展示",
};

const EMPTY_FORM = {
  slug: "",
  nameZh: "",
  nameEn: "",
  role: "explorer",
  bioZh: "",
  bioEn: "",
  mottoZh: "",
  mottoEn: "",
  avatarUrl: "",
  specialtyCuisines: "",
  specialtyRegions: "",
  sortOrder: "0",
  isActive: true,
};

export default function TeamConfigPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [bannerId, setBannerId] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState(TEAM_BANNER_DEFAULT_URL);
  const [bannerTitleZh, setBannerTitleZh] = useState(TEAM_BANNER_DEFAULT.titleZh);
  const [bannerContentZh, setBannerContentZh] = useState(TEAM_BANNER_DEFAULT.contentZh);
  const [bannerSaving, setBannerSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormState(EMPTY_FORM);
  };

  async function loadData() {
    try {
      const [teamRes, aboutRes] = await Promise.all([
        fetch("/api/config/team?activeOnly=false"),
        fetch("/api/config/about"),
      ]);

      const teamData = await teamRes.json();
      if (teamData.success) {
        setMembers(teamData.data);
      }

      if (aboutRes.ok) {
        const aboutData = await aboutRes.json();
        const bannerSection =
          (aboutData.data || []).find(
            (section: any) => section.type === "team_banner"
          ) || null;

        if (bannerSection) {
          setBannerId(bannerSection.id);
          setBannerUrl(bannerSection.imageUrl || TEAM_BANNER_DEFAULT_URL);
          setBannerTitleZh(
            bannerSection.titleZh || TEAM_BANNER_DEFAULT.titleZh
          );
          setBannerContentZh(
            bannerSection.contentZh || TEAM_BANNER_DEFAULT.contentZh
          );
        } else {
          setBannerId(null);
          setBannerUrl(TEAM_BANNER_DEFAULT_URL);
          setBannerTitleZh(TEAM_BANNER_DEFAULT.titleZh);
          setBannerContentZh(TEAM_BANNER_DEFAULT.contentZh);
        }
      }
    } catch (error) {
      console.error("加载团队成员失败:", error);
      alert("加载团队成员失败");
    } finally {
      setLoading(false);
    }
  }


  const handleSaveBanner = async () => {
    setBannerSaving(true);
    try {
      const payload = {
        titleZh: bannerTitleZh || TEAM_BANNER_DEFAULT.titleZh,
        contentZh: bannerContentZh || TEAM_BANNER_DEFAULT.contentZh,
        imageUrl: bannerUrl.trim() || null,
        type: "team_banner",
        sortOrder: 999,
        isActive: false,
      };

      const res = await fetch(
        bannerId ? `/api/config/about/${bannerId}` : "/api/config/about",
        {
          method: bannerId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "保存失败");
      }

      if (!bannerId && data.data?.id) {
        setBannerId(data.data.id);
      }

      alert("保存成功");
    } catch (error: any) {
      console.error("保存团队展示图失败:", error);
      alert(error.message || "保存失败");
    } finally {
      setBannerSaving(false);
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingId(member.id);
    setShowForm(true);
    setFormState({
      slug: member.slug,
      nameZh: member.nameZh,
      nameEn: member.nameEn,
      role: member.role,
      bioZh: member.bioZh || "",
      bioEn: member.bioEn || "",
      mottoZh: member.mottoZh || "",
      mottoEn: member.mottoEn || "",
      avatarUrl: member.avatarUrl || "",
      specialtyCuisines: member.specialtyCuisines.join(", "),
      specialtyRegions: member.specialtyRegions.join(", "),
      sortOrder: String(member.sortOrder),
      isActive: member.isActive,
    });
  };

  const handleDelete = async (e: React.MouseEvent, member: TeamMember) => {
    e.stopPropagation();

    const recipeCount =
      (member._count?.exploredRecipes || 0) +
      (member._count?.reviewedRecipes || 0);

    if (recipeCount > 0) {
      alert(`该成员已关联 ${recipeCount} 个食谱，请先解除关联后再删除`);
      return;
    }

    if (!window.confirm(`确定要删除 ${member.nameZh} 吗？`)) return;

    try {
      const res = await fetch(`/api/config/team/${member.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "删除失败");
      }

      alert("删除成功");
      loadData();
    } catch (error: any) {
      console.error("删除失败:", error);
      alert(error.message || "删除失败");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // 解析数组字段
    const specialtyCuisines = formState.specialtyCuisines
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const specialtyRegions = formState.specialtyRegions
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      slug: formState.slug.trim(),
      nameZh: formState.nameZh.trim(),
      nameEn: formState.nameEn.trim(),
      role: formState.role,
      bioZh: formState.bioZh.trim() || null,
      bioEn: formState.bioEn.trim() || null,
      mottoZh: formState.mottoZh.trim() || null,
      mottoEn: formState.mottoEn.trim() || null,
      avatarUrl: formState.avatarUrl.trim() || null,
      specialtyCuisines,
      specialtyRegions,
      sortOrder: Number(formState.sortOrder) || 0,
      isActive: formState.isActive,
    };

    if (!payload.slug || !payload.nameZh || !payload.nameEn) {
      alert("Slug、中文名和英文名为必填项");
      setSaving(false);
      return;
    }

    try {
      const endpoint = editingId
        ? `/api/config/team/${editingId}`
        : "/api/config/team";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "保存失败");
      }

      alert(editingId ? "更新成功" : "新增成功");
      resetForm();
      loadData();
    } catch (error: any) {
      console.error("保存失败:", error);
      alert(error.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (member: TeamMember) => {
    try {
      const res = await fetch(`/api/config/team/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !member.isActive }),
      });

      if (!res.ok) throw new Error("更新失败");
      loadData();
    } catch (error) {
      console.error("更新失败:", error);
      alert("更新失败");
    }
  };

  const handleMoveSort = async (member: TeamMember, direction: "up" | "down") => {
    const currentIndex = members.findIndex((m) => m.id === member.id);
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (swapIndex < 0 || swapIndex >= members.length) return;

    const otherMember = members[swapIndex];

    try {
      await Promise.all([
        fetch(`/api/config/team/${member.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: otherMember.sortOrder }),
        }),
        fetch(`/api/config/team/${otherMember.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: member.sortOrder }),
        }),
      ]);
      loadData();
    } catch (error) {
      console.error("排序失败:", error);
      alert("排序失败");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-sage-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-medium text-sage-800 mb-2">
            团队成员管理
          </h1>
          <p className="text-sage-500">
            管理团队成员信息，用于关于我们页面和食谱内容归属
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/zh/about#team"
            target="_blank"
            className="px-4 py-2 border border-sage-300 text-sage-700 rounded-lg hover:bg-sage-50 transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            预览团队页
          </Link>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
              setFormState((prev) => ({
                ...prev,
                sortOrder: String(members.length),
              }));
            }}
            className="px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新增成员
          </button>
        </div>
      </div>

      {/* 团队展示图配置 */}
      <div className="bg-white rounded-lg border border-sage-200 p-6 mb-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-sage-800">团队展示图</h2>
            <p className="text-sm text-sage-500">
              用于食谱详情页作者信息下方展示
            </p>
          </div>
          <button
            onClick={handleSaveBanner}
            disabled={bannerSaving}
            className="px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {bannerSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              "保存展示图"
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-sage-600 mb-2">
              图片 URL
            </label>
            <input
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="w-full px-3 py-2 border border-sage-200 rounded-md"
              placeholder="https://.../team-banner.png"
            />
            <p className="text-xs text-sage-400 mt-2">
              建议使用横版大图（例如 16:9 或 3:2）
            </p>
          </div>
          <div>
            <div className="text-sm text-sage-600 mb-2">预览</div>
            {bannerUrl ? (
              <div className="rounded-lg overflow-hidden border border-sage-200">
                <img
                  src={bannerUrl}
                  alt="团队展示图"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-40 rounded-lg border border-dashed border-sage-200 flex items-center justify-center text-sage-400 text-sm">
                暂无图片
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {Object.entries(ROLE_CONFIG).map(([role, config]) => {
          const count = members.filter(
            (m) => m.role === role && m.isActive
          ).length;
          const IconComponent = config.icon;
          return (
            <div
              key={role}
              className="bg-white rounded-lg border border-sage-200 p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-medium text-sage-800">
                    {count}
                  </div>
                  <div className="text-xs text-sage-500">{config.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 新增/编辑表单 */}
      {showForm && (
        <div className="bg-white rounded-lg border border-sage-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-sage-800">
              {editingId ? "编辑成员" : "新增成员"}
            </h2>
            <button
              onClick={resetForm}
              className="text-sage-500 hover:text-sage-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-sage-600 mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  value={formState.slug}
                  onChange={(e) =>
                    setFormState({ ...formState, slug: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-sage-200 rounded-md"
                  placeholder="例：wei-li"
                />
              </div>
              <div>
                <label className="block text-sm text-sage-600 mb-2">
                  中文名 <span className="text-red-500">*</span>
                </label>
                <input
                  value={formState.nameZh}
                  onChange={(e) =>
                    setFormState({ ...formState, nameZh: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-sage-200 rounded-md"
                  placeholder="例：李未"
                />
              </div>
              <div>
                <label className="block text-sm text-sage-600 mb-2">
                  英文名 <span className="text-red-500">*</span>
                </label>
                <input
                  value={formState.nameEn}
                  onChange={(e) =>
                    setFormState({ ...formState, nameEn: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-sage-200 rounded-md"
                  placeholder="例：Wei Li"
                />
              </div>
            </div>

            {/* 角色和头像 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-sage-600 mb-2">角色</label>
                <select
                  value={formState.role}
                  onChange={(e) =>
                    setFormState({ ...formState, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-sage-200 rounded-md"
                >
                  {Object.entries(ROLE_CONFIG).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label} ({config.labelEn})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-sage-600 mb-2">
                  头像 URL
                </label>
                <input
                  value={formState.avatarUrl}
                  onChange={(e) =>
                    setFormState({ ...formState, avatarUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-sage-200 rounded-md"
                  placeholder="/about/member_xx.png"
                />
              </div>
            </div>

            {/* 座右铭 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-sage-600 mb-2">
                  中文座右铭
                </label>
                <input
                  value={formState.mottoZh}
                  onChange={(e) =>
                    setFormState({ ...formState, mottoZh: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-sage-200 rounded-md"
                  placeholder="真正的美味藏在街头巷尾的烟火气里。"
                />
              </div>
              <div>
                <label className="block text-sm text-sage-600 mb-2">
                  英文座右铭
                </label>
                <input
                  value={formState.mottoEn}
                  onChange={(e) =>
                    setFormState({ ...formState, mottoEn: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-sage-200 rounded-md"
                  placeholder="Real flavor lives in the streets."
                />
              </div>
            </div>

            {/* 简介 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-sage-600 mb-2">
                  中文简介
                </label>
                <textarea
                  value={formState.bioZh}
                  onChange={(e) =>
                    setFormState({ ...formState, bioZh: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-sage-200 rounded-md"
                  rows={3}
                  placeholder="个人简介..."
                />
              </div>
              <div>
                <label className="block text-sm text-sage-600 mb-2">
                  英文简介
                </label>
                <textarea
                  value={formState.bioEn}
                  onChange={(e) =>
                    setFormState({ ...formState, bioEn: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-sage-200 rounded-md"
                  rows={3}
                  placeholder="Bio in English..."
                />
              </div>
            </div>

            {/* 擅长领域（仅探寻者和厨师需要） */}
            {(formState.role === "explorer" || formState.role === "chef") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-sage-600 mb-2">
                    擅长菜系
                    <span className="text-sage-400 ml-1">
                      (用于自动匹配食谱，逗号分隔)
                    </span>
                  </label>
                  <input
                    value={formState.specialtyCuisines}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        specialtyCuisines: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-sage-200 rounded-md"
                    placeholder="川菜, 云南菜, 贵州菜"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sage-600 mb-2">
                    擅长地域
                    <span className="text-sage-400 ml-1">
                      (用于自动匹配食谱，逗号分隔)
                    </span>
                  </label>
                  <input
                    value={formState.specialtyRegions}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        specialtyRegions: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-sage-200 rounded-md"
                    placeholder="四川, 重庆, 云南, 贵州"
                  />
                </div>
              </div>
            )}

            {/* 排序和状态 */}
            <div className="flex items-center gap-6">
              <div>
                <label className="block text-sm text-sage-600 mb-2">排序</label>
                <input
                  type="number"
                  value={formState.sortOrder}
                  onChange={(e) =>
                    setFormState({ ...formState, sortOrder: e.target.value })
                  }
                  className="w-24 px-3 py-2 border border-sage-200 rounded-md"
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formState.isActive}
                  onChange={(e) =>
                    setFormState({ ...formState, isActive: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm text-sage-600">
                  启用该成员
                </label>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end gap-3 pt-4 border-t border-sage-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-sage-200 rounded-lg text-sage-600 hover:border-sage-400"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-lg disabled:opacity-60"
              >
                {saving ? "保存中..." : editingId ? "保存更新" : "新增成员"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 成员列表 */}
      <div className="bg-white rounded-lg border border-sage-200 overflow-hidden">
        {members.length === 0 ? (
          <div className="py-16 text-center text-sage-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无团队成员</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-sage-600 hover:underline"
            >
              点击新增第一位成员
            </button>
          </div>
        ) : (
          <div className="divide-y divide-sage-100">
            {members.map((member, index) => {
              const roleConfig = ROLE_CONFIG[member.role] || {
                label: member.role,
                icon: Users,
                color: "bg-gray-100 text-gray-700",
              };
              const IconComponent = roleConfig.icon;

              return (
                <div
                  key={member.id}
                  className={`p-6 ${!member.isActive ? "bg-sage-50 opacity-60" : ""
                    }`}
                >
                  <div className="flex items-start gap-4">
                    {/* 头像 */}
                    <div className="flex-shrink-0">
                      {member.avatarUrl ? (
                        <Image
                          src={member.avatarUrl}
                          alt={member.nameZh}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-full object-cover border-2 border-sage-200"
                          unoptimized
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-sage-200 flex items-center justify-center">
                          <IconComponent className="w-8 h-8 text-sage-400" />
                        </div>
                      )}
                    </div>

                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-medium text-sage-800">
                          {member.nameZh}
                        </h3>
                        <span className="text-sm text-sage-500">
                          {member.nameEn}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleConfig.color}`}
                        >
                          {roleConfig.label}
                        </span>
                      </div>

                      {member.mottoZh && (
                        <p className="text-sm text-sage-600 italic mb-2">
                          &ldquo;{member.mottoZh}&rdquo;
                        </p>
                      )}

                      {(member.specialtyCuisines.length > 0 ||
                        member.specialtyRegions.length > 0) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {member.specialtyCuisines.map((c) => (
                              <span
                                key={c}
                                className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded"
                              >
                                {c}
                              </span>
                            ))}
                            {member.specialtyRegions.map((r) => (
                              <span
                                key={r}
                                className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        )}

                      <div className="text-xs text-sage-400 mt-2">
                        slug: {member.slug}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMoveSort(member, "up")}
                        disabled={index === 0}
                        className="p-2 text-sage-400 hover:text-sage-600 disabled:opacity-30"
                        title="上移"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveSort(member, "down")}
                        disabled={index === members.length - 1}
                        className="p-2 text-sage-400 hover:text-sage-600 disabled:opacity-30"
                        title="下移"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(member)}
                        className={`p-2 ${member.isActive
                          ? "text-green-600 hover:text-green-700"
                          : "text-sage-400 hover:text-sage-600"
                          }`}
                        title={member.isActive ? "禁用" : "启用"}
                      >
                        {member.isActive ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(member)}
                        className="p-2 text-sage-600 hover:text-sage-800"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, member)}
                        className="p-2 text-red-500 hover:text-red-700"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
