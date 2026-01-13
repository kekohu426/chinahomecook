/**
 * 美食图库页面
 *
 * 路由：/[locale]/gallery
 * SEO优化版本 - 符合设计文档要求
 */

import { prisma } from "@/lib/db/prisma";
import { getContentLocales } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n/config";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GalleryPageClient } from "@/components/gallery/GalleryPageClient";
import { ChevronRight, Home } from "lucide-react";
import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import type { Metadata } from "next";

interface GalleryPageProps {
  params: Promise<{ locale: Locale }>;
}

// SEO 文案配置
const seoContent = {
  zh: {
    title: "中国美食图库 - 500+道家常菜高清图片与做法 | Recipe Zen",
    description:
      "浏览500+道中国家常菜高清图片，涵盖川菜、粤菜、湘菜等八大菜系。每道菜都有详细做法、食材清单和烹饪技巧。点击查看完整菜谱，轻松学做中餐。",
    h1: "中国美食图库",
    intro:
      "这里收录了500+道中国家常菜的高清成品图，涵盖川菜、粤菜、湘菜、鲁菜等八大菜系。每道菜都有详细的做法步骤和食材清单，从经典的麻婆豆腐、宫保鸡丁，到家常的番茄炒蛋、红烧肉，应有尽有。点击任意图片，即可查看完整菜谱。",
    countLabel: "当前收录",
    countUnit: "道菜谱",
    footerTitle: "关于中国美食图库",
    footerContent:
      "我们精心整理了中国各地的经典家常菜，每道菜都配有高清成品图、详细步骤和营养信息。无论你想学川菜的麻辣、粤菜的鲜香，还是江浙菜的清甜，这里都能找到灵感。所有食谱完全免费，永久访问。",
    breadcrumbHome: "首页",
    breadcrumbGallery: "美食图库",
  },
  en: {
    title: "Chinese Food Gallery - 500+ HD Recipe Photos | Recipe Zen",
    description:
      "Browse 500+ high-resolution Chinese cuisine photos covering Sichuan, Cantonese, Hunan and more. Each dish includes detailed recipes, ingredient lists, and cooking tips.",
    h1: "Chinese Food Gallery",
    intro:
      "Discover 500+ stunning photos of authentic Chinese home-cooked dishes, spanning eight major regional cuisines including Sichuan, Cantonese, Hunan, and Shandong. From classic Mapo Tofu and Kung Pao Chicken to everyday favorites like Tomato Egg Stir-fry and Red Braised Pork, each image links to a complete recipe with step-by-step instructions.",
    countLabel: "Currently featuring",
    countUnit: "recipes",
    footerTitle: "About Our Food Gallery",
    footerContent:
      "We've curated classic home-style dishes from across China, each with high-definition photos, detailed instructions, and nutritional information. Whether you're craving the bold spices of Sichuan, the fresh flavors of Cantonese cuisine, or the subtle sweetness of Jiangzhe dishes, you'll find inspiration here. All recipes are completely free, forever.",
    breadcrumbHome: "Home",
    breadcrumbGallery: "Food Gallery",
  },
};

