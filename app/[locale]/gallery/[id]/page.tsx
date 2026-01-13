/**
 * 图片详情页
 *
 * 路由：/gallery/[id]
 * 展示单张美食图片，支持下载
 */

import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Download, ArrowLeft, ExternalLink } from "lucide-react";
import { getContentLocales } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n/config";

interface GalleryDetailPageProps {
  params: Promise<{ id: string; locale: Locale }>;
}

export async function generateMetadata({ params }: GalleryDetailPageProps) {
  const { id, locale } = await params;
  const locales = getContentLocales(locale);
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      translations: {
        where: { locale: { in: locales }, isReviewed: true },
        select: { locale: true, title: true },
      },
    },
  });

  if (!recipe) {
    return { title: locale === "en" ? "Image not found" : "图片不存在" };
  }

  const translation =
    locales
      .map((loc) => recipe.translations.find((item) => item.locale === loc))
      .find(Boolean) || null;
  const displayTitle = translation?.title || recipe.title;
  const isEn = locale === "en";

  return {
    title: `${displayTitle} - ${isEn ? "Food Photo" : "美食图片"} | Recipe Zen`,
    description: isEn
      ? `Download a high-resolution photo of ${displayTitle}`
      : `${displayTitle}的美食摄影图片，高清下载`,
    openGraph: {
      title: `${displayTitle} - ${isEn ? "Food Photo" : "美食图片"}`,
      images: recipe.coverImage ? [recipe.coverImage] : [],
    },
  };
}

export default async function GalleryDetailPage({
  params,
}: GalleryDetailPageProps) {
  const { id, locale } = await params;
  const locales = getContentLocales(locale);

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      cuisine: { select: { id: true, name: true, slug: true } },
      location: { select: { id: true, name: true, slug: true } },
      translations: {
        where: { locale: { in: locales }, isReviewed: true },
        select: { locale: true, title: true },
      },
    },
  });

  if (!recipe || !recipe.coverImage) {
    notFound();
  }

  const translation =
    locales
      .map((loc) => recipe.translations.find((item) => item.locale === loc))
      .find(Boolean) || null;
  const displayTitle = translation?.title || recipe.title;
  const isEn = locale === "en";

  // 获取相关图片
  const relatedWhere: any = {
    status: "published",
    coverImage: { not: null },
    id: { not: id },
    OR: [] as any[],
  };
  if (recipe.cuisineId) {
    relatedWhere.OR.push({ cuisineId: recipe.cuisineId });
  }
  if (recipe.locationId) {
    relatedWhere.OR.push({ locationId: recipe.locationId });
  }
  // 如果没有筛选条件，获取最新的相关图片
  if (relatedWhere.OR.length === 0) {
    delete relatedWhere.OR;
  }

  const relatedImages = await prisma.recipe.findMany({
    where: relatedWhere,
    include: {
      translations: {
        where: { locale: { in: locales }, isReviewed: true },
        select: { locale: true, title: true },
      },
    },
    take: 6,
  });

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <main className="max-w-6xl mx-auto px-8 py-12">
        {/* 返回按钮 */}
        <LocalizedLink
          href="/gallery"
          className="inline-flex items-center gap-2 text-textGray hover:text-textDark mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {isEn ? "Back to Gallery" : "返回图片库"}
        </LocalizedLink>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主图 */}
          <div className="lg:col-span-2">
            <div className="relative aspect-[4/3] bg-lightGray rounded-xl overflow-hidden shadow-lg">
              <Image
                src={recipe.coverImage}
                alt={displayTitle}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          </div>

          {/* 信息面板 */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-serif font-medium text-textDark mb-2">
                {displayTitle}
              </h1>
            </div>

            {/* 标签 */}
            <div className="flex flex-wrap gap-2">
              {recipe.cuisine && (
                <span className="px-3 py-1 bg-brownWarm/10 text-brownWarm rounded-full text-sm">
                  {recipe.cuisine.name}
                </span>
              )}
              {recipe.location && (
                <span className="px-3 py-1 bg-brownWarm/10 text-brownWarm rounded-full text-sm">
                  {recipe.location.name}
                </span>
              )}
            </div>

            {/* 下载按钮 */}
            <div className="space-y-3">
              <a
                href={recipe.coverImage}
                download={`${displayTitle}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors"
              >
                <Download className="w-5 h-5" />
                {isEn ? "Download Image" : "下载图片"}
              </a>
              <p className="text-xs text-textGray text-center">
                {isEn
                  ? "For personal use only. Contact us for commercial licensing."
                  : "图片仅供个人学习使用，商用请联系授权"}
              </p>
            </div>

            {/* 查看食谱 */}
            <LocalizedLink
              href={`/recipe/${recipe.id}`}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-brownWarm text-brownWarm rounded-lg hover:bg-brownWarm/10 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              {isEn ? "View Full Recipe" : "查看完整食谱"}
            </LocalizedLink>
          </div>
        </div>

        {/* 相关图片 */}
        {relatedImages.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-serif font-medium text-textDark mb-6">
              {isEn ? "Related Images" : "相关图片"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedImages.map((img) => {
                const relatedTranslation =
                  locales
                    .map((loc) =>
                      img.translations.find((item) => item.locale === loc)
                    )
                    .find(Boolean) || null;
                const relatedTitle = relatedTranslation?.title || img.title;
                return (
                <LocalizedLink
                  key={img.id}
                  href={`/gallery/${img.id}`}
                  className="group relative aspect-square rounded-lg overflow-hidden shadow-card hover:shadow-lg transition-shadow"
                >
                  {img.coverImage && (
                    <Image
                      src={img.coverImage}
                      alt={relatedTitle}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  )}
                </LocalizedLink>
              )})}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
