/**
 * 翻译队列处理 API
 *
 * POST /api/admin/jobs/translation/process - 处理待翻译队列
 */

import { NextRequest, NextResponse } from "next/server";
import { processTranslationQueue } from "@/lib/ai/translation-job-executor";

/**
 * POST /api/admin/jobs/translation/process
 *
 * Body: { limit?: number }
 *
 * 按优先级处理待翻译队列中的任务
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = Math.min(body.limit || 10, 50); // 最大 50 个

    const processedCount = await processTranslationQueue(limit);

    return NextResponse.json({
      success: true,
      data: { processedCount },
      message: `处理了 ${processedCount} 个翻译任务`,
    });
  } catch (error) {
    console.error("处理翻译队列失败:", error);
    return NextResponse.json(
      { success: false, error: "处理翻译队列失败" },
      { status: 500 }
    );
  }
}
