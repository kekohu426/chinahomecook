/**
 * AI 生成聚合页规则 API
 *
 * POST /api/admin/collections/generate-rules
 */

import { NextRequest, NextResponse } from "next/server";
import { generateRulesFromNaturalLanguage, validateRules } from "@/lib/ai/rule-generator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userInput } = body;

    if (!userInput || typeof userInput !== "string") {
      return NextResponse.json(
        { success: false, error: "缺少 userInput 参数" },
        { status: 400 }
      );
    }

    // 获取所有可用标签
    const tagsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/admin/config/tags/available`
    );

    if (!tagsResponse.ok) {
      throw new Error("获取标签数据失败");
    }

    const tagsData = await tagsResponse.json();
    if (!tagsData.success) {
      throw new Error("获取标签数据失败");
    }

    const tags = tagsData.data;

    // 使用 AI 生成规则
    console.log("用户输入:", userInput);
    const generatedRules = await generateRulesFromNaturalLanguage(userInput, tags);
    console.log("AI 生成的规则:", JSON.stringify(generatedRules, null, 2));

    // 验证规则
    const validation = validateRules(generatedRules, tags);
    if (!validation.valid) {
      console.error("规则验证失败:", validation.errors);
      return NextResponse.json(
        {
          success: false,
          error: "AI 生成的规则无效",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // 返回生成的规则
    return NextResponse.json({
      success: true,
      data: {
        rules: generatedRules.ruleGroups,
        explanation: generatedRules.explanation,
        confidence: generatedRules.confidence,
      },
    });
  } catch (error) {
    console.error("生成规则失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "生成规则失败",
      },
      { status: 500 }
    );
  }
}
