"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useSiteConfig } from "@/components/config/SiteConfigProvider";
import { localizePath } from "@/lib/i18n/utils";

export function Footer() {
  const { t, locale } = useTranslations();
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
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li>
                <Link
                  href={localizePath("/recipe", locale)}
                  className="hover:text-white transition-colors"
                >
                  {t("nav.recipes")}
                </Link>
              </li>
              <li>
                <Link
                  href={localizePath("/ai-custom", locale)}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.aiCustom")}
                </Link>
              </li>
              <li>
                <Link
                  href={localizePath("/gallery", locale)}
                  className="hover:text-white transition-colors"
                >
                  {t("nav.gallery")}
                </Link>
              </li>
              <li>
                <Link
                  href={localizePath("/blog", locale)}
                  className="hover:text-white transition-colors"
                >
                  {t("nav.blog")}
                </Link>
              </li>
            </ul>
          </div>

          {/* 关于 */}
          <div>
            <h4 className="font-medium mb-4">
              {t("footer.about")}
            </h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li>
                <Link
                  href={localizePath("/about", locale)}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.ourStory")}
                </Link>
              </li>
              <li>
                <Link
                  href={`${localizePath("/about", locale)}#team`}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.team")}
                </Link>
              </li>
              <li>
                <Link
                  href={`${localizePath("/about", locale)}#contact`}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* 法律 */}
          <div>
            <h4 className="font-medium mb-4">
              {t("footer.legal")}
            </h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li>
                <Link
                  href={localizePath("/privacy", locale)}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href={localizePath("/terms", locale)}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href={localizePath("/copyright", locale)}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.copyright")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 底部版权 */}
        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-cream/50 text-sm">
            © {new Date().getFullYear()} {siteConfig.copyright} ·{" "}
            {siteConfig.siteTagline} · {t("footer.allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
}
