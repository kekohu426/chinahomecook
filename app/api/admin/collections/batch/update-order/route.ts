/**
 * 批量更新聚合页的 sortOrder 和 isFeatured
 *
 * POST /api/admin/collections/batch/update-order
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { getAggregationBlocksConfig } from "@/lib/aggregation/qualified-collections";

interface UpdateOrderItem {
  id: string;
  sortOrder: number;
}

interface UpdateOrderRequest {
  type: string;
  items: UpdateOrderItem[];
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body: UpdateOrderRequest = await request.json();
    const { type, items } = body;

    if (!type || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: "参数错误" },
        { status: 400 }
      );
    }

    // 获取区块配置，确定该类型显示多少个
    const blocksConfig = await getAggregationBlocksConfig();
    const blockConfig = blocksConfig.find((b) => b.type === type);
    const cardCount = blockConfig?.cardCount || 8;

    // 批量更新
    for (const item of items) {
      // 前 cardCount 个设为 isFeatured = true，其余为 false
      const isFeatured = item.sortOrder < cardCount;

      await prisma.collection.update({
        where: { id: item.id },
        data: {
          sortOrder: item.sortOrder,
          isFeatured,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `已更新 ${items.length} 个聚合页`,
    });
  } catch (error) {
    console.error("批量更新失败:", error);
    return NextResponse.json(
      { success: false, error: "批量更新失败" },
      { status: 500 }
    );
  }
}