export async function generateMetadata({
  params,
}: GalleryPageProps): Promise<Metadata> {
  const { locale } = await params;
  const content = seoContent[locale] || seoContent.zh;

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "https://recipezen.com"
    ),
    title: content.title,
    description: content.description,
    keywords:
      locale === "en"
        ? [
            "Chinese food photos",
            "recipe images",
            "Chinese cuisine",
            "food photography",
            "Asian cooking",
          ]
        : [
            "中国美食图片",
            "家常菜图片",
            "菜谱图片",
            "美食摄影",
            "高清食谱图",
          ],
    openGraph: {
      title: content.title,
      description: content.description,
      type: "website",
      images: ["/og-gallery.jpg"],
    },
  };
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { locale } = await params;
  const content = seoContent[locale] || seoContent.zh;
  const locales = getContentLocales(locale);

  // 获取筛选选项
  const [cuisines, locations, sceneTags] = await Promise.all([
    prisma.cuisine.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        translations: { where: { locale: { in: locales } } },
      },
    }),
    prisma.location.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        translations: { where: { locale: { in: locales } } },
      },
    }),
    prisma.tag.findMany({
      where: { type: "scene", isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        translations: { where: { locale: { in: locales } } },
      },
    }),
  ]);

  // 获取所有已发布的菜谱（带封面图）
  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where: {
        status: "published",
        coverImage: { not: null },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        prepTime: true,
        cookTime: true,
        difficulty: true,
        cuisine: { select: { id: true, name: true, slug: true } },
        location: { select: { id: true, name: true, slug: true } },
        tags: {
          include: {
            tag: {
              include: {
                translations: { where: { locale: { in: locales } } },
              },
            },
          },
        },
        translations: {
          where: { locale: { in: locales } },
          select: { locale: true, title: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.recipe.count({
      where: {
        status: "published",
        coverImage: { not: null },
      },
    }),
  ]);

  // 格式化数据供客户端使用
  const formattedRecipes = recipes.map((recipe) => {
    const translation =
      locales
        .map((loc) => recipe.translations.find((t) => t.locale === loc))
        .find(Boolean) || null;

    const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

    return {
      id: recipe.id,
      title: translation?.title || recipe.title,
      slug: translation?.slug || recipe.slug,
      coverImage: recipe.coverImage,
      cuisineId: recipe.cuisine?.id || null,
      cuisineName: recipe.cuisine?.name || null,
      cuisineSlug: recipe.cuisine?.slug || null,
      locationId: recipe.location?.id || null,
      locationName: recipe.location?.name || null,
      totalTime,
      difficulty: recipe.difficulty,
      tagIds: recipe.tags.map((rt) => rt.tag.id),
      tagNames: recipe.tags.map((rt) => {
        const tagTrans = rt.tag.translations.find((t) =>
          locales.includes(t.locale)
        );
        return tagTrans?.name || rt.tag.name;
      }),
    };
  });

  // 格式化筛选选项
  const formattedCuisines = cuisines.map((c) => {
    const trans = c.translations.find((t) => locales.includes(t.locale));
    return {
      id: c.id,
      name: trans?.name || c.name,
      slug: c.slug,
    };
  });

  const formattedLocations = locations.map((l) => {
    const trans = l.translations.find((t) => locales.includes(t.locale));
    return {
      id: l.id,
      name: trans?.name || l.name,
      slug: l.slug,
    };
  });

  const formattedSceneTags = sceneTags.map((t) => {
    const trans = t.translations.find((tr) => locales.includes(tr.locale));
    return {
      id: t.id,
      name: trans?.name || t.name,
      slug: t.slug,
    };
  });

  return (
    <div className="min-h-screen bg-cream">
      {/* 头部 */}
      <Header />

      {/* 面包屑导航 */}
      <div className="bg-sage-50 border-b border-sage-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-8 py-3">
          <ol className="flex items-center gap-2 text-sm text-sage-600">
            <li>
              <LocalizedLink
                href="/"
                className="hover:text-brownWarm transition-colors flex items-center gap-1"
              >
                <Home className="w-4 h-4" />
                {content.breadcrumbHome}
              </LocalizedLink>
            </li>
            <li>
              <ChevronRight className="w-4 h-4 text-sage-400" />
            </li>
            <li className="text-textDark font-medium">
              {content.breadcrumbGallery}
            </li>
          </ol>
        </nav>
      </div>

      {/* SEO 核心区 - H1 + 说明文案 */}
      <section className="bg-gradient-to-br from-brownWarm via-orangeAccent/70 to-brownWarm text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 md:py-16">
          <h1 className="text-4xl md:text-5xl font-serif font-medium mb-6">
            {content.h1}
          </h1>
          <p className="text-white/90 text-lg leading-relaxed max-w-3xl mb-6">
            {content.intro}
          </p>
          <p className="text-white/80 text-base">
            {content.countLabel}:{" "}
            <span className="font-semibold text-white">
              {total} {content.countUnit}
            </span>
          </p>
        </div>
      </section>

      {/* 客户端交互区（筛选 + 图片网格） */}
      <GalleryPageClient
        recipes={formattedRecipes}
        cuisines={formattedCuisines}
        locations={formattedLocations}
        sceneTags={formattedSceneTags}
        total={total}
        locale={locale}
      />

      {/* 底部 SEO 文案区 */}
      <section className="bg-sage-50 border-t border-sage-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
          <h2 className="text-2xl font-serif font-medium text-textDark mb-4">
            {content.footerTitle}
          </h2>
          <p className="text-sage-700 leading-relaxed max-w-3xl">
            {content.footerContent}
          </p>
        </div>
      </section>

      {/* SEO 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ImageGallery",
            name: content.h1,
            description: content.intro,
            url: `https://recipezen.com/${locale}/gallery`,
            numberOfItems: total,
            image: "https://recipezen.com/og-gallery.jpg",
          }),
        }}
      />

      {/* 页脚 */}
      <Footer />
    </div>
  );
}
