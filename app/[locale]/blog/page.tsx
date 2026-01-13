/**
 * 博客列表页
 *
 * 路由：/blog
 * 展示美食博客文章
 */

import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/ui/PageHero";
import { Calendar, Tag, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
// import { prisma } from "@/lib/db/prisma"; // Unused until BlogPost model is created
import type { Locale } from "@/lib/i18n/config";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
// import { getContentLocales } from "@/lib/i18n/content"; // Unused until BlogPost model is created
import type { Metadata } from "next";

export const revalidate = 60;

interface BlogPost {
  id: string;
  title: string;
  summary: string;
  slug: string;
  tags: string[];
  coverImage: string | null;
  publishedAt: Date | null;
  authorName: string | null;
}

// TODO: BlogPost 模型尚未在新 schema 中实现
// 当博客模型创建后，需要更新此函数
async function getBlogPosts(_page: number = 1, _tag?: string, _locale: Locale = DEFAULT_LOCALE) {
  // BlogPost 模型不存在，返回空数据
  return {
    posts: [] as BlogPost[],
    pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "Food Blog - Recipe Zen" : "美食博客 - Recipe Zen",
    description: isEn
      ? "Cooking tips, food culture, and healthy eating ideas to inspire your kitchen."
      : "分享烹饪技巧、美食文化、健康饮食知识，让你成为厨房达人",
  };
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ page?: string; tag?: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";
  const search = await searchParams;
  const page = parseInt(search.page || "1");
  const tag = search.tag;
  const { posts, pagination } = await getBlogPosts(page, tag, locale);

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* 页面标题区（版本3统一渐变 Hero） */}
      <PageHero
        title={locale === "en" ? "Food Blog" : "美食博客"}
        titleEn={locale === "en" ? undefined : "Recipe Zen Blog"}
        description={locale === "en"
          ? "Cooking skills · Food culture · Healthy eating"
          : "烹饪技巧 · 美食文化 · 健康饮食"}
        icon={BookOpen}
        breadcrumbs={[{ label: locale === "en" ? "Blog" : "博客" }]}
        locale={locale}
      />

      {/* 标签筛选提示 */}
      {tag && (
        <div className="max-w-7xl mx-auto px-8 pt-8">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-textGray">
              {locale === "en" ? "Filter:" : "当前筛选："}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-brownWarm/10 text-brownWarm rounded-full">
              <Tag className="w-3 h-3" />
              {tag}
            </span>
            <LocalizedLink href="/blog" className="text-textGray hover:text-brownWarm">
              {locale === "en" ? "Clear" : "清除"}
            </LocalizedLink>
          </div>
        </div>
      )}

      {/* 博客列表 */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-lightGray rounded-full flex items-center justify-center">
              <span className="text-4xl">📝</span>
            </div>
            <h2 className="text-xl font-medium text-textDark mb-2">
              {locale === "en" ? "No posts yet" : "暂无博客文章"}
            </h2>
            <p className="text-textGray">
              {locale === "en"
                ? "New content is on the way."
                : "精彩内容即将上线，敬请期待"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <LocalizedLink
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-shadow"
                >
                  {/* 封面图 */}
                  <div className="relative aspect-[16/9] bg-lightGray">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brownWarm/20 to-orangeAccent/20">
                        <span className="text-5xl">🍳</span>
                      </div>
                    )}
                  </div>

                  {/* 内容 */}
                  <div className="p-6">
                    {/* 标签 */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 bg-brownWarm/10 text-brownWarm text-xs rounded-full"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 标题 */}
                    <h2 className="text-lg font-medium text-textDark group-hover:text-brownWarm transition-colors line-clamp-2 mb-3">
                      {post.title}
                    </h2>

                    {/* 摘要 */}
                    <p className="text-sm text-textGray line-clamp-3 mb-4">
                      {post.summary || (isEn ? "Read more..." : "点击查看详情...")}
                    </p>

                    {/* 底部信息 */}
                    <div className="flex items-center justify-between text-xs text-textGray">
                      <span>{post.authorName || "Recipe Zen"}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString(
                              locale === "en" ? "en-US" : "zh-CN"
                            )
                          : "-"}
                      </span>
                    </div>
                  </div>
                </LocalizedLink>
              ))}
            </div>

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                {page > 1 && (
                  <LocalizedLink
                    href={`/blog?page=${page - 1}${tag ? `&tag=${tag}` : ""}`}
                    className="flex items-center gap-1 px-4 py-2 border border-lightGray rounded-lg hover:bg-lightGray/50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {locale === "en" ? "Prev" : "上一页"}
                  </LocalizedLink>
                )}

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  )
                    .filter((p) => {
                      return (
                        p === 1 ||
                        p === pagination.totalPages ||
                        Math.abs(p - page) <= 2
                      );
                    })
                    .map((p, index, arr) => {
                      const showEllipsisBefore =
                        index > 0 && p - arr[index - 1] > 1;
                      return (
                        <span key={p} className="flex items-center">
                          {showEllipsisBefore && (
                            <span className="px-2 text-textGray">...</span>
                          )}
                          <LocalizedLink
                            href={`/blog?page=${p}${tag ? `&tag=${tag}` : ""}`}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                              p === page
                                ? "bg-brownWarm text-white"
                                : "hover:bg-lightGray/50"
                            }`}
                          >
                            {p}
                          </LocalizedLink>
                        </span>
                      );
                    })}
                </div>

                {page < pagination.totalPages && (
                  <LocalizedLink
                    href={`/blog?page=${page + 1}${tag ? `&tag=${tag}` : ""}`}
                    className="flex items-center gap-1 px-4 py-2 border border-lightGray rounded-lg hover:bg-lightGray/50 transition-colors"
                  >
                    {locale === "en" ? "Next" : "下一页"}
                    <ChevronRight className="w-4 h-4" />
                  </LocalizedLink>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
