/**
 * Custom recipe task detail API
 * GET  /api/custom-recipes/tasks/[taskId]
 * POST /api/custom-recipes/tasks/[taskId] (retry)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import {
  PHASE_CONFIG,
  calculateOverallProgress,
  getImageProgressText,
  getEstimatedTime,
  type TaskStatus,
} from "@/lib/custom-recipe/phase-messages";

async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return user?.id ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { taskId } = await params;

    const task = await prisma.customRecipeTask.findFirst({
      where: {
        id: taskId,
        userId,
      },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            slug: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const acceptLanguage = request.headers.get("accept-language") || "";
    const locale: "zh" | "en" = acceptLanguage.includes("zh") ? "zh" : "en";

    const phaseInfo =
      PHASE_CONFIG[task.status as TaskStatus] || PHASE_CONFIG.pending;

    const overallProgress = calculateOverallProgress(
      task.currentPhase,
      task.phaseProgress,
      task.totalImages,
      task.imagesDone
    );

    let detailMessage = phaseInfo.detail[locale];
    if (task.status === "images_generating" && task.totalImages > 0) {
      const imageProgress = getImageProgressText(
        task.imagesDone,
        task.totalImages,
        locale
      );
      detailMessage = `${phaseInfo.detail[locale]} (${imageProgress})`;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: task.id,
        status: task.status,
        currentPhase: task.currentPhase,
        totalPhases: task.totalPhases,
        phaseProgress: task.phaseProgress,
        overallProgress,
        totalImages: task.totalImages,
        imagesDone: task.imagesDone,
        recipeName: task.recipeName,
        recipeId: task.recipeId,
        recipe: task.recipe,
        message: {
          icon: phaseInfo.icon,
          title: phaseInfo.title[locale],
          detail: detailMessage,
          estimatedRemaining: getEstimatedTime(
            task.currentPhase,
            task.totalImages,
            task.imagesDone,
            locale
          ),
        },
        errorMessage: task.errorMessage,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
      },
    });
  } catch (error) {
    console.error("Failed to query task status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to query task status" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { taskId } = await params;
    const body = await request.json();
    const { action } = body;

    if (action !== "retry") {
      return NextResponse.json(
        { success: false, error: "Unknown action" },
        { status: 400 }
      );
    }

    const task = await prisma.customRecipeTask.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    if (task.status !== "failed") {
      return NextResponse.json(
        { success: false, error: "Only failed tasks can be retried" },
        { status: 400 }
      );
    }

    await prisma.customRecipeTask.update({
      where: { id: taskId },
      data: {
        status: "pending",
        currentPhase: 0,
        phaseProgress: 0,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
      },
    });

    import("@/lib/custom-recipe/task-executor").then(
      ({ executeCustomRecipeTask }) => {
        executeCustomRecipeTask(taskId).catch(console.error);
      }
    );

    return NextResponse.json({ success: true, message: "Task retry started" });
  } catch (error) {
    console.error("Failed to operate task:", error);
    return NextResponse.json(
      { success: false, error: "Failed to operate task" },
      { status: 500 }
    );
  }
}
