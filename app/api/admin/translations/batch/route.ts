/**
 * 批量翻译审核 API (适配新 Schema)
 *
 * POST /api/admin/translations/batch
 *
 * 支持操作：
 * - approve: 批量审核通过翻译
 * - reject: 批量审核拒绝翻译
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";

interface BatchTranslationRequest {
  action: "approve" | "reject";
  translationIds: string[];
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body: BatchTranslationRequest = await request.json();
    const { action, translationIds } = body;

    if (!translationIds || translationIds.length === 0) {
      return NextResponse.json({ success: false, error: "请选择至少一个翻译" }, { status: 400 });
    }

    const approve = action === "approve";

    const updated = await prisma.recipeTranslation.updateMany({
      where: { id: { in: translationIds } },
      data: {
        isReviewed: approve,
        reviewedAt: approve ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `已${approve ? "审核通过" : "拒绝"} ${updated.count} 个翻译`,
      data: { count: updated.count },
    });
  } catch (error) {
    console.error("批量翻译审核失败:", error);
    return NextResponse.json({ success: false, error: "批量翻译审核失败" }, { status: 500 });
  }
}
