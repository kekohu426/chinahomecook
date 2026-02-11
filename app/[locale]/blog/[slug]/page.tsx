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
import { Calendar, ArrowLeft, User, Clock, ChevronRight } from "lucide-react";
import { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import type { Locale } from "@/lib/i18n/config";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { localizePath, toRouteLocale } from "@/lib/i18n/utils";
import { ensureEnglish } from "@/lib/i18n/english";
import { t } from "@/lib/i18n/translations";
import { getDateLocale } from "@/lib/i18n/format";

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

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  author: string | null;
  publishedAt: Date | null;
  locale: string;
  seo: any;
}

interface BlogDetailResponse {
  post: BlogPostData;
  alternateLocales: { locale: string; slug: string }[];
}

async function getBlogPost(slug: string, locale: Locale = DEFAULT_LOCALE): Promise<BlogDetailResponse | null> {
  try {
    // 先尝试通过主表 slug 查找
    let post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        translations: true,
      },
    });

    // 如果没找到，尝试通过翻译表 slug 查找
    if (!post) {
      const translation = await prisma.blogPostTranslation.findFirst({
        where: { slug },
        include: {
          post: {
            include: {
              translations: true,
            },
          },
        },
      });
      if (translation) {
        post = translation.post;
      }
    }

    if (!post || post.status !== "published") {
      return null;
    }

    // 获取当前语言的翻译
    const currentTranslation = post.translations.find((t) => t.locale === locale);

    // 构建返回数据
    const rawTitle = currentTranslation?.title || post.title;
    const rawContent = currentTranslation?.content || post.content || "";
    const rawExcerpt = currentTranslation?.excerpt || post.excerpt || "";
    const isEn = locale === "en";
    const postData: BlogPostData = {
      id: post.id,
      title: isEn ? ensureEnglish(rawTitle, "Untitled Post") : rawTitle,
      slug: currentTranslation?.slug || post.slug,
      content: isEn
        ? currentTranslation?.content
          ? rawContent
          : `<p>${t("common.englishComingSoon", locale)}</p>`
        : rawContent,
      excerpt: isEn ? ensureEnglish(rawExcerpt, "") : rawExcerpt,
      coverImage: post.coverImage,
      author: post.author,
      publishedAt: post.publishedAt,
      locale: locale,
      seo: post.seo,
    };

    // 构建备用语言列表
    const alternateLocales: { locale: string; slug: string }[] = [];

    // 添加主语言（中文）
    if (locale !== "zh") {
      alternateLocales.push({ locale: "zh", slug: post.slug });
    }

    // 添加其他翻译
    for (const trans of post.translations) {
      if (trans.locale !== locale) {
        alternateLocales.push({ locale: trans.locale, slug: trans.slug });
      }
    }

    return { post: postData, alternateLocales };
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
    return null;
  }
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
    return { title: t("blog.postNotFound", locale) };
  }

  const { post } = data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://recipezen.com";
  const articlePath = localizePath(`/blog/${post.slug}`, locale);
  const articleUrl = `${siteUrl}${articlePath}`;

  return {
    title: `${post.title} | Recipe Zen ${t("blog.breadcrumb", locale)}`,
    description: post.excerpt || "",
    authors: post.author ? [{ name: post.author }] : undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || "",
      images: post.coverImage ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }] : [],
      type: "article",
      url: articleUrl,
      siteName: "Recipe Zen",
      locale: locale === "zh" ? "zh_CN" : "en_US",
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.author ? [post.author] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || "",
      images: post.coverImage ? [post.coverImage] : [],
    },
    alternates: {
      canonical: articleUrl,
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

export async function generateStaticParams() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: "published" },
      select: {
        slug: true,
        translations: {
          select: { slug: true, locale: true },
        },
      },
    });

    const params: { slug: string; locale: Locale }[] = [];

    for (const post of posts) {
      // 添加主语言版本
      for (const locale of SUPPORTED_LOCALES) {
        params.push({ slug: post.slug, locale });
      }

      // 添加翻译版本
      for (const trans of post.translations) {
        if (SUPPORTED_LOCALES.includes(trans.locale as Locale)) {
          params.push({ slug: trans.slug, locale: trans.locale as Locale });
        }
      }
    }

    return params;
  } catch (error) {
    console.error("Failed to generate static params:", error);
    return [];
  }
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug, locale } = await params;
  const data = await getBlogPost(slug, locale);

  if (!data) {
    notFound();
  }

  const { post, alternateLocales } = data;
  const readingTime = calculateReadingTime(post.content, post.locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://recipezen.com";

  // JSON-LD 结构化数据
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || "",
    image: post.coverImage || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.publishedAt?.toISOString(),
    author: post.author
      ? {
          "@type": "Person",
          name: post.author,
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
    articleSection: t("blog.heroTitle", locale),
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
        name: t("nav.home", locale),
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("blog.breadcrumb", locale),
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
            {t("nav.home", locale)}
          </LocalizedLink>
          <ChevronRight className="w-4 h-4" />
          <LocalizedLink href="/blog" className="hover:text-brownWarm transition-colors">
            {t("blog.breadcrumb", locale)}
          </LocalizedLink>
          <ChevronRight className="w-4 h-4" />
          <span className="text-textDark truncate max-w-[200px]">{post.title}</span>
        </nav>

        <article itemScope itemType="https://schema.org/Article">
          {/* 标题区 */}
          <header className="mb-8">
            {/* 标题 */}
            <h1 className="text-3xl md:text-4xl font-serif font-medium text-textDark mb-4">
              {post.title}
            </h1>

            {/* 摘要 */}
            {post.excerpt && (
              <p className="text-lg text-textGray mb-4">{post.excerpt}</p>
            )}

            {/* 元信息 */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-textGray text-sm">
              {post.author && (
                <span className="flex items-center gap-1" itemProp="author">
                  <User className="w-4 h-4" />
                  {post.author}
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
                    getDateLocale(locale),
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
                {t("blog.readingTime", locale).replace("{count}", readingTime.toString())}
              </span>
            </div>

            {/* 语言切换 */}
            {alternateLocales.length > 0 && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="text-textGray">
                  {t("blog.otherLanguages", locale)}
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
                      {targetLocale === "en"
                        ? t("language.english", locale)
                        : t("language.chinese", locale)}
                    </LocalizedLink>
                  );
                })}
              </div>
            )}
          </header>

          {/* 封面图 */}
          {post.coverImage && (
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-8">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          )}

          {/* 正文 */}
          <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-textDark prose-p:text-textGray prose-a:text-brownWarm prose-strong:text-textDark prose-li:text-textGray">
            <MarkdownRenderer content={post.content} />
          </div>
        </article>

        {/* 分享 */}
        <div className="mt-12 pt-8 border-t border-lightGray">
          {/* 分享按钮 */}
          <div className="flex items-center justify-center gap-4 py-6">
            <span className="text-textGray">
              {t("blog.shareLabel", locale)}
            </span>
            <ShareButton title={post.title} />
          </div>
        </div>

        {/* 作者信息卡片 */}
        {post.author && (
          <div className="mt-8 p-6 bg-white rounded-xl border border-lightGray">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brownWarm/10 flex items-center justify-center">
                <User className="w-8 h-8 text-brownWarm" />
              </div>
              <div>
                <p className="font-medium text-textDark">{post.author}</p>
                <p className="text-sm text-textGray">
                  {t("blog.authorLabel", locale)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 返回列表 */}
        <div className="mt-8 text-center">
          <LocalizedLink
            href="/blog"
            className="inline-flex items-center gap-2 text-brownWarm hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("blog.backToList", locale)}
          </LocalizedLink>
        </div>
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
