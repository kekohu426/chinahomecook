"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useSiteConfig } from "@/components/config/SiteConfigProvider";
import { localizePath } from "@/lib/i18n/utils";

export function Footer() {
  const locale = useLocale();
  const siteConfig = useSiteConfig();

  return (
    <footer className="bg-brownDark text-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 品牌 */}
          <div className="md:col-span-1">
            {siteConfig.logoUrl ? (
              <div className="mb-4">
                <Image
                  src={siteConfig.logoUrl}
                  alt={siteConfig.siteName}
                  width={150}
                  height={50}
                  className="h-10 w-auto object-contain brightness-0 invert"
                  unoptimized
                />
              </div>
            ) : (
              <h3 className="text-2xl font-serif font-medium mb-4">
                {siteConfig.siteName}
              </h3>
            )}
            <p className="text-cream/70 text-sm leading-relaxed">
              {siteConfig.siteTagline}
              <br />
              {siteConfig.footerDescription}
            </p>
          </div>

          {/* 快速链接 */}
          <div>
            <h4 className="font-medium mb-4">
              {locale === "en" ? "Quick Links" : "快速链接"}
            </h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li>
                <Link
                  href={localizePath("/recipe", locale)}
                  className="hover:text-white transition-colors"
                >
                  {locale === "en" ? "Recipes" : "食谱"}
                </Link>
              </li>
              <li>
                <Link
                  href={localizePath("/ai-custom", locale)}
                  className="hover:text-white transition-colors"
                >
                  {locale === "en" ? "AI Custom" : "AI 定制"}
                </Link>
              </li>
              <li>
                <Link
                  href={localizePath("/gallery", locale)}
                  className="hover:text-white transition-colors"
                >
                  {locale === "en" ? "Gallery" : "美食图片库"}
                </Link>
              </li>
              <li>
                <Link
                  href={localizePath("/blog", locale)}
                  className="hover:text-white transition-colors"
                >
                  {locale === "en" ? "Blog" : "博客"}
                </Link>
              </li>
            </ul>
          </div>

          {/* 关于 */}
          <div>
            <h4 className="font-medium mb-4">
              {locale === "en" ? "About" : "关于我们"}
            </h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li>
                <Link
                  href={localizePath("/about", locale)}
                  className="hover:text-white transition-colors"
                >
                  {locale === "en" ? "Our Story" : "品牌故事"}
                </Link>
              </li>
              <li>
                <Link
                  href={`${localizePath("/about", locale)}#team`}
                  className="hover:text-white transition-colors"
                >
                  {locale === "en" ? "Team" : "团队介绍"}
                </Link>
              </li>
              <li>
                <Link
                  href={`${localizePath("/about", locale)}#contact`}
                  className="hover:text-white transition-colors"
                >
                  {locale === "en" ? "Contact" : "联系合作"}
                </Link>
              </li>
            </ul>
          </div>

          {/* 法律 */}
          <div>
            <h4 className="font-medium mb-4">
              {locale === "en" ? "Legal" : "法律声明"}
            </h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li>
                <Link
                  href={localizePath("/privacy", locale)}
                  className="hover:text-white transition-colors"
                >
                  {locale === "en" ? "Privacy Policy" : "隐私政策"}
                </Link>
              </li>
              <li>
                <Link
                  href={localizePath("/terms", locale)}
                  className="hover:text-white transition-colors"
                >
                  {locale === "en" ? "Terms" : "使用条款"}
                </Link>
              </li>
              <li>
                <Link
                  href={localizePath("/copyright", locale)}
                  className="hover:text-white transition-colors"
                >
                  {locale === "en" ? "Copyright" : "版权声明"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 底部版权 */}
        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-cream/50 text-sm">
            © {new Date().getFullYear()} {siteConfig.copyright} ·{" "}
            {siteConfig.siteTagline} · All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
