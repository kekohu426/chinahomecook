/**
 * 后台管理首页
 * 路由：/admin
 */

import Link from "next/link";
import {
  ChefHat,
  FileText,
  Image,
  Settings,
  Sparkles,
  Home,
  Tag,
  Palette,
  Layers,
  ListTodo,
  CheckCircle,
  Eye,
} from "lucide-react";

const adminMenus = [
  {
    title: "标签管理",
    description: "维护场景/方法/口味等标签",
    href: "/admin/config/tags",
    icon: Tag,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "食材图标管理",
    description: "管理食材图标库",
    href: "/admin/icons",
    icon: Palette,
    color: "bg-green-100 text-green-600",
  },
  {
    title: "菜谱列表",
    description: "查看、编辑、发布食谱",
    href: "/admin/recipes",
    icon: ChefHat,
    color: "bg-orange-100 text-orange-600",
  },
  {
    title: "食谱图片",
    description: "管理食谱配图与提示词",
    href: "/admin/recipes/images",
    icon: Image,
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    title: "博客列表",
    description: "管理博客文章",
    href: "/admin/blog",
    icon: FileText,
    color: "bg-cyan-100 text-cyan-600",
  },
  {
    title: "首页配置",
    description: "配置首页内容",
    href: "/admin/config/home",
    icon: Home,
    color: "bg-pink-100 text-pink-600",
  },
  {
    title: "一级聚合页配置",
    description: "管理推荐位和一级聚合",
    href: "/admin/featured",
    icon: Sparkles,
    color: "bg-amber-100 text-amber-600",
  },
  {
    title: "二级聚合页配置",
    description: "管理聚合页内容与达标情况",
    href: "/admin/collections",
    icon: Layers,
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "网站配置",
    description: "基础站点信息与样式",
    href: "/admin/config/site",
    icon: Settings,
    color: "bg-gray-100 text-gray-600",
  },
  {
    title: "AI 配置",
    description: "AI 接口与提示词管理",
    href: "/admin/config/ai",
    icon: Sparkles,
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    title: "关于我们",
    description: "配置关于页面文案与信息",
    href: "/admin/config/about",
    icon: FileText,
    color: "bg-slate-100 text-slate-600",
  },
  {
    title: "菜谱生成",
    description: "使用 AI 生成新菜谱",
    href: "/admin/generate",
    icon: Sparkles,
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "博客生成",
    description: "AI 生成博客文章",
    href: "/admin/ai/blog",
    icon: FileText,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "任务管理",
    description: "查看 AI 生成任务进度",
    href: "/admin/jobs",
    icon: ListTodo,
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    title: "菜谱待审核",
    description: "审核 AI 生成的菜谱",
    href: "/admin/review/recipes",
    icon: CheckCircle,
    color: "bg-green-100 text-green-600",
  },
  {
    title: "博客待审核",
    description: "审核博客内容与翻译",
    href: "/admin/review/blogs",
    icon: Eye,
    color: "bg-rose-100 text-rose-600",
  },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-serif font-medium text-textDark mb-2">
          后台管理
        </h1>
        <p className="text-textGray mb-8">Recipe Zen 管理后台</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminMenus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="block p-6 bg-white rounded-xl border border-stone-200 hover:border-brownWarm hover:shadow-md transition-all group"
            >
              <div
                className={`w-12 h-12 rounded-lg ${menu.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <menu.icon className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-medium text-textDark mb-1">
                {menu.title}
              </h2>
              <p className="text-sm text-textGray">{menu.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200">
          <Link
            href="/"
            className="text-brownWarm hover:underline text-sm"
          >
            ← 返回网站首页
          </Link>
        </div>
      </div>
    </div>
  );
}
