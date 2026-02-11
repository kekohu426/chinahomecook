/**
 * 后台管理布局
 *
 * 路由：/admin/*
 * 包含侧边栏导航和主内容区
 * 需要 ADMIN 权限才能访问
 */

import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserMenu } from "@/components/auth/UserMenu";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 未登录用户重定向到登录页
  if (!session?.user) {
    redirect("/login");
  }

  // 非管理员重定向到无权限页面
  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 侧边栏 */}
      <aside className="w-64 bg-brownDark text-white flex-shrink-0">
        <div className="p-6 h-full flex flex-col">
          <Link href="/admin/dashboard">
            <h1 className="text-2xl font-serif font-medium mb-8">
              Recipe Zen
              <span className="block text-sm text-cream/70 mt-1">后台管理</span>
            </h1>
          </Link>

          <nav className="flex-1 space-y-6">
            <div>
              <Link
                href="/admin/dashboard"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium"
              >
                📊 运营仪表板
              </Link>
            </div>

            <div>
              <p className="text-xs text-cream/50 uppercase tracking-wider mb-2 px-4">
                食谱管理
              </p>
              <Link
                href="/admin/config/tags"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                🏷️ 标签管理
              </Link>
              <Link
                href="/admin/icons"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                🎨 食材图标管理
              </Link>
              <Link
                href="/admin/recipes"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                📋 食谱列表
              </Link>
              <Link
                href="/admin/recipes/import"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                📥 批量导入
              </Link>
            </div>

            <div>
              <p className="text-xs text-cream/50 uppercase tracking-wider mb-2 px-4">
                博客管理
              </p>
              <Link
                href="/admin/blog"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                📝 博客列表
              </Link>
            </div>

            <div>
              <p className="text-xs text-cream/50 uppercase tracking-wider mb-2 px-4">
                运营配置
              </p>
              <Link
                href="/admin/config/home"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                🏠 首页配置
              </Link>
              <Link
                href="/admin/featured"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                🔥 一级聚合页配置
              </Link>
              <Link
                href="/admin/collections"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                📚 二级聚合页管理
              </Link>
              <Link
                href="/admin/collections?filter=featured"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                ⭐ 精品聚合页
              </Link>
              <Link
                href="/admin/collections?filter=landing"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                📄 落地页
              </Link>
              <Link
                href="/admin/analytics/collections"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                📊 流量监控
              </Link>
            </div>

            <div>
              <p className="text-xs text-cream/50 uppercase tracking-wider mb-2 px-4">
                基础配置
              </p>
              <Link
                href="/admin/config/site"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                🌐 网站配置
              </Link>
              <Link
                href="/admin/config/ai"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                🤖 AI 配置
              </Link>
              <Link
                href="/admin/config/about"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                📝 关于我们
              </Link>
              <Link
                href="/admin/config/team"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                👥 团队成员管理
              </Link>
            </div>

            <div>
              <p className="text-xs text-cream/50 uppercase tracking-wider mb-2 px-4">
                AI 工具任务
              </p>
              <Link
                href="/admin/generate"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                🧰 菜谱生成
              </Link>
              <Link
                href="/admin/ai/blog"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                📰 博客生成
              </Link>
              <Link
                href="/admin/tools/prompt-generator"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                🖼️ 菜谱图片生成
              </Link>
              <Link
                href="/admin/jobs"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                ⚙️ 任务管理
              </Link>
              <Link
                href="/admin/ai-logs"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                📊 AI 生成日志
              </Link>
            </div>

            <div>
              <p className="text-xs text-cream/50 uppercase tracking-wider mb-2 px-4">
                审核管理
              </p>
              <Link
                href="/admin/review/recipes"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                ✅ 菜谱待审核
              </Link>
              <Link
                href="/admin/review/blogs"
                className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                🔍 博客待审核
              </Link>
            </div>
          </nav>

          {/* 底部用户信息和链接 */}
          <div className="pt-6 border-t border-white/10 space-y-4">
            <UserMenu user={session.user} />
            <Link
              href="/"
              className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              🏠 返回前台
            </Link>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto">
        <div className="px-8 pt-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between mb-6">
            <div className="text-sm text-textGray">运营后台</div>
            <Link
              href="/admin/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-cream text-sm text-textDark hover:border-brownWarm transition-colors"
            >
              🔔 任务管理
            </Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 pb-10">
          {children}
        </div>
      </main>
    </div>
  );
}
