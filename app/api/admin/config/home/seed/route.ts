import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import {
  seedHomeBrowseItems,
  seedHomeTestimonials,
  seedHomeThemes,
} from "@/lib/home/seed";

export async function POST() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await seedHomeBrowseItems();
    await seedHomeTestimonials();
    await seedHomeThemes();

    const [browseCount, testimonialCount, themeCount] = await Promise.all([
      prisma.homeBrowseItem.count(),
      prisma.homeTestimonial.count(),
      prisma.homeThemeCard.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        browseCount,
        testimonialCount,
        themeCount,
      },
    });
  } catch (error) {
    console.error("首页配置初始化失败:", error);
    return NextResponse.json(
      { success: false, error: "初始化失败" },
      { status: 500 }
    );
  }
}
