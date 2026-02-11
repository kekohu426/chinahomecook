/**
 * 鑾峰彇鎵€鏈夊彲鐢ㄦ爣绛?API
 *
 * GET /api/admin/config/tags/available - 鑾峰彇鎵€鏈夋爣绛剧被鍨嬬殑鍙敤鏍囩
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";

export async function GET() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;
    // 浠?Tag 琛ㄨ幏鍙栨墍鏈夋椿璺冪殑鏍囩
    const tags = await prisma.tag.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        type: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // 鎸夌被鍨嬪垎缁勬爣绛撅紝杩斿洖瀹屾暣鐨勬爣绛惧璞★紙鍖呭惈 id 鍜?name锛?
    const tagsByType = {
      scenes: [] as Array<{ id: string; name: string; slug: string }>,
      cookingMethods: [] as Array<{ id: string; name: string; slug: string }>,
      tastes: [] as Array<{ id: string; name: string; slug: string }>,
      crowds: [] as Array<{ id: string; name: string; slug: string }>,
      occasions: [] as Array<{ id: string; name: string; slug: string }>,
    };

    tags.forEach((tag) => {
      const tagObj = { id: tag.id, name: tag.name, slug: tag.slug };
      switch (tag.type) {
        case 'scene':
          tagsByType.scenes.push(tagObj);
          break;
        case 'method':
          tagsByType.cookingMethods.push(tagObj);
          break;
        case 'taste':
          tagsByType.tastes.push(tagObj);
          break;
        case 'crowd':
          tagsByType.crowds.push(tagObj);
          break;
        case 'occasion':
          tagsByType.occasions.push(tagObj);
          break;
      }
    });

    return NextResponse.json({
      success: true,
      data: tagsByType,
    });
  } catch (error) {
    console.error("鑾峰彇鍙敤鏍囩澶辫触:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "鑾峰彇鍙敤鏍囩澶辫触",
      },
      { status: 500 }
    );
  }
}

