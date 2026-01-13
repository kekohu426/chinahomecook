/**
 * 首页配置 API
 *
 * GET: 获取所有首页配置
 * POST: 更新首页配置（upsert by section）
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n/config";
import { getContentLocales } from "@/lib/i18n/content";

// 默认配置值（中文）
const DEFAULT_CONFIGS: Record<string, any> = {
  hero: {
    title: "做饭，可以更简单",
    displayTitle: "做饭，可以更简单",
    seoTitle: "Recipe Zen | AI Cooking Companion",
    subtitle: "专业审校 + 智能工具，让每道家常菜都能轻松上手。",
    placeholder: "从查找食谱到完成烹饪，我们把步骤与工具都准备好",
    chips: ["团队审核把关", "智能推荐菜谱", "免费好用"],
    primaryCta: { label: "浏览全部食谱 →", href: "/recipe" },
    secondaryCta: { label: "或试试 AI定制你的专属菜谱 →", href: "/ai-custom" },
    imageFloatingText: "专业团队审核 · 步骤可复现",
    statsLabels: {
      generated: "已生成",
      recipes: "菜谱",
      collected: "已收藏",
      times: "次",
    },
  },
  stats: {
    recipesGenerated: 12580,
    recipesCollected: 3200,
    totalDownloads: 8900,
  },
  // 各模块标题
  sectionTitles: {
    quickBrowse: { title: "快速找菜", subtitle: "按菜系、地域、食材或场景浏览" },
    hotRecipes: { title: "本周精选家常菜", subtitle: "热门推荐，一键开做" },
    customRecipes: { title: "AI定制精选", subtitle: "看看别人都定制了什么" },
    coreFeatures: { title: "为什么选择 Recipe Zen" },
    tools: { title: "让做饭更轻松的智能工具", subtitle: "从烹饪模式到语音提醒，让每一步都更从容。" },
    testimonials: { title: "用户怎么说" },
    brandStory: { title: "我们的初心" },
    conversionCta: { title: "开始你的简单厨房之旅", subtitle: "无需注册，无需付费，立即浏览 1000+ 精选家常菜。" },
  },
  // 核心优势
  coreFeatures: [
    { icon: "check", title: "专业审核", description: "每道菜谱都经过人工审核，保证质量。" },
    { icon: "target", title: "步骤清晰", description: "语音+计时辅助，不怕出错，操作更顺畅。" },
    { icon: "clock", title: "节省时间", description: "3分钟找到今天要做的菜，简化决策流程。" },
    { icon: "users", title: "家庭友好", description: "家常口味，适合孩子和长辈的需求。" },
  ],
  // 智能工具
  tools: {
    cookMode: {
      title: "烹饪模式",
      features: [
        "大字体步骤显示，远距离也能看清",
        "单步骤智能计时，声音提醒不忘记",
        "语音朗读步骤，解放双手边听边做",
        "支持中英文语音朗读",
      ],
      ctaLabel: "立即体验 →",
      ctaHref: "/recipe",
    },
    toolkit: {
      title: "实用工具集",
      features: [
        "图文打印：完整步骤+配图，贴在厨房也方便",
        "语音朗读：手上有面粉也能跟着做",
        "智能计时：精准提醒，不怕错过火候",
        "背景音乐：内置轻音乐，烹饪氛围更轻松",
        "一键分享：和家人朋友一起学做菜",
      ],
      ctaLabel: "查看所有功能 →",
      ctaHref: "/recipe",
    },
  },
  // 品牌故事
  brandStory: {
    values: [
      { title: "免费", description: "让每个人都能轻松学做菜，不因价格而犹豫。" },
      { title: "治愈", description: "用一道道家常菜，温暖每个平凡的日子。" },
      { title: "用心", description: "AI 提供效率，团队保证质量，细节更安心。" },
    ],
    ctaLabel: "了解我们的故事 →",
    ctaHref: "/about",
  },
  // 转化收口区
  conversionCta: {
    title: "开始你的简单厨房之旅",
    subtitle: "无需注册，无需付费，立即浏览 1000+ 精选家常菜。",
    primaryCta: { label: "开始探索食谱 →", href: "/recipe" },
    secondaryCta: { label: "或尝试AI定制 →", href: "/ai-custom" },
  },
  // 旧的 reviews 保留兼容
  reviews: [
    { name: "小美", content: "再也不用担心不知道做什么菜了！", rating: 5 },
    { name: "阿强", content: "步骤非常详细，新手也能做出好菜", rating: 5 },
    { name: "晓晓", content: "图片太治愈了，每天都想做饭", rating: 5 },
  ],
};

// 英文默认配置
const DEFAULT_CONFIGS_EN: Record<string, any> = {
  hero: {
    title: "Cooking can be simpler",
    displayTitle: "Cooking can be simpler",
    seoTitle: "Recipe Zen | AI Cooking Companion",
    subtitle: "Expert-reviewed + smart tools, every home dish made easy.",
    placeholder: "What to cook, how to cook, and what you need—Recipe Zen prepares it all.",
    chips: ["Expert reviewed", "Smart recommendations", "Free to use"],
    primaryCta: { label: "Browse All Recipes →", href: "/recipe" },
    secondaryCta: { label: "Or try AI Custom →", href: "/ai-custom" },
    imageFloatingText: "Expert-reviewed · Repeatable steps",
    statsLabels: {
      generated: "Generated",
      recipes: "recipes",
      collected: "Collected",
      times: "times",
    },
  },
  sectionTitles: {
    quickBrowse: { title: "Quick Browse", subtitle: "By cuisine, region, ingredient, or scene" },
    hotRecipes: { title: "Weekly Picks", subtitle: "Trending recipes, one-click start" },
    customRecipes: { title: "AI Custom Gallery", subtitle: "See what others have created" },
    coreFeatures: { title: "Why Choose Recipe Zen" },
    tools: { title: "Smart tools for easier cooking", subtitle: "Cook mode to voice reminders, every step is calmer." },
    testimonials: { title: "What Users Say" },
    brandStory: { title: "Our Belief" },
    conversionCta: { title: "Start Your Simple Kitchen Journey", subtitle: "No registration, no fees. Browse 1000+ curated home recipes now." },
  },
  coreFeatures: [
    { icon: "check", title: "Expert Reviewed", description: "Every recipe is manually reviewed for quality." },
    { icon: "target", title: "Clear Steps", description: "Voice + timers so you never miss a beat." },
    { icon: "clock", title: "Save Time", description: "Find the right dish in 3 minutes." },
    { icon: "users", title: "Family Friendly", description: "Home-style flavors for kids and seniors." },
  ],
  tools: {
    cookMode: {
      title: "Cook Mode",
      features: [
        "Large steps for easy viewing",
        "Step timers with alerts",
        "Voice guidance, hands-free",
        "Chinese + English voice",
      ],
      ctaLabel: "Try it now →",
      ctaHref: "/recipe",
    },
    toolkit: {
      title: "Utility Toolkit",
      features: [
        "Print-friendly steps + photos",
        "Voice playback for busy hands",
        "Smart timers and reminders",
        "Built-in music for vibe",
        "Share with family and friends",
      ],
      ctaLabel: "See all features →",
      ctaHref: "/recipe",
    },
  },
  brandStory: {
    values: [
      { title: "Free", description: "Great tools should be accessible to everyone." },
      { title: "Healing", description: "Warm meals for everyday moments." },
      { title: "Careful", description: "AI efficiency plus expert review for trust." },
    ],
    ctaLabel: "Learn our story →",
    ctaHref: "/about",
  },
  conversionCta: {
    title: "Start Your Simple Kitchen Journey",
    subtitle: "No registration, no fees. Browse 1000+ curated home recipes now.",
    primaryCta: { label: "Start Exploring Recipes →", href: "/recipe" },
    secondaryCta: { label: "Or Try AI Custom →", href: "/ai-custom" },
  },
};

function resolveLocale(value?: string | null): Locale {
  if (value && SUPPORTED_LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  return DEFAULT_LOCALE;
}

// 根据 locale 获取默认配置
function getDefaultConfig(section: string, locale: Locale) {
  if (locale === "en" && DEFAULT_CONFIGS_EN[section]) {
    return DEFAULT_CONFIGS_EN[section];
  }
  return DEFAULT_CONFIGS[section];
}

// 获取所有默认配置
function getAllDefaultConfigs(locale: Locale) {
  if (locale === "en") {
    return { ...DEFAULT_CONFIGS, ...DEFAULT_CONFIGS_EN };
  }
  return DEFAULT_CONFIGS;
}

function mergeConfig(base: any, override: any) {
  if (!override) return base;
  if (
    base &&
    override &&
    typeof base === "object" &&
    typeof override === "object" &&
    !Array.isArray(base) &&
    !Array.isArray(override)
  ) {
    return { ...base, ...override };
  }
  return override;
}

// GET: 获取所有首页配置
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section") || searchParams.get("key"); // 支持旧参数
    const locale = resolveLocale(searchParams.get("locale"));
    const locales = getContentLocales(locale);

    if (section) {
      // 获取单个配置（按 section）
      const config = await prisma.homeConfig.findFirst({
        where: { section },
        include: { translations: true },
      });

      // 获取该 section 的默认值（根据语言）
      const defaultValue = getDefaultConfig(section, locale);

      if (locale !== DEFAULT_LOCALE && config) {
        const translation = locales
          .map((loc) => config.translations.find((t) => t.locale === loc))
          .find(Boolean);

        // 优先用翻译，否则用数据库配置，最后用语言对应的默认值
        const merged = mergeConfig(
          config.content ?? defaultValue ?? null,
          translation?.content
        );
        return NextResponse.json({
          success: true,
          data: merged,
        });
      }

      return NextResponse.json({
        success: true,
        data: config?.content ?? defaultValue ?? null,
      });
    }

    // 获取所有配置
    const configs = await prisma.homeConfig.findMany({
      include: { translations: true },
    });

    // 合并默认配置和数据库配置（根据语言选择默认值）
    const allDefaults = getAllDefaultConfigs(locale);
    const result: Record<string, any> = { ...allDefaults };

    for (const config of configs) {
      result[config.section] = config.content;
    }

    if (locale !== DEFAULT_LOCALE) {
      const localized: Record<string, any> = {};

      for (const sectionKey of Object.keys(result)) {
        const config = configs.find((c) => c.section === sectionKey);
        if (config) {
          const translation = locales
            .map((loc) => config.translations.find((t) => t.locale === loc))
            .find(Boolean);
          localized[sectionKey] = mergeConfig(result[sectionKey], translation?.content);
        } else {
          localized[sectionKey] = result[sectionKey];
        }
      }

      return NextResponse.json({
        success: true,
        data: localized,
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("获取首页配置失败:", error);
    return NextResponse.json(
      { success: false, error: "获取首页配置失败" },
      { status: 500 }
    );
  }
}

// POST: 更新首页配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const section = body.section || body.key; // 支持旧参数
    const content = body.content ?? body.value; // 支持旧参数
    const { searchParams } = new URL(request.url);
    const locale = resolveLocale(body.locale ?? searchParams.get("locale"));

    if (!section || content === undefined) {
      return NextResponse.json(
        { success: false, error: "section 和 content 都是必填项" },
        { status: 400 }
      );
    }

    // 先确保主配置存在
    let config = await prisma.homeConfig.findFirst({
      where: { section },
    });

    if (!config) {
      config = await prisma.homeConfig.create({
        data: {
          section,
          content: locale === DEFAULT_LOCALE ? content : {},
        },
      });
    }

    if (locale !== DEFAULT_LOCALE) {
      // 更新翻译
      const translation = await prisma.homeConfigTranslation.upsert({
        where: { configId_locale: { configId: config.id, locale } },
        update: { content },
        create: { configId: config.id, locale, content },
      });
      return NextResponse.json({
        success: true,
        data: translation,
      });
    }

    // 更新主配置
    const updated = await prisma.homeConfig.update({
      where: { id: config.id },
      data: { content },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("更新首页配置失败:", error);
    return NextResponse.json(
      { success: false, error: "更新首页配置失败" },
      { status: 500 }
    );
  }
}
