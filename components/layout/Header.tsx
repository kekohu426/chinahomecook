"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Search, Menu, X, Globe, ChevronDown } from "lucide-react";
import { HeaderAuth } from "@/components/auth/HeaderAuth";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useSiteConfig } from "@/components/config/SiteConfigProvider";
import { localizePath, stripLocaleFromPathname } from "@/lib/i18n/utils";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";

// 导航标签支持所有语言（未翻译的回退到英文）
const NAV_ITEMS: Array<{ href: string; label: Record<string, string> }> = [
  { href: "/", label: { zh: "首页", en: "Home", ja: "ホーム", ko: "홈", es: "Inicio", fr: "Accueil", de: "Start", pt: "Início", it: "Home", ru: "Главная" } },
  { href: "/recipe", label: { zh: "食谱", en: "Recipes", ja: "レシピ", ko: "레시피", es: "Recetas", fr: "Recettes", de: "Rezepte", pt: "Receitas", it: "Ricette", ru: "Рецепты" } },
  { href: "/gallery", label: { zh: "美食图库", en: "Gallery", ja: "ギャラリー", ko: "갤러리", es: "Galería", fr: "Galerie", de: "Galerie", pt: "Galeria", it: "Galleria", ru: "Галерея" } },
  { href: "/ai-custom", label: { zh: "AI 定制", en: "AI Custom", ja: "AIカスタム", ko: "AI 맞춤", es: "IA Personal", fr: "IA Sur Mesure", de: "KI-Anpassung", pt: "IA Personalizada", it: "IA Personalizzata", ru: "ИИ-рецепты" } },
  { href: "/blog", label: { zh: "博客", en: "Blog", ja: "ブログ", ko: "블로그", es: "Blog", fr: "Blog", de: "Blog", pt: "Blog", it: "Blog", ru: "Блог" } },
  { href: "/about", label: { zh: "关于", en: "About", ja: "概要", ko: "소개", es: "Acerca de", fr: "À propos", de: "Über uns", pt: "Sobre", it: "Chi siamo", ru: "О нас" } },
];

function getNavLabel(item: typeof NAV_ITEMS[0], locale: Locale): string {
  return item.label[locale] || item.label.en || item.label.zh;
}

interface HeaderProps {
  variant?: "default" | "transparent";
}

export function Header({ variant = "default" }: HeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const siteConfig = useSiteConfig();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭语言菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchPlaceholder =
    locale === "en" ? "Search dishes or ingredients..." : "搜索菜名、食材...";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const target = `${localizePath("/recipe", locale)}?q=${encodeURIComponent(
        searchQuery.trim()
      )}`;
      router.push(target);
      setSearchQuery("");
    }
  };

  const switchLocale = (targetLocale: Locale) => {
    const basePath = stripLocaleFromPathname(pathname);
    const queryString = searchParams.toString();
    const targetPath = localizePath(basePath, targetLocale);
    router.push(queryString ? `${targetPath}?${queryString}` : targetPath);
  };

  const isTransparent = variant === "transparent";
  const bgClass = isTransparent
    ? "bg-transparent"
    : "bg-white border-b border-lightGray";
  const textClass = isTransparent ? "text-white" : "text-textDark";
  const logoClass = isTransparent ? "text-white" : "text-brownWarm";

  return (
    <header className={`${bgClass} sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={localizePath("/", locale)}
            className={`text-2xl font-serif font-medium ${logoClass} flex items-center gap-2`}
          >
            {siteConfig.logoUrl ? (
              <Image
                src={siteConfig.logoUrl}
                alt={siteConfig.siteName}
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
                unoptimized
              />
            ) : (
              siteConfig.siteName
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {NAV_ITEMS.map((item) => {
              const localizedHref = localizePath(item.href, locale);
              const currentPath = stripLocaleFromPathname(pathname);
              const isActive =
                currentPath === item.href ||
                (item.href !== "/" && currentPath.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={localizedHref}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? isTransparent
                        ? "text-white border-b-2 border-white"
                        : "text-brownWarm border-b-2 border-brownWarm"
                      : isTransparent
                      ? "text-white/80 hover:text-white"
                      : "text-textGray hover:text-textDark"
                  }`}
                >
                  {getNavLabel(item, locale)}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Search (Desktop) */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={`w-48 lg:w-56 pl-10 pr-4 py-2 text-sm rounded-full border transition-all focus:outline-none focus:w-64 ${
                    isTransparent
                      ? "bg-white/20 border-white/30 text-white placeholder-white/60 focus:bg-white/30"
                      : "bg-gray-50 border-lightGray text-textDark placeholder-textGray focus:border-brownWarm focus:ring-2 focus:ring-brownWarm/20"
                  }`}
                />
                <Search
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isTransparent ? "text-white/60" : "text-textGray"
                  }`}
                />
              </div>
            </form>

            {/* Auth */}
            <HeaderAuth />

            {/* Language Switcher Dropdown */}
            <div className="hidden md:block relative" ref={langMenuRef}>
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  isTransparent
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-textGray hover:text-textDark hover:bg-gray-100"
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>{LOCALE_LABELS[locale]}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {SUPPORTED_LOCALES.map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        switchLocale(key);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        locale === key
                          ? "bg-brownWarm/10 text-brownWarm font-medium"
                          : "text-textGray hover:bg-gray-50 hover:text-textDark"
                      }`}
                    >
                      {LOCALE_LABELS[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 ${textClass}`}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-lightGray">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-full border border-lightGray bg-gray-50 focus:outline-none focus:border-brownWarm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textGray" />
              </div>
            </form>

            {/* Mobile Nav */}
            <nav className="space-y-2">
              {NAV_ITEMS.map((item) => {
                const localizedHref = localizePath(item.href, locale);
                const currentPath = stripLocaleFromPathname(pathname);
                const isActive =
                  currentPath === item.href ||
                  (item.href !== "/" && currentPath.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={localizedHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2 rounded-lg ${
                      isActive
                        ? "bg-brownWarm/10 text-brownWarm font-medium"
                        : "text-textGray hover:bg-gray-50"
                    }`}
                  >
                    {getNavLabel(item, locale)}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Language Selector */}
            <div className="mt-4 px-4">
              <p className="text-xs text-textGray mb-2 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {locale === "zh" ? "选择语言" : "Language"}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {SUPPORTED_LOCALES.map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      switchLocale(key);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-2 py-1.5 rounded text-xs transition-colors ${
                      locale === key
                        ? "bg-brownWarm text-white"
                        : "bg-gray-100 text-textGray hover:bg-gray-200"
                    }`}
                  >
                    {LOCALE_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
