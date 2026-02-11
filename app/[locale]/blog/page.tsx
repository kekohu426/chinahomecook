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
import { prisma } from "@/lib/db/prisma";
import type { Locale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/translations";
import { ensureEnglish } from "@/lib/i18n/english";
import { getDateLocale } from "@/lib/i18n/format";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import type { Metadata } from "next";

export const revalidate = 60;

interface BlogPostItem {
  id: string;
  title: string;
  summary: string;
  slug: string;
  coverImage: string | null;
  publishedAt: Date | null;
  authorName: string | null;
}

async function getBlogPosts(page: number = 1, _tag?: string, locale: Locale = DEFAULT_LOCALE) {
  const limit = 12;
  const skip = (page - 1) * limit;

  try {
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: { status: "published" },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          author: true,
          translations: {
            where: { locale },
            select: {
              title: true,
              slug: true,
              excerpt: true,
            },
          },
        },
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where: { status: "published" } }),
    ]);

    // 转换为统一格式，优先使用翻译内容
    const formattedPosts: BlogPostItem[] = posts.map((post) => {
      const translation = post.translations[0];
      const rawTitle = translation?.title || post.title;
      const rawSummary = translation?.excerpt || post.excerpt || "";
      return {
        id: post.id,
        title: locale === "en" ? ensureEnglish(rawTitle, "Untitled Post") : rawTitle,
        summary: locale === "en" ? ensureEnglish(rawSummary, "") : rawSummary,
        slug: translation?.slug || post.slug,
        coverImage: post.coverImage,
        publishedAt: post.publishedAt,
        authorName: post.author,
      };
    });

    return {
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    return {
      posts: [] as BlogPostItem[],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: t("blog.metaTitle", locale),
    description: t("blog.metaDescription", locale),
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
  const search = await searchParams;
  const page = parseInt(search.page || "1");
  const tag = search.tag;
  const { posts, pagination } = await getBlogPosts(page, tag, locale);

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* 页面标题区（版本3统一渐变 Hero） */}
      <PageHero
        title={t("blog.heroTitle", locale)}
        titleEn={locale === "en" ? undefined : t("blog.heroTitleEn", locale)}
        description={t("blog.heroSubtitle", locale)}
        icon={BookOpen}
        breadcrumbs={[{ label: t("blog.breadcrumb", locale) }]}
        locale={locale}
      />

      {/* 标签筛选提示 */}
      {tag && (
        <div className="max-w-7xl mx-auto px-8 pt-8">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-textGray">
              {t("blog.filterLabel", locale)}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-brownWarm/10 text-brownWarm rounded-full">
              <Tag className="w-3 h-3" />
              {tag}
            </span>
            <LocalizedLink href="/blog" className="text-textGray hover:text-brownWarm">
              {t("blog.filterClear", locale)}
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
              {t("blog.emptyTitle", locale)}
            </h2>
            <p className="text-textGray">
              {t("blog.emptySubtitle", locale)}
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
                    {/* 标题 */}
                    <h2 className="text-lg font-medium text-textDark group-hover:text-brownWarm transition-colors line-clamp-2 mb-3">
                      {post.title}
                    </h2>

                    {/* 摘要 */}
                    <p className="text-sm text-textGray line-clamp-3 mb-4">
                      {post.summary || t("blog.readMore", locale)}
                    </p>

                    {/* 底部信息 */}
                    <div className="flex items-center justify-between text-xs text-textGray">
                      <span>{post.authorName || "Recipe Zen"}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString(
                              getDateLocale(locale)
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
                    {t("common.previous", locale)}
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
                    {t("common.nextPage", locale)}
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
