/**
 * Single AI prompt API
 *
 * GET    /api/admin/config/ai/prompts/[key]
 * PUT    /api/admin/config/ai/prompts/[key]
 * DELETE /api/admin/config/ai/prompts/[key]
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getPromptConfig,
  savePromptConfig,
  resetPromptConfig,
} from "@/lib/ai/prompt-manager";
import { getDefaultPrompt } from "@/lib/ai/default-prompts";

interface RouteContext {
  params: Promise<{ key: string }>;
}

async function requireAdmin() {
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

  return null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { key } = await context.params;
    const config = await getPromptConfig(key);

    if (!config) {
      return NextResponse.json(
        { success: false, error: { message: "Prompt not found" } },
        { status: 404 }
      );
    }

    const defaultPrompt = getDefaultPrompt(key);

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        defaultPrompt: defaultPrompt?.prompt,
        defaultSystemPrompt: defaultPrompt?.systemPrompt,
      },
    });
  } catch (error) {
    console.error("Failed to get prompt:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : "Failed to get prompt" },
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { key } = await context.params;
    const body = await request.json();
    const { prompt, systemPrompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { success: false, error: { message: "Prompt content cannot be empty" } },
        { status: 400 }
      );
    }

    const config = await savePromptConfig(key, {
      prompt,
      systemPrompt: systemPrompt || null,
    });

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Failed to update prompt:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Failed to update prompt",
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { key } = await context.params;
    const config = await resetPromptConfig(key);

    return NextResponse.json({
      success: true,
      data: config,
      message: "Prompt reset to default",
    });
  } catch (error) {
    console.error("Failed to reset prompt:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Failed to reset prompt",
        },
      },
      { status: 500 }
    );
  }
}
