/**
 * 定制菜谱 - 生成完整食谱 API（异步模式）
 *
 * POST /api/custom-recipes/generate - 创建定制任务并异步执行
 * 需要用户登录
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { executeCustomRecipeTask } from "@/lib/custom-recipe/task-executor";

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recipeName, customPrompt } = body;

    if (!recipeName) {
      return NextResponse.json(
        { success: false, error: "recipeName 为必填项" },
        { status: 400 }
      );
    }

    // 获取或创建用户
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {
        name: session.user.name || undefined,
      },
      create: {
        email: session.user.email,
        name: session.user.name || null,
        passwordHash: "", // OAuth 用户不需要密码
        role: "user",
      },
    });

    // 创建定制任务（关联用户）
    const task = await prisma.customRecipeTask.create({
      data: {
        userId: user.id,
        recipeName,
        userPrompt: customPrompt || "",
        status: "pending",
        currentPhase: 0,
      },
    });

    // 异步执行任务（不等待）
    executeCustomRecipeTask(task.id).catch((error) => {
      console.error(`[CustomRecipe] 任务 ${task.id} 执行失败:`, error);
    });

    // 立即返回任务ID
    return NextResponse.json({
      success: true,
      taskId: task.id,
      redirectUrl: `/custom-recipes/progress/${task.id}`,
      message: `任务已创建，正在为您制作《${recipeName}》`,
    });
  } catch (error) {
    console.error("创建定制任务失败:", error);
    return NextResponse.json(
      { success: false, error: "创建任务失败，请稍后重试" },
      { status: 500 }
    );
  }
}
