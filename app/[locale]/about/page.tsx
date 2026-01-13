/**
 * 关于我们页面
 *
 * 路由：/about
 * 展示团队介绍，支持图文视频混排
 */

import Link from "next/link";
import Image from "next/image";
// import { prisma } from "@/lib/db/prisma"; // Unused until AboutSection model is created
import { getContentLocales } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n/config";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/ui/PageHero";
import { Users } from "lucide-react";
import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import type { Metadata } from "next";

// 从 YouTube URL 提取视频 ID
function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

interface AboutPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "About Recipe Zen" : "关于 Recipe Zen",
    description: isEn
      ? "Learn about our mission to make cooking simpler, warmer, and more reliable."
      : "了解我们的使命：让做饭更简单、更有温度、更值得信赖。",
  };
}

function pickTranslation<T extends { locale: string }>(
  translations: T[],
  locales: string[]
) {
  return (
    locales
      .map((loc) => translations.find((item) => item.locale === loc))
      .find(Boolean) || null
  );
}

// AboutSection 的类型定义
interface AboutSection {
  id: string;
  type: string;
  titleZh: string;
  titleEn: string | null;
  contentZh: string;
  imageUrl: string | null;
  videoUrl: string | null;
  sortOrder: number;
  translations: Array<{
    locale: string;
    title: string;
    content: string;
  }>;
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const locales = getContentLocales(locale);

  // TODO: AboutSection 模型尚未在新 schema 中实现
  // 当模型创建后，需要更新此查询
  const sections: AboutSection[] = [];

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* 页面标题区（版本3统一渐变 Hero） */}
      <PageHero
        title={locale === "en" ? "About Us" : "关于我们"}
        titleEn="Recipe Zen"
        description={locale === "en"
          ? "Making cooking simpler, warmer, and more reliable"
          : "让做饭更简单、更有温度、更值得信赖"}
        icon={Users}
        breadcrumbs={[{ label: locale === "en" ? "About" : "关于我们" }]}
        locale={locale}
      />

      {/* 自定义样式 */}
      <style>{`
        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }
        .team-member {
          background: white;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .team-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          margin: 0 auto 1rem;
          display: block;
          border: 3px solid #c17f59;
        }
        .team-member h4 {
          color: #5a4a3a;
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          text-align: center;
        }
        .team-member p {
          color: #666;
          font-style: italic;
          line-height: 1.6;
        }
        .philosophy-section {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .philosophy-section h4 {
          color: #5a4a3a;
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .philosophy-section p {
          color: #555;
          line-height: 1.8;
        }
        .contact-info {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          margin-top: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .contact-info p {
          margin-bottom: 1.25rem;
        }
        .contact-info a {
          color: #c17f59;
          text-decoration: underline;
        }
        .contact-info ul {
          list-style: disc;
          padding-left: 1.5rem;
          margin-top: 0.5rem;
        }
        .contact-info li {
          margin-bottom: 0.5rem;
        }
        .closing-text {
          text-align: center;
          font-size: 1.25rem;
          color: #5a4a3a;
          margin-top: 2rem;
        }
      `}</style>

      {/* 内容区 */}
      <main className="max-w-5xl mx-auto px-8 py-16">
        {sections.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-textGray text-lg mb-4">
              {locale === "en" ? "No content yet" : "暂无内容"}
            </p>
            <Link
              href="/admin/config/about"
              className="text-brownWarm hover:underline"
            >
              {locale === "en" ? "Go to admin" : "前往后台配置"}
            </Link>
          </div>
        ) : (
          <div className="space-y-20">
            {sections.map((section, index) => (
              <section
                key={section.id}
                className={`${
                  index === 0 ? "text-center pb-12 border-b border-sage-200" : ""
                } ${
                  index % 2 === 1 && index !== 0 ? "md:flex-row-reverse" : ""
                } ${
                  (section.type === "image" || section.type === "mixed") && index !== 0
                    ? "md:flex md:gap-12 md:items-center"
                    : ""
                }`}
              >
                {/* 图片区域 */}
                {(section.type === "image" || section.type === "mixed") &&
                  section.imageUrl && (
                    <div
                      className={`md:w-1/2 mb-8 md:mb-0 ${
                        index % 2 === 1 ? "md:order-2" : ""
                      }`}
                    >
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-card">
                        <img
                          src={section.imageUrl}
                          alt={section.titleZh}
                          className="w-full h-full object-cover"
                        />
                        {/* 占位符提示 */}
                        {section.imageUrl.includes("placeholder") && (
                          <div className="absolute inset-0 bg-gradient-to-br from-brownWarm/20 to-orangeAccent/20 flex items-center justify-center">
                            <span className="text-white/80 text-sm">
                              {locale === "en" ? "Image pending" : "待上传图片"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* 文字区域 */}
                <div
                  className={`${
                    (section.type === "image" || section.type === "mixed") &&
                    section.imageUrl && index !== 0
                      ? "md:w-1/2"
                      : "w-full"
                  }`}
                >
                  {(() => {
                    const translation = pickTranslation(
                      section.translations,
                      locales
                    );
                    const title = translation?.title || section.titleZh;
                    const content = translation?.content || section.contentZh;
                    return (
                      <>
                  <h2 className={`font-serif font-medium text-textDark mb-4 ${
                    index === 0 ? "text-4xl md:text-5xl" : "text-3xl"
                  }`}>
                    {title}
                  </h2>
                  {section.titleEn && (
                    <p className="text-sm text-textGray uppercase tracking-wide mb-6">
                      {section.titleEn}
                    </p>
                  )}
                  <div
                    className="prose prose-sage max-w-none text-textDark/80 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                      </>
                    );
                  })()}
                </div>

                {/* 视频区域 */}
                {(section.type === "video" || section.type === "mixed") &&
                  section.videoUrl && (
                    <div className="mt-8 w-full">
                      {getYouTubeId(section.videoUrl) ? (
                        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-card">
                          <iframe
                            src={`https://www.youtube.com/embed/${getYouTubeId(
                              section.videoUrl
                            )}`}
                            title={section.titleZh}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                          />
                        </div>
                      ) : (
                        <video
                          src={section.videoUrl}
                          controls
                          className="w-full rounded-2xl shadow-card"
                        >
                          {locale === "en"
                            ? "Your browser does not support video playback."
                            : "您的浏览器不支持视频播放"}
                        </video>
                      )}
                    </div>
                  )}
              </section>
            ))}
          </div>
        )}

        {/* 团队介绍占位区域（如果没有配置内容） */}
        {sections.length === 0 && (
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 shadow-card text-center"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brownWarm to-orangeAccent mx-auto mb-6" />
                <h3 className="text-xl font-medium text-textDark mb-2">
                  {locale === "en" ? `Team member ${i}` : `团队成员 ${i}`}
                </h3>
                <p className="text-textGray text-sm">
                  {locale === "en" ? "Food lover" : "美食爱好者"}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
