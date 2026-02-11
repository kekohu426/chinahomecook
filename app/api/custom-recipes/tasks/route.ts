/**
 * User custom recipe task list API
 * GET /api/custom-recipes/tasks
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", data: [] },
        { status: 401 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    // Logged-in OAuth users may not have a local user row yet.
    if (!currentUser) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      userId: currentUser.id,
    };

    if (status) {
      where.status = status;
    }

    const tasks = await prisma.customRecipeTask.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
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

    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      recipeName: task.recipeName,
      status: task.status,
      currentPhase: task.currentPhase,
      overallProgress: calculateProgress(task),
      totalImages: task.totalImages,
      imagesDone: task.imagesDone,
      recipeId: task.recipeId,
      recipe: task.recipe,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
    }));

    return NextResponse.json({
      success: true,
      data: formattedTasks,
    });
  } catch (error) {
    console.error("Failed to fetch custom recipe tasks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

function calculateProgress(task: {
  currentPhase: number;
  totalImages: number;
  imagesDone: number;
}): number {
  const phaseWeights: Record<number, number> = {
    0: 0,
    1: 20,
    2: 25,
    3: 35,
    4: 85,
    5: 95,
    6: 100,
  };

  if (task.currentPhase === 4 && task.totalImages > 0) {
    const base = phaseWeights[3] || 0;
    const range = (phaseWeights[4] || 85) - base;
    return Math.round(base + (range * task.imagesDone) / task.totalImages);
  }

  return phaseWeights[task.currentPhase] || 0;
}
