/**
 * 图片生成任务列表 API
 * GET  - 获取任务列表
 * POST - 创建新任务
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";

// GET /api/admin/ai/image-tasks
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where = status ? { status } : {};

    const [tasks, total] = await Promise.all([
      prisma.imageGenTask.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          recipe: {
            select: { id: true, slug: true },
          },
        },
      }),
      prisma.imageGenTask.count({ where }),
    ]);

    return NextResponse.json({ tasks, total });
  } catch (error) {
    console.error("获取任务列表失败:", error);
    return NextResponse.json(
      { error: "获取任务列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/admin/ai/image-tasks
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const {
      recipeName,
      dishStyle = "dark_and_moody",
      steps = [],
      recipeId,
    } = body;

    if (!recipeName) {
      return NextResponse.json(
        { error: "缺少必填字段: recipeName" },
        { status: 400 }
      );
    }

    if (steps.length === 0) {
      return NextResponse.json(
        { error: "需要提供 steps 步骤数组" },
        { status: 400 }
      );
    }

    // 成品图现在由 AI 在生成步骤图时一并生成（step 0），不再需要单独传入 imageShots
    const task = await prisma.imageGenTask.create({
      data: {
        recipeName,
        dishStyle,
        steps,
        totalSteps: steps.length,
        totalShots: 1, // 固定为 1 张 cover
        recipeId: recipeId || null,
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("创建任务失败:", error);
    return NextResponse.json(
      { error: "创建任务失败" },
      { status: 500 }
    );
  }
}
