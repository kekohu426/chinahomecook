/**
 * HomeBrowseItem 列表 API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
import { seedHomeBrowseItems } from "@/lib/home/seed";

const resolveLocale = (value?: string | null): Locale =>
  value && SUPPORTED_LOCALES.includes(value as Locale)
    ? (value as Locale)
    : DEFAULT_LOCALE;

type BrowseType = "REGION" | "CUISINE" | "INGREDIENT" | "SCENE";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = resolveLocale(searchParams.get("locale"));

    await seedHomeBrowseItems();

    const items = await prisma.homeBrowseItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        translations: locale === DEFAULT_LOCALE ? false : { where: { locale } },
      },
    });

    const data = items.map((item) => {
      const translation =
        locale === DEFAULT_LOCALE ? null : item.translations[0] || null;
      return {
        id: item.id,
        type: item.type,
        name: translation?.name || item.name,
        description: translation?.description || item.description,
        href: item.href,
        imageUrl: item.imageUrl,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("获取快捷入口失败:", error);
    return NextResponse.json(
      { success: false, error: "获取失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const locale = resolveLocale(body.locale);

    if (!body.name || !body.href || !body.type) {
      return NextResponse.json(
        { success: false, error: "名称、类型和链接为必填项" },
        { status: 400 }
      );
    }

    const created = await prisma.homeBrowseItem.create({
      data: {
        type: body.type,
        name: body.name,
        description: body.description || null,
        href: body.href,
        imageUrl: body.imageUrl || null,
        sortOrder: Number(body.sortOrder) || 0,
        isActive: body.isActive ?? true,
      },
    });

    if (locale !== DEFAULT_LOCALE) {
      await prisma.homeBrowseItemTranslation.create({
        data: {
          itemId: created.id,
          locale,
          name: body.name,
          description: body.description || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: created.id,
        type: created.type,
        name: created.name,
        description: created.description,
        href: created.href,
        imageUrl: created.imageUrl,
        sortOrder: created.sortOrder,
        isActive: created.isActive,
      },
    });
  } catch (error) {
    console.error("创建快捷入口失败:", error);
    return NextResponse.json(
      { success: false, error: "创建失败" },
      { status: 500 }
    );
  }
}
