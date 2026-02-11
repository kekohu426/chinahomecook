/**
 * AI prompt list API
 * GET /api/admin/config/ai/prompts
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllPromptConfigs } from "@/lib/ai/prompt-manager";
import { CATEGORY_LABELS } from "@/lib/ai/default-prompts";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: "Please login first" } },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { message: "Admin permission required" } },
        { status: 403 }
      );
    }

    const prompts = await getAllPromptConfigs();

    const grouped: Record<string, typeof prompts> = {};
    for (const prompt of prompts) {
      if (!grouped[prompt.category]) {
        grouped[prompt.category] = [];
      }
      grouped[prompt.category].push(prompt);
    }

    return NextResponse.json({
      success: true,
      data: {
        prompts,
        grouped,
        categoryLabels: CATEGORY_LABELS,
      },
    });
  } catch (error) {
    console.error("Failed to get prompt list:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to get prompt list",
        },
      },
      { status: 500 }
    );
  }
}
