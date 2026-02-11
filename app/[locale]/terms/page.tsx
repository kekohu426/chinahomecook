/**
 * 使用条款页面
 * 路由：/terms
 */

import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/translations";
import { renderLegalMarkdown } from "@/lib/i18n/legal-content";

interface TermsPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: t("legal.terms.metaTitle", locale),
    description: t("legal.terms.metaDescription", locale),
  };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  const lastUpdated = t("legal.lastUpdatedDate", locale);
  const contentHtml = renderLegalMarkdown("terms", locale);

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* 面包屑导航 */}
        <nav className="flex items-center gap-2 text-sm text-textGray mb-6">
          <LocalizedLink href="/" className="hover:text-brownWarm transition-colors">
            {t("nav.home", locale)}
          </LocalizedLink>
          <ChevronRight className="w-4 h-4" />
          <span className="text-textDark">
            {t("legal.terms.title", locale)}
          </span>
        </nav>

        <article className="bg-white rounded-xl p-6 sm:p-10 shadow-sm">
          <h1 className="text-3xl font-serif font-medium text-textDark mb-4">
            {t("legal.terms.title", locale)}
          </h1>
          <p className="text-sm text-textGray mb-8">
            {t("legal.lastUpdatedLabel", locale)} {lastUpdated}
          </p>

          <div
            className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-textDark prose-p:text-textGray prose-li:text-textGray"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </article>

        {/* 相关链接 */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm">
          <LocalizedLink
            href="/privacy"
            className="text-textGray hover:text-brownWarm transition-colors"
          >
            {t("legal.links.privacy", locale)}
          </LocalizedLink>
          <span className="text-lightGray">|</span>
          <LocalizedLink
            href="/copyright"
            className="text-textGray hover:text-brownWarm transition-colors"
          >
            {t("legal.links.copyright", locale)}
          </LocalizedLink>
          <span className="text-lightGray">|</span>
          <LocalizedLink
            href="/about"
            className="text-textGray hover:text-brownWarm transition-colors"
          >
            {t("legal.links.about", locale)}
          </LocalizedLink>
        </div>
      </main>

      <Footer />
    </div>
  );
}
