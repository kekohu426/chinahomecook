/**
 * 网站全局配置 API
 *
 * GET: 获取网站配置
 * PUT: 更新网站配置
 *
 * SiteConfig 模型仅包含基本字段：siteName, siteDesc, defaultLang, supportedLangs, autoTranslate, transOnPublish
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n/config";

// 默认配置 ID
const DEFAULT_CONFIG_ID = "default";

function resolveLocale(value?: string | null): Locale {
  if (value && SUPPORTED_LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  return DEFAULT_LOCALE;
}

// GET: 获取网站配置
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = resolveLocale(searchParams.get("locale"));

    // 获取基础配置
    let config = await prisma.siteConfig.findUnique({
      where: { id: DEFAULT_CONFIG_ID },
    });

    // 如果不存在，创建默认配置
    if (!config) {
      config = await prisma.siteConfig.create({
        data: {
          id: DEFAULT_CONFIG_ID,
          siteName: { zh: "Recipe Zen", en: "Recipe Zen" },
          siteDesc: { zh: "治愈系美食研习所", en: "AI Cooking Companion" },
          defaultLang: "zh",
          supportedLangs: ["zh", "en"],
          autoTranslate: true,
          transOnPublish: true,
        },
      });
    }

    // 提取当前语言的值
    const siteName = config.siteName as Record<string, string> | null;
    const siteDesc = config.siteDesc as Record<string, string> | null;

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        siteName: siteName?.[locale] || siteName?.zh || "Recipe Zen",
        siteDesc: siteDesc?.[locale] || siteDesc?.zh || "",
        defaultLang: config.defaultLang,
        supportedLangs: config.supportedLangs,
        autoTranslate: config.autoTranslate,
        transOnPublish: config.transOnPublish,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
    });
  } catch (error) {
    console.error("获取网站配置失败:", error);
    return NextResponse.json(
      { success: false, error: "获取网站配置失败" },
      { status: 500 }
    );
  }
}

// PUT: 更新网站配置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const locale = resolveLocale(body.locale ?? searchParams.get("locale"));

    // 获取当前配置
    const currentConfig = await prisma.siteConfig.findUnique({
      where: { id: DEFAULT_CONFIG_ID },
    });

    // 构建更新数据
    const updateData: any = {};

    if (body.siteName !== undefined) {
      const currentSiteName = (currentConfig?.siteName as Record<string, string>) || {};
      updateData.siteName = { ...currentSiteName, [locale]: body.siteName };
    }

    if (body.siteDesc !== undefined) {
      const currentSiteDesc = (currentConfig?.siteDesc as Record<string, string>) || {};
      updateData.siteDesc = { ...currentSiteDesc, [locale]: body.siteDesc };
    }

    if (body.defaultLang !== undefined) {
      updateData.defaultLang = body.defaultLang;
    }

    if (body.supportedLangs !== undefined) {
      updateData.supportedLangs = body.supportedLangs;
    }

    if (body.autoTranslate !== undefined) {
      updateData.autoTranslate = body.autoTranslate;
    }

    if (body.transOnPublish !== undefined) {
      updateData.transOnPublish = body.transOnPublish;
    }

    // 更新配置
    const config = await prisma.siteConfig.upsert({
      where: { id: DEFAULT_CONFIG_ID },
      update: updateData,
      create: {
        id: DEFAULT_CONFIG_ID,
        siteName: body.siteName ? { [locale]: body.siteName } : { zh: "Recipe Zen" },
        siteDesc: body.siteDesc ? { [locale]: body.siteDesc } : {},
        defaultLang: body.defaultLang ?? "zh",
        supportedLangs: body.supportedLangs ?? ["zh", "en"],
        autoTranslate: body.autoTranslate ?? true,
        transOnPublish: body.transOnPublish ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      data: config,
      message: "网站配置更新成功",
    });
  } catch (error) {
    console.error("更新网站配置失败:", error);
    return NextResponse.json(
      { success: false, error: "更新网站配置失败" },
      { status: 500 }
    );
  }
}
