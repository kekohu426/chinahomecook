/**
 * 后台管理布局
 *
 * 路由：/admin/*
 * 包含侧边栏导航和主内容区
 */

import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 侧边栏 */}
      <aside className="w-64 bg-brownDark text-white">
        <div className="p-6">
          <h1 className="text-2xl font-serif font-medium mb-8">
            Recipe Zen
            <span className="block text-sm text-cream/70 mt-1">后台管理</span>
          </h1>

          <nav className="space-y-2">
            <Link
              href="/admin/recipes"
              className="block px-4 py-2 rounded-sm hover:bg-white/10 transition-colors"
            >
              📋 食谱管理
            </Link>
            <Link
              href="/admin/recipes/new"
              className="block px-4 py-2 rounded-sm hover:bg-white/10 transition-colors"
            >
              ➕ 创建食谱
            </Link>
            <Link
              href="/"
              className="block px-4 py-2 rounded-sm hover:bg-white/10 transition-colors mt-8"
            >
              🏠 返回前台
            </Link>
          </nav>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
