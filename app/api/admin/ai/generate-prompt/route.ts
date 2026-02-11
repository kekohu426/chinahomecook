/**
 * 鎻愮ず璇嶇敓鎴?API
 * POST /api/admin/ai/generate-prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { promptGenerator } from '@/lib/ai/prompt-generator';
import { z } from 'zod';

// 楠岃瘉绠＄悊鍛樻潈闄?
async function requireAdmin() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
        );
    }
    if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
            { success: false, error: '闇€瑕佺鐞嗗憳鏉冮檺' },
            { status: 403 }
        );
    }
    return null;
}

// 璇锋眰浣撻獙璇?
const RecipeStepsSchema = z.object({
    recipeName: z.string(),
    dishStyle: z.enum(['light_and_fresh', 'dark_and_moody', 'baking']).optional(),
    steps: z.array(z.object({
        number: z.number(),
        description: z.string(),
    })),
});

export async function POST(request: NextRequest) {
    try {
        // 鏉冮檺妫€鏌?
        const authError = await requireAdmin();
        if (authError) return authError;

        // 瑙ｆ瀽璇锋眰浣?
        const body = await request.json();
        const validation = RecipeStepsSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: '璇锋眰鏁版嵁鏍煎紡閿欒',
                    details: validation.error.issues
                },
                { status: 400 }
            );
        }

        const { recipeName, dishStyle, steps } = validation.data;

        console.log(`[PromptGen] Start generating prompts: ${recipeName}, ${steps.length} steps`);

        // 璋冪敤鐢熸垚鍣?
        const result = await promptGenerator.generateRecipePrompts({
            name: recipeName,
            steps,
            style: dishStyle,
        });

        console.log(`[PromptGen] 鐢熸垚瀹屾垚`);

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('[PromptGen] 鐢熸垚澶辫触:', error);
        return NextResponse.json(
            {
                success: false,
                error: "Prompt generation failed",
                message: error instanceof Error ? error.message : '鏈煡閿欒'
            },
            { status: 500 }
        );
    }
}

