/**
 * 一级聚合页区块配置 API
 *
 * GET  /api/admin/aggregation/blocks - 获取区块配置
 * PUT  /api/admin/aggregation/blocks - 更新区块配置
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getAggregationBlocksConfig,
  saveAggregationBlocksConfig,
  type AggregationBlockConfig,
} from "@/lib/aggregation/qualified-collections";

/**
 * GET /api/admin/aggregation/blocks
 * 获取区块配置
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "需要管理员权限" } },
        { status: 401 }
      );
    }

    const blocks = await getAggregationBlocksConfig();

    return NextResponse.json({
      success: true,
      data: blocks,
    });
  } catch (error) {
    console.error("获取区块配置失败:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "获取区块配置失败" } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/aggregation/blocks
 * 更新区块配置
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "需要管理员权限" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { blocks } = body as { blocks: AggregationBlockConfig[] };

    if (!blocks || !Array.isArray(blocks)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "blocks 必须是数组" } },
        { status: 400 }
      );
    }

    // 验证区块配置
    for (const block of blocks) {
      if (!block.type || typeof block.enabled !== "boolean" || typeof block.order !== "number") {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "区块配置格式错误" } },
          { status: 400 }
        );
      }
    }

    await saveAggregationBlocksConfig(blocks);

    return NextResponse.json({
      success: true,
      message: "区块配置已更新",
      data: blocks,
    });
  } catch (error) {
    console.error("更新区块配置失败:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "更新区块配置失败" } },
      { status: 500 }
    );
  }
}
