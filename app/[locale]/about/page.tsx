/**
 * 关于我们页面
 *
 * 路由：/about
 * 展示团队介绍，支持图文视频混排
 * 团队成员数据从 TeamMember 表读取（与后台配置共用）
 */

import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db/prisma";
import { getContentLocales } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/translations";
import { ensureEnglish } from "@/lib/i18n/english";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/ui/PageHero";
import { Users } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

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
  return {
    title: t("about.metaTitle", locale),
    description: t("about.metaDescription", locale),
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

// TeamMember 的类型定义
interface TeamMember {
  id: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  role: string;
  bioZh: string | null;
  bioEn: string | null;
  mottoZh: string | null;
  mottoEn: string | null;
  avatarUrl: string | null;
  sortOrder: number;
}

// 角色配置
const ROLE_LABELS: Record<string, { zh: string; en: string }> = {
  founder: { zh: "创始人 & 主编", en: "Founder & Editor-in-Chief" },
  explorer: { zh: "美食探寻者", en: "Food Explorer" },
  chef: { zh: "专业厨师", en: "Professional Chef" },
  nutritionist: { zh: "注册营养师", en: "Registered Dietitian" },
  photographer: { zh: "美食摄影师", en: "Food Photographer" },
};

// 团队成员卡片组件
function TeamMemberCard({
  member,
  isEn,
}: {
  member: TeamMember;
  isEn: boolean;
}) {
  let roleLocale: "en" | "zh" = "zh";
  if (isEn) roleLocale = "en";
  const name = isEn ? member.nameEn : `${member.nameZh} / ${member.nameEn}`;
  const roleLabel = ROLE_LABELS[member.role]?.[roleLocale] || member.role;
  const motto = isEn ? member.mottoEn : member.mottoZh;
  const bio = isEn ? member.bioEn : member.bioZh;

  return (
    <div className="team-member">
      <div className="team-header">
        {member.avatarUrl ? (
          <Image
            src={member.avatarUrl}
            alt={name}
            width={120}
            height={120}
            className="team-avatar"
            unoptimized
          />
        ) : (
          <div className="team-avatar team-avatar--placeholder">
            <Users className="team-avatar-icon" />
          </div>
        )}
        <div>
          <h4 className="team-name">{name}</h4>
          <div className="team-role">{roleLabel}</div>
        </div>
      </div>
      {motto && <div className="team-signature">&ldquo;{motto}&rdquo;</div>}
      {bio && <div className="team-bio">{bio}</div>}
    </div>
  );
}

// 团队成员网格组件
function TeamMemberGrid({
  members,
  isEn,
  introText,
}: {
  members: TeamMember[];
  isEn: boolean;
  introText?: string;
}) {
  if (members.length === 0) {
    return null;
  }

  let introLocale: "en" | "zh" = "zh";
  if (isEn) introLocale = "en";
  const defaultIntro = t("about.teamIntro", introLocale).replace(
    "{count}",
    members.length.toString()
  );
  const founders = members.filter((member) => member.role === "founder");
  const nonFounders = members.filter((member) => member.role !== "founder");
  const orderedMembers = [...founders, ...nonFounders];

  return (
    <>
      <p className="editorial-lede">{introText || defaultIntro}</p>
      <div className="team-grid">
        {orderedMembers.map((member) => (
          <TeamMemberCard key={member.id} member={member} isEn={isEn} />
        ))}
      </div>
    </>
  );
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const isEn = locale === "en";
  const locales = getContentLocales(locale);
  const translationLocales = locales.includes("en")
    ? locales
    : [...locales, "en"];

  // 查询 AboutSection
  const aboutModel = (prisma as unknown as { aboutSection?: { findMany: Function } })
    .aboutSection;
  const sections = aboutModel
    ? await aboutModel.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          translations: { where: { locale: { in: translationLocales } } },
        },
      })
    : [];

  // 查询 TeamMember（优雅处理表不存在的情况）
  let teamMembers: TeamMember[] = [];
  try {
    const teamModel = (prisma as unknown as { teamMember?: { findMany: Function } })
      .teamMember;
    if (teamModel) {
      teamMembers = await teamModel.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
    }
  } catch (error) {
    console.warn("TeamMember 表查询失败（可能表不存在）:", error);
    teamMembers = [];
  }

  const mappedSections: AboutSection[] = sections.map((section: any) => ({
    id: section.id,
    type: section.type,
    titleZh: section.titleZh,
    titleEn:
      section.translations.find((t: any) => t.locale === "en")?.title || null,
    contentZh: section.contentZh,
    imageUrl: section.imageUrl,
    videoUrl: section.videoUrl,
    sortOrder: section.sortOrder,
    translations: section.translations.map((t: any) => ({
      locale: t.locale,
      title: t.title,
      content: t.content,
    })),
  }));

  // 检测某个 section 是否是团队部分
  const isTeamSection = (section: AboutSection) => {
    return (
      section.titleZh.includes("团队") ||
      section.titleEn?.toLowerCase().includes("team")
    );
  };
  const anchorIdForSection = (section: AboutSection, index: number) => {
    if (isTeamSection(section)) {
      return "team";
    }
    const base =
      section.titleEn || section.titleZh || `section-${index + 1}`;
    const slug = base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug || `section-${index + 1}`;
  };

  const firstSection = mappedSections[0];
  const firstSectionAnchor = firstSection
    ? anchorIdForSection(firstSection, 0)
    : undefined;
  const firstSectionTitle = (() => {
    if (!firstSection) return null;
    const translation = pickTranslation(firstSection.translations, locales);
    const rawTitle = translation?.title || firstSection.titleZh;
    return isEn
      ? ensureEnglish(
          translation?.title || firstSection.titleEn || firstSection.titleZh,
          "About"
        )
      : rawTitle;
  })();
  const heroBreadcrumbs = [
    { label: t("about.breadcrumb", locale), href: "/about" },
    ...(firstSectionTitle
      ? [
          {
            label: firstSectionTitle,
            href: firstSectionAnchor ? `#${firstSectionAnchor}` : undefined,
          },
        ]
      : []),
  ];


  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* 页面标题区 */}
      <PageHero
        title={t("about.heroTitle", locale)}
        titleEn="Recipe Zen"
        description={
          t("about.heroDescription", locale)
        }
        icon={Users}
        breadcrumbs={heroBreadcrumbs}
        locale={locale}
      />

      {/* 自定义样式 */}
      <style>{`
        .about-shell {
          position: relative;
          isolation: isolate;
        }
        .about-glow {
          position: absolute;
          border-radius: 9999px;
          z-index: 0;
          opacity: 0.55;
          pointer-events: none;
        }
        .about-glow--top {
          width: 320px;
          height: 320px;
          top: -160px;
          right: -120px;
          background: radial-gradient(circle, rgba(232, 168, 124, 0.45), transparent 70%);
        }
        .about-glow--bottom {
          width: 360px;
          height: 360px;
          bottom: -200px;
          left: -160px;
          background: radial-gradient(circle, rgba(198, 153, 107, 0.35), transparent 70%);
        }
        .about-stack {
          position: relative;
          z-index: 1;
          display: grid;
          gap: 5rem;
        }
        .about-section {
          position: relative;
          display: grid;
          gap: 2.5rem;
          padding: 0.5rem 0;
        }
        .about-section + .about-section {
          border-top: 1px solid rgba(120, 110, 95, 0.15);
          padding-top: 3.5rem;
        }
        .about-section--intro {
          text-align: left;
          justify-items: center;
        }
        .about-section--intro .about-content {
          max-width: 1100px;
          width: min(1100px, 100%);
          margin: 0 auto;
          justify-self: center;
          text-align: left;
        }
        .about-section--media {
          align-items: center;
        }
        .about-section--team .about-content {
          max-width: 980px;
          margin: 0 auto;
        }
        .about-section--team {
          justify-items: center;
        }
        .about-section--team .editorial-heading {
          text-align: center;
          align-items: center;
        }
        .about-section--team .editorial-eyebrow {
          justify-content: center;
        }
        .about-section--team .editorial-eyebrow-line {
          max-width: 80px;
        }
        .about-section--team .editorial-title {
          text-wrap: balance;
        }
        @media (min-width: 1200px) {
          .about-section--team .editorial-title {
            white-space: nowrap;
          }
        }
        .about-media {
          position: relative;
        }
        @media (min-width: 900px) {
          .about-section--media {
            grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
          }
          .about-section--reverse .about-content {
            order: 2;
          }
          .about-section--reverse .about-media {
            order: 1;
          }
          .about-glow--top {
            width: 420px;
            height: 420px;
          }
          .about-glow--bottom {
            width: 460px;
            height: 460px;
          }
        }
        .about-section--intro .editorial-eyebrow {
          justify-content: flex-start;
        }
        .about-section--intro .editorial-title {
          text-wrap: balance;
        }
        @media (min-width: 1200px) {
          .about-section--intro .editorial-title {
            white-space: nowrap;
          }
        }
        .about-section--team .editorial-lede {
          max-width: 720px;
          margin-left: auto;
          margin-right: auto;
          text-align: center;
        }
        .about-media-frame {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.12);
          border: 1px solid rgba(197, 153, 107, 0.2);
        }
        .about-media-frame::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, rgba(255, 255, 255, 0.25), transparent 55%);
          pointer-events: none;
        }
        .about-media-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(198, 153, 107, 0.35), rgba(232, 168, 124, 0.25));
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.85rem;
        }
        .about-video {
          grid-column: 1 / -1;
          margin-top: 2rem;
        }
        .team-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1.5rem;
          max-width: 960px;
          margin: 0 auto;
          justify-content: center;
        }
        @media (max-width: 900px) {
          .team-grid {
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            max-width: 100%;
          }
        }
        .team-member {
          position: relative;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 1.5rem;
          padding: 1.75rem;
          border: 1px solid rgba(197, 153, 107, 0.2);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }
        .team-member::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, rgba(198, 153, 107, 0.9), rgba(232, 168, 124, 0.7));
        }
        .team-header {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1rem;
        }
        .team-avatar {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          object-fit: cover;
          border: 1px solid rgba(197, 153, 107, 0.3);
          background: #f1e7d8;
          flex-shrink: 0;
        }
        @media (min-width: 768px) {
          .team-avatar {
            width: 88px;
            height: 88px;
          }
        }
        .team-avatar--placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #c6996b, #e8a87c);
        }
        .team-avatar-icon {
          width: 2rem;
          height: 2rem;
          color: rgba(255, 255, 255, 0.85);
        }
        .team-name {
          font-family: var(--font-display), "Noto Serif SC", "STSong", serif;
          font-size: 1.25rem;
          color: #2f271f;
          margin: 0;
        }
        .team-role {
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 0.7rem;
          color: #8c7b69;
          margin-top: 0.25rem;
        }
        .team-signature {
          font-style: italic;
          color: #6d5c4c;
          margin: 1rem 0;
          padding-left: 1rem;
          border-left: 2px solid rgba(198, 153, 107, 0.5);
        }
        .team-bio {
          color: #4a3f35;
          line-height: 1.7;
        }
      `}</style>

      {/* 内容区 */}
      <main className="max-w-6xl mx-auto px-6 md:px-10 py-20">
        {mappedSections.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-textGray text-lg mb-4">
              {t("common.noContentYet", locale)}
            </p>
            <Link
              href="/admin/config/about"
              className="text-brownWarm hover:underline"
            >
              {t("common.goToAdmin", locale)}
            </Link>
          </div>
        ) : (
          <div className="about-shell">
            <div className="about-glow about-glow--top" />
            <div className="about-glow about-glow--bottom" />
            <div className="about-stack">
              {mappedSections.map((section, index) => {
              const anchorId = anchorIdForSection(section, index);
              const isTeam = isTeamSection(section);
              const hasMedia =
                (section.type === "image" || section.type === "mixed") &&
                section.imageUrl &&
                index !== 0;
              const sectionClasses = [
                "about-section",
                index === 0 ? "about-section--intro" : "",
                hasMedia ? "about-section--media" : "",
                index % 2 === 1 && index !== 0 ? "about-section--reverse" : "",
                isTeam ? "about-section--team" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <section
                  key={section.id}
                  id={anchorId}
                  className={sectionClasses}
                >
                  {/* 文字区域 */}
                  <div className="about-content">
                    {(() => {
                      const translation = pickTranslation(
                        section.translations,
                        locales
                      );
                      const rawTitle = translation?.title || section.titleZh;
                      const title = isEn
                        ? ensureEnglish(
                            translation?.title || section.titleEn || section.titleZh,
                            "About"
                          )
                        : rawTitle;
                      const contentHtml = isEn
                        ? translation?.content || ""
                        : translation?.content || section.contentZh;
                      const safeContentHtml = isEn
                        ? contentHtml?.trim()
                          ? contentHtml
                          : `<p>${t("common.englishComingSoon", locale)}</p>`
                        : contentHtml;

                      return (
                        <>
                          <div className="editorial-heading editorial-heading--left mb-6">
                            <div className="editorial-eyebrow editorial-eyebrow--left">
                              <span className="editorial-eyebrow-index">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <span className="editorial-eyebrow-line" />
                            </div>
                            <h2
                              className={[
                                "editorial-title",
                                index === 0 ? "editorial-title--xl" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              {title}
                            </h2>
                            {!isEn && section.titleEn && (
                              <p className="editorial-overline">{section.titleEn}</p>
                            )}
                          </div>

                          {/* 团队部分：从 TeamMember 表渲染 */}
                          {isTeam && teamMembers.length > 0 ? (
                            <TeamMemberGrid
                              members={teamMembers}
                              isEn={isEn}
                            />
                          ) : (
                            /* 其他部分：使用原有 HTML */
                            <div
                              className="prose prose-sage max-w-none editorial-prose"
                              dangerouslySetInnerHTML={{
                                __html: safeContentHtml,
                              }}
                            />
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* 图片区域 */}
                  {hasMedia && (
                    <div className="about-media">
                      <div className="relative aspect-[4/3] about-media-frame">
                        <img
                          src={section.imageUrl!}
                          alt={
                            isEn
                              ? ensureEnglish(
                                  section.titleEn || section.titleZh,
                                  "About"
                                )
                              : section.titleZh
                          }
                          className="w-full h-full object-cover"
                        />
                        {section.imageUrl!.includes("placeholder") && (
                          <div className="about-media-overlay">
                            <span>{t("common.imagePending", locale)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 视频区域 */}
                  {(section.type === "video" || section.type === "mixed") &&
                    section.videoUrl && (
                      <div className="about-video">
                        {getYouTubeId(section.videoUrl) ? (
                          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-card">
                            <iframe
                              src={`https://www.youtube.com/embed/${getYouTubeId(
                                section.videoUrl
                              )}`}
                              title={
                                isEn
                                  ? ensureEnglish(
                                      section.titleEn || section.titleZh,
                                      "About"
                                    )
                                  : section.titleZh
                              }
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
                            {t("common.videoNotSupported", locale)}
                          </video>
                        )}
                      </div>
                    )}
                </section>
              );
              })}
            </div>
          </div>
        )}

        {/* 无内容时的团队占位 */}
        {mappedSections.length === 0 && teamMembers.length > 0 && (
          <div className="mt-16">
            <h2 className="editorial-title text-center mb-8">
              {t("about.ourTeam", locale)}
            </h2>
            <TeamMemberGrid members={teamMembers} isEn={isEn} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
