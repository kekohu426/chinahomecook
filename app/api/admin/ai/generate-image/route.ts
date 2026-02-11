/**
 * 鍥剧墖鐢熸垚 API
 * POST /api/admin/ai/generate-image
 * 浣跨敤 Evolink API 鐢熸垚鍥剧墖
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { evolinkClient } from '@/lib/ai/evolink';
import { AIGenerationLogger } from '@/lib/ai/generation-logger';
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
const ImageGenSchema = z.object({
    prompt: z.string().min(1),
    size: z.enum(['1024x1024', '1024x1792', '1792x1024']).optional().default('1024x1024'),
    quality: z.enum(['standard', 'hd']).optional().default('standard'),
});

export async function POST(request: NextRequest) {
    try {
        // 鏉冮檺妫€鏌?
        const authError = await requireAdmin();
        if (authError) return authError;

        // 瑙ｆ瀽璇锋眰浣?
        const body = await request.json();
        const validation = ImageGenSchema.safeParse(body);

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

        const { prompt, size } = validation.data;

        // 瑙ｆ瀽灏哄
        const [width, height] = size.split('x').map(Number);

        console.log(`[ImageGen] 寮€濮嬬敓鎴愬浘鐗囷紝灏哄: ${width}x${height}`);
        console.log(`[ImageGen] 鎻愮ず璇? ${prompt.substring(0, 100)}...`);

        // 璋冪敤 Evolink API
        const logger = new AIGenerationLogger();
        const result = await evolinkClient.generateImage({
            prompt,
            width,
            height,
            timeoutMs: 60000, // 60绉掕秴鏃?
            logger,
            stepName: "admin_image_gen",
        });

        if (!result.success || !result.imageUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || '鍥剧墖鐢熸垚澶辫触',
                },
                { status: 500 }
            );
        }

        console.log(`[ImageGen] 鐢熸垚鎴愬姛: ${result.imageUrl}`);

        return NextResponse.json({
            success: true,
            data: {
                imageUrl: result.imageUrl,
                originalPrompt: prompt,
            },
        });
    } catch (error) {
        console.error('[ImageGen] 鐢熸垚澶辫触:', error);

        if (error instanceof Error) {
            return NextResponse.json(
                {
                    success: false,
                    error: '鍥剧墖鐢熸垚澶辫触',
                    message: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: '鍥剧墖鐢熸垚澶辫触',
                message: '鏈煡閿欒'
            },
            { status: 500 }
        );
    }
}

