/**
 * 我的收藏页面
 *
 * 路由：/[locale]/favorites
 * 功能：展示用户收藏的所有食谱
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { Heart, ChevronRight, Home } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getContentLocales } from "@/lib/i18n/content";
import { localizePath } from "@/lib/i18n/utils";
import type { Metadata } from "next";

interface FavoritesPageProps {
  params: Promise<{ locale: Locale }>;
}

const pageContent = {
  zh: {
    title: "我的收藏",
    subtitle: "保存你喜欢的食谱，随时查看",
    breadcrumbHome: "首页",
    breadcrumbFavorites: "我的收藏",
    emptyTitle: "还没有收藏任何食谱",
    emptySubtitle: "浏览食谱并点击收藏按钮，将喜欢的食谱保存在这里",
    browseRecipes: "浏览食谱",
    totalCount: "共收藏",
    recipesUnit: "道食谱",
  },
  en: {
    title: "My Favorites",
    subtitle: "Save your favorite recipes for easy access",
    breadcrumbHome: "Home",
    breadcrumbFavorites: "My Favorites",
    emptyTitle: "No favorites yet",
    emptySubtitle: "Browse recipes and click the save button to add your favorites here",
    browseRecipes: "Browse Recipes",
    totalCount: "Total",
    recipesUnit: "recipes saved",
  },
};

export async function generateMetadata({
  params,
}: FavoritesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const content = pageContent[locale] || pageContent.zh;

  return {
    title: `${content.title} - Recipe Zen`,
    description: content.subtitle,
  };
}

export default async function FavoritesPage({ params }: FavoritesPageProps) {
  const { locale } = await params;
  const content = pageContent[locale] || pageContent.zh;
  const locales = getContentLocales(locale);
  const isEn = locale === "en";

  // 检查登录状态
  const session = await auth();
  if (!session?.user?.email) {
    redirect(localizePath("/login", locale) + `?callbackUrl=${encodeURIComponent(localizePath("/favorites", locale))}`);
  }

  // 获取或创建用户
  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {
      name: session.user.name || undefined,
    },
    create: {
      email: session.user.email,
      name: session.user.name || null,
      passwordHash: "", // OAuth 用户不需要密码
      role: "user",
    },
  });

  // 获取收藏列表
  const favorites = await prisma.userFavorite.findMany({
    where: { userId: user.id },
    include: {
      recipe: {
        include: {
          cuisine: {
            include: {
              translations: { where: { locale: { in: locales } } },
            },
          },
          location: {
            include: {
              translations: { where: { locale: { in: locales } } },
            },
          },
          translations: {
            where: { locale: { in: locales } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* 面包屑导航 */}
      <div className="bg-white border-b border-lightGray">
        <nav className="max-w-7xl mx-auto px-4 sm:px-8 py-3">
          <ol className="flex items-center gap-2 text-sm text-textGray">
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
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </li>
            <li className="text-textDark font-medium flex items-center gap-1">
              <Heart className="w-4 h-4 text-brownWarm" />
              {content.breadcrumbFavorites}
            </li>
          </ol>
        </nav>
      </div>

      {/* 页面标题 */}
      <section className="bg-gradient-to-br from-brownWarm via-orangeAccent/70 to-brownWarm text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-3 flex items-center gap-3">
            <Heart className="w-8 h-8 fill-current" />
            {content.title}
          </h1>
          <p className="text-white/90 text-lg">{content.subtitle}</p>
          {favorites.length > 0 && (
            <p className="text-white/80 mt-2">
              {content.totalCount}{" "}
              <span className="font-semibold text-white">{favorites.length}</span>{" "}
              {content.recipesUnit}
            </p>
          )}
        </div>
      </section>

      {/* 收藏列表 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        {favorites.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-brownWarm/10 flex items-center justify-center">
              <Heart className="w-10 h-10 text-brownWarm" />
            </div>
            <h2 className="text-xl font-medium text-textDark mb-2">
              {content.emptyTitle}
            </h2>
            <p className="text-textGray mb-6 max-w-md mx-auto">
              {content.emptySubtitle}
            </p>
            <LocalizedLink
              href="/recipe"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brownWarm text-white rounded-full font-medium hover:bg-brownDark transition-colors"
            >
              {content.browseRecipes}
            </LocalizedLink>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((fav) => {
              const recipe = fav.recipe;
              const translation = recipe.translations.find(
                (t) => t.locale === locale
              );
              const cuisineTrans = recipe.cuisine?.translations.find(
                (t) => t.locale === locale
              );
              const locationTrans = recipe.location?.translations.find(
                (t) => t.locale === locale
              );

              return (
                <RecipeCard
                  key={fav.id}
                  id={recipe.id}
                  slug={translation?.slug || recipe.slug}
                  titleZh={recipe.title}
                  title={translation?.title || recipe.title}
                  titleEn={
                    recipe.translations.find((t) => t.locale === "en")?.title
                  }
                  coverImage={recipe.coverImage || ""}
                  cuisine={cuisineTrans?.name || recipe.cuisine?.name || ""}
                  location={locationTrans?.name || recipe.location?.name}
                  summary={
                    (translation?.summary as any) || (recipe.summary as any)
                  }
                  aiGenerated={recipe.aiGenerated}
                  aspectClass="aspect-[4/3]"
                />
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
