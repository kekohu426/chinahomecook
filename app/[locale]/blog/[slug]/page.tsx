/**
 * 博客详情页
 *
 * 路由：/blog/[slug]
 * 展示单篇博客文章
 */

import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ShareButton } from "@/components/blog/ShareButton";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { Calendar, ArrowLeft, User, Clock, ChevronRight } from "lucide-react";
import { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import type { Locale } from "@/lib/i18n/config";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { getContentLocales } from "@/lib/i18n/content";
import { localizePath, toRouteLocale } from "@/lib/i18n/utils";

// 计算阅读时间（中文约 400 字/分钟，英文约 200 词/分钟）
function calculateReadingTime(content: string, locale: string): number {
  if (!content) return 1;
  const isChinese = locale.startsWith("zh");
  if (isChinese) {
    const charCount = content.replace(/\s/g, "").length;
    return Math.max(1, Math.ceil(charCount / 400));
  } else {
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  }
}

interface BlogPost {
  id: string;
  title: string;
  summary: string | null;
  contentMarkdown: string;
  outline: any;
  faq: any;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImage: string | null;
  tags: string[];
  locale: string;
  publishedAt: Date | null;
  authorName: string | null;
  imageAssets: {
    id: string;
    prompt: string;
    imageUrl: string | null;
    altText: string | null;
    sectionHeading: string | null;
    position: number;
  }[];
}

interface BlogDetailResponse {
  post: BlogPost;
  alternateLocales: { locale: string; slug: string }[];
}

// TODO: BlogPost/BlogPostTranslation 模型尚未在新 schema 中实现
// 当博客模型创建后，需要更新此函数
async function getBlogPost(_slug: string, _locale: Locale = DEFAULT_LOCALE): Promise<BlogDetailResponse | null> {
  // BlogPost 模型不存在，返回 null
  return null;
}

interface BlogDetailPageProps {
  params: Promise<{ slug: string; locale: Locale }>;
}

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const data = await getBlogPost(slug, locale);

  if (!data) {
    return { title: locale === "en" ? "Post not found" : "文章不存在" };
  }

  const { post } = data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://recipezen.com";
  const articlePath = localizePath(`/blog/${post.slug}`, locale);
  const articleUrl = `${siteUrl}${articlePath}`;

  return {
    title:
      post.metaTitle ||
      `${post.title} | Recipe Zen ${locale === "en" ? "Blog" : "美食博客"}`,
    description: post.metaDescription || post.summary || "",
    keywords: post.tags.length > 0 ? post.tags.join(", ") : undefined,
    authors: post.authorName ? [{ name: post.authorName }] : undefined,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.summary || "",
      images: post.ogImage ? [{ url: post.ogImage, width: 1200, height: 630, alt: post.title }] : [],
      type: "article",
      url: articleUrl,
      siteName: "Recipe Zen",
      locale: post.locale === "zh-CN" ? "zh_CN" : post.locale.replace("-", "_"),
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.authorName ? [post.authorName] : undefined,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.summary || "",
      images: post.ogImage ? [post.ogImage] : [],
    },
    alternates: {
      canonical: post.canonicalUrl || articleUrl,
      languages: data.alternateLocales.reduce((acc, alt) => {
        const routeLocale = toRouteLocale(alt.locale);
        acc[routeLocale] = localizePath(`/blog/${alt.slug}`, routeLocale);
        return acc;
      }, {} as Record<string, string>),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug, locale } = await params;
  const data = await getBlogPost(slug, locale);

  if (!data) {
    notFound();
  }

  const { post, alternateLocales } = data;
  const readingTime = calculateReadingTime(post.contentMarkdown, post.locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://recipezen.com";

  // 过滤有效图片
  const validImages = post.imageAssets.filter((img) => img.imageUrl);

  // 获取相关食谱（由于博客不存在，返回空数组）
  // TODO: 当博客模型存在时，根据博客标签匹配菜系或关键词
  const relatedRecipes: any[] = [];

  // JSON-LD 结构化数据
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary || post.metaDescription || "",
    image: post.ogImage || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.publishedAt?.toISOString(),
    author: post.authorName
      ? {
          "@type": "Person",
          name: post.authorName,
        }
      : {
          "@type": "Organization",
          name: "Recipe Zen",
        },
    publisher: {
      "@type": "Organization",
      name: "Recipe Zen",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${post.slug}`,
    },
    keywords: post.tags.join(", "),
    articleSection: locale === "en" ? "Food Blog" : "美食博客",
    inLanguage: post.locale,
  };

  // 面包屑结构化数据
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "en" ? "Home" : "首页",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: locale === "en" ? "Blog" : "博客",
        item: `${siteUrl}${localizePath("/blog", locale)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${siteUrl}/blog/${post.slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* 面包屑导航 */}
        <nav className="flex items-center gap-2 text-sm text-textGray mb-6">
          <LocalizedLink href="/" className="hover:text-brownWarm transition-colors">
            {locale === "en" ? "Home" : "首页"}
          </LocalizedLink>
          <ChevronRight className="w-4 h-4" />
          <LocalizedLink href="/blog" className="hover:text-brownWarm transition-colors">
            {locale === "en" ? "Blog" : "博客"}
          </LocalizedLink>
          <ChevronRight className="w-4 h-4" />
          <span className="text-textDark truncate max-w-[200px]">{post.title}</span>
        </nav>

        <article itemScope itemType="https://schema.org/Article">
          {/* 标题区 */}
          <header className="mb-8">
            {/* 标签 */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <LocalizedLink
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 bg-brownWarm/10 text-brownWarm text-sm rounded-full hover:bg-brownWarm/20 transition-colors"
                  >
                    {tag}
                  </LocalizedLink>
                ))}
              </div>
            )}

            {/* 标题 */}
            <h1 className="text-3xl md:text-4xl font-serif font-medium text-textDark mb-4">
              {post.title}
            </h1>

            {/* 摘要 */}
            {post.summary && (
              <p className="text-lg text-textGray mb-4">{post.summary}</p>
            )}

            {/* 元信息 */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-textGray text-sm">
              {post.authorName && (
                <span className="flex items-center gap-1" itemProp="author">
                  <User className="w-4 h-4" />
                  {post.authorName}
                </span>
              )}
              {post.publishedAt && (
                <time
                  className="flex items-center gap-1"
                  dateTime={post.publishedAt.toISOString()}
                  itemProp="datePublished"
                >
                  <Calendar className="w-4 h-4" />
                  {new Date(post.publishedAt).toLocaleDateString(
                    locale === "en" ? "en-US" : "zh-CN",
                    {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    }
                  )}
                </time>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {readingTime}{" "}
                {locale === "en" ? "min read" : "分钟阅读"}
              </span>
            </div>

            {/* 语言切换 */}
            {alternateLocales.length > 0 && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="text-textGray">
                  {locale === "en" ? "Other languages:" : "其他语言："}
                </span>
                {alternateLocales.map((alt) => {
                  const targetLocale = toRouteLocale(alt.locale);
                  const targetHref = localizePath(`/blog/${alt.slug}`, targetLocale);
                  return (
                    <LocalizedLink
                      key={alt.locale}
                      href={targetHref}
                      className="px-2 py-1 bg-lightGray rounded hover:bg-brownWarm/10 transition-colors"
                    >
                      {targetLocale === "en" ? "English" : "中文"}
                    </LocalizedLink>
                  );
                })}
              </div>
            )}
          </header>

          {/* 封面图 */}
          {post.ogImage && (
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-8">
              <Image
                src={post.ogImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          )}

          {/* 目录（如果有大纲） */}
          {post.outline && Array.isArray(post.outline) && post.outline.length > 0 && (
            <nav className="bg-lightGray/50 rounded-xl p-6 mb-8">
              <h2 className="text-lg font-medium text-textDark mb-4">
                {locale === "en" ? "Table of Contents" : "目录"}
              </h2>
              <ul className="space-y-2">
                {post.outline.map((item: any, index: number) => (
                  <li key={index}>
                    <a
                      href={`#section-${index}`}
                      className="text-textGray hover:text-brownWarm transition-colors"
                    >
                      {item.heading || item.title || (typeof item === 'string' ? item : '')}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* 正文 */}
          <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-textDark prose-p:text-textGray prose-a:text-brownWarm prose-strong:text-textDark prose-li:text-textGray">
            <MarkdownRenderer content={post.contentMarkdown} />
          </div>

          {/* 插图展示 - 只有当有有效图片时才显示 */}
          {validImages.length > 0 && (
            <div className="mt-12 pt-8 border-t border-lightGray">
              <h2 className="text-xl font-serif font-medium text-textDark mb-6">
                {locale === "en" ? "Related Images" : "相关图片"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {validImages.map((img) => (
                  <figure key={img.id} className="group">
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-lightGray">
                      <Image
                        src={img.imageUrl!}
                        alt={img.altText || img.sectionHeading || ""}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    </div>
                    {(img.altText || img.sectionHeading) && (
                      <figcaption className="mt-2 text-sm text-textGray text-center">
                        {img.altText || img.sectionHeading}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          )}

          {/* FAQ */}
          {post.faq && Array.isArray(post.faq) && post.faq.length > 0 && (
            <div className="mt-12 pt-8 border-t border-lightGray">
              <h2 className="text-xl font-serif font-medium text-textDark mb-6">
                {locale === "en" ? "FAQ" : "常见问题"}
              </h2>
              <div className="space-y-4">
                {post.faq.map((item: any, index: number) => (
                  <details
                    key={index}
                    className="group bg-white rounded-lg border border-lightGray"
                  >
                    <summary className="px-6 py-4 cursor-pointer font-medium text-textDark hover:text-brownWarm transition-colors list-none flex items-center justify-between">
                      {item.question || item.q}
                      <span className="text-textGray group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>
                    <div className="px-6 pb-4 text-textGray">
                      {item.answer || item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* 分享与标签 */}
        <div className="mt-12 pt-8 border-t border-lightGray">
          {/* 标签云 */}
          {post.tags.length > 0 && (
            <div className="mb-6">
              <span className="text-textGray text-sm mr-2">
                {locale === "en" ? "Tags:" : "标签："}
              </span>
              <div className="inline-flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <LocalizedLink
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 bg-lightGray text-textGray text-sm rounded-full hover:bg-brownWarm/20 hover:text-brownWarm transition-colors"
                  >
                    #{tag}
                  </LocalizedLink>
                ))}
              </div>
            </div>
          )}

          {/* 分享按钮 */}
          <div className="flex items-center justify-center gap-4 py-6">
            <span className="text-textGray">
              {locale === "en" ? "Share:" : "分享文章："}
            </span>
            <ShareButton title={post.title} />
          </div>
        </div>

        {/* 作者信息卡片 */}
        {post.authorName && (
          <div className="mt-8 p-6 bg-white rounded-xl border border-lightGray">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brownWarm/10 flex items-center justify-center">
                <User className="w-8 h-8 text-brownWarm" />
              </div>
              <div>
                <p className="font-medium text-textDark">{post.authorName}</p>
                <p className="text-sm text-textGray">
                  {locale === "en"
                    ? "Recipe Zen Food Blogger"
                    : "Recipe Zen 美食博主"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 相关食谱推荐 */}
        {relatedRecipes.length > 0 && (
          <section className="mt-12 pt-8 border-t border-lightGray">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-medium text-textDark">
                {locale === "en" ? "Related Recipes" : "相关食谱推荐"}
              </h2>
              <LocalizedLink
                href="/recipe"
                className="text-brownWarm hover:underline text-sm"
              >
                {locale === "en" ? "View all recipes →" : "查看全部食谱 →"}
              </LocalizedLink>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {relatedRecipes.map((recipe: any) => (
                <RecipeCard
                  key={recipe.id}
                  id={recipe.id}
                  titleZh={recipe.title}
                  title={recipe.title}
                  summary={recipe.summary}
                  location={recipe.location?.name || null}
                  cuisine={recipe.cuisine?.name || null}
                  aiGenerated={recipe.aiGenerated}
                  coverImage={recipe.coverImage}
                  aspectClass="aspect-[4/3]"
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

/**
 * 简单的 Markdown 渲染器
 */
function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];
  let listType: "ul" | "ol" = "ul";

  const flushList = () => {
    if (listItems.length > 0) {
      if (listType === "ul") {
        elements.push(
          <ul key={elements.length} className="list-disc list-inside my-4 space-y-2">
            {listItems.map((item, i) => (
              <li key={i}>{renderInline(item)}</li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={elements.length} className="list-decimal list-inside my-4 space-y-2">
            {listItems.map((item, i) => (
              <li key={i}>{renderInline(item)}</li>
            ))}
          </ol>
        );
      }
      listItems = [];
      inList = false;
    }
  };

  const renderInline = (text: string): React.ReactNode => {
    // Images - 先处理图片，避免被链接匹配
    text = text.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4" />'
    );
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Italic
    text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
    // Code
    text = text.replace(/`(.+?)`/g, "<code>$1</code>");
    // Links
    text = text.replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" class="text-brownWarm hover:underline">$1</a>'
    );

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  let sectionIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3
          key={elements.length}
          id={`section-${sectionIndex++}`}
          className="text-xl font-medium mt-8 mb-4"
        >
          {line.replace("### ", "")}
        </h3>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2
          key={elements.length}
          id={`section-${sectionIndex++}`}
          className="text-2xl font-medium mt-10 mb-4"
        >
          {line.replace("## ", "")}
        </h2>
      );
      continue;
    }

    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={elements.length} className="text-3xl font-medium mt-12 mb-6">
          {line.replace("# ", "")}
        </h1>
      );
      continue;
    }

    // Horizontal rule
    if (line === "---" || line === "***") {
      flushList();
      elements.push(<hr key={elements.length} className="my-8 border-lightGray" />);
      continue;
    }

    // Unordered list
    if (line.match(/^[-*] /)) {
      if (!inList || listType !== "ul") {
        flushList();
        inList = true;
        listType = "ul";
      }
      listItems.push(line.replace(/^[-*] /, ""));
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      if (!inList || listType !== "ol") {
        flushList();
        inList = true;
        listType = "ol";
      }
      listItems.push(line.replace(/^\d+\. /, ""));
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote
          key={elements.length}
          className="border-l-4 border-brownWarm pl-4 my-4 italic text-textGray"
        >
          {renderInline(line.replace("> ", ""))}
        </blockquote>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      flushList();
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={elements.length} className="my-4">
        {renderInline(line)}
      </p>
    );
  }

  flushList();

  return <>{elements}</>;
}
