/**
 * LLM翻译服务
 * 将中文烹饪步骤描述转换为英文动作短语
 */

import { chat } from '../provider';

export async function translateAction(chineseDescription: string): Promise<string> {
    try {
        const systemPrompt = `You are a professional food photography expert. Your task is to convert Chinese cooking step descriptions into vivid English action phrases suitable for AI image generation prompts.

Rules:
1. Focus on the core action and main subject
2. Use specific, visual verbs (e.g., "slicing", "drizzling", "whisking", "folding")
3. Include key ingredients and tools
4. Keep it concise (8-15 words)
5. Describe what a photographer would see, not internal processes
6. Include hand actions when relevant (e.g., "a hand stirring", "hands folding dough")

Examples:
- Input: "将黄瓜切成小丁"
  Output: "hands dicing a cucumber into small cubes on a cutting board"
  
- Input: "热锅下油，倒入鸡丁滑炒至变色"
  Output: "stir-frying diced chicken in hot oil in a wok until lightly browned"
  
- Input: "将打好的奶油裱在蛋糕上"
  Output: "piping whipped cream onto a cake with a pastry bag"`;

        const response = await chat(chineseDescription, {
            systemPrompt,
            temperature: 0.7,
            maxTokens: 100,
        });

        return response.trim() || chineseDescription;
    } catch (error) {
        console.error('[Translator] Error:', error);
        // 失败时返回原文作为fallback
        return chineseDescription;
    }
}
