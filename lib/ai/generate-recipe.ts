/**
 * AI生成菜谱服务
 *
 * 使用GLM生成符合PRD Schema v1.1.0的完整菜谱JSON
 */

import { getTextProvider } from "./provider";
import { safeValidateRecipe } from "../validators/recipe";
import type { Recipe } from "@/types/recipe";

/**
 * 生成菜谱的提示词模板
 */
function buildRecipePrompt(params: {
  dishName: string;
  location?: string;
  cuisine?: string;
  mainIngredients?: string[];
}): string {
  const { dishName, location, cuisine, mainIngredients } = params;

  return `你是一位专业的美食文化研究者和菜谱编写专家。请为"${dishName}"生成一份完整的菜谱数据，严格遵循以下JSON格式。

${location ? `地点：${location}\n` : ""}${cuisine ? `菜系：${cuisine}\n` : ""}${mainIngredients && mainIngredients.length > 0 ? `主要食材：${mainIngredients.join("、")}\n` : ""}
**重要要求：**
1. 必须输出纯JSON格式，不要包含任何markdown标记（如\`\`\`json）
2. JSON中不能包含注释（// 或 /* */）
3. JSON中不能有trailing comma（最后一个元素后的逗号）
4. 字符串中的引号必须用反斜杠转义（\\"）
5. 严格遵循Schema v1.1.0结构
6. 治愈系文案风格（healingTone）要温暖、细腻
7. 步骤要详细、清晰，包含视觉检查和失败点提示
8. 所有字段都必须填写，不能为空
9. 如果数量只能写“适量/少许”，请使用 amount=1，unit="适量"或"少许"

**JSON Schema（必须严格遵循）：**

\`\`\`json
{
  "schemaVersion": "1.1.0",
  "titleZh": "菜名（中文）",
  "titleEn": "Dish Name（英文，可选）",
  "summary": {
    "oneLine": "一句话精炼描述（15字以内）",
    "healingTone": "治愈系文案（30字以内，温暖细腻）",
    "difficulty": "easy | medium | hard",
    "timeTotalMin": 总耗时（分钟数字）,
    "timeActiveMin": 操作时间（分钟数字）,
    "servings": 份量（人数）
  },
  "story": {
    "title": "文化故事标题",
    "content": "200-300字的文化故事，讲述这道菜的由来、文化背景、地域特色",
    "tags": ["标签1", "标签2", "标签3"]
  },
  "ingredients": [
    {
      "section": "主料",
      "items": [
        {
          "name": "食材名称",
          "iconKey": "meat | veg | fruit | seafood | grain | bean | dairy | egg | spice | sauce | oil | other",
          "amount": 数量（必须是数字，不能用分数如1/2，应该用小数0.5）,
          "unit": "克 | 毫升 | 个 | 只 | 片 | 勺 | 适量",
          "notes": "备注（可选）"
        }
      ]
    },
    {
      "section": "配料",
      "items": [...]
    }
  ],
  "steps": [
    {
      "id": "step01",
      "title": "步骤标题（5-8字）",
      "action": "详细操作描述（80-150字）",
      "speechText": "语音朗读文本（口语化）",
      "timerSec": 计时秒数（0表示无需计时）,
      "visualCue": "视觉检查要点（如何判断完成）",
      "failPoint": "常见失败点和注意事项",
      "photoBrief": "配图说明（描述应该拍摄的画面）"
    }
  ],
  "styleGuide": {
    "theme": "治愈系主题（如：家常温馨、复古怀旧、现代简约）",
    "lighting": "光线风格（如：自然柔和、暖色调、明亮清新）",
    "composition": "构图建议（如：俯拍全景、45度特写、侧面展示）",
    "aesthetic": "美学要求（如：自然真实、精致文艺、烟火气息）"
  },
  "imageShots": [
    {
      "key": "hero",
      "imagePrompt": "Highest quality food photography, professional Michelin star plating, 8k resolution, cinematic lighting, soft focus background, delicious appetizing [Dish Name]",
      "ratio": "16:9 | 4:3 | 3:2"
    },
    {
      "key": "step01",
      "imagePrompt": "Close-up action shot of cooking step, high quality food photography, bright lighting, sharp details, photorealistic, 4k, [Specific action description]",
      "ratio": "4:3"
    }
  ]
}
```

**图片提示词特别要求：**
1. 必须是用英文书写。
2. 必须包含"food photography", "high resolution", "photorealistic", "cinematic lighting"等高质量关键词。
3. 步骤图必须详细描述该步骤的具体动作和画面（如"slicing beef thinly", "frying garlic in oil"），不能只写"Step 1"。
4. 确保`imageShots`中的`key`与`steps`中的`id`完全一致（如都使用"step01", "step02"）。

**现在请为"${dishName}"生成完整的菜谱JSON数据：**
（请直接输出JSON，不要包含任何markdown代码块标记）`;
}

/**
 * 清理AI返回的JSON字符串
 */
export function cleanAIResponse(response: string): string {
  // 移除markdown代码块标记
  let cleaned = response.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");
  cleaned = cleaned.trim();

  // 移除JSON前后可能的多余文字
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');

  if (jsonStart >= 0 && jsonEnd >= 0 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  // 移除可能的注释（// 或 /* */）
  cleaned = cleaned.replace(/\/\/.*$/gm, '');  // 单行注释
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, ''); // 多行注释

  // 移除trailing commas（JSON不允许）
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

  // 修复常见的数学表达式（AI经常生成 1/2, 1/3 等）
  // 将 "amount": 1/2 转换为 "amount": 0.5
  cleaned = cleaned.replace(/"amount":\s*1\/2/g, '"amount": 0.5');
  cleaned = cleaned.replace(/"amount":\s*1\/3/g, '"amount": 0.33');
  cleaned = cleaned.replace(/"amount":\s*2\/3/g, '"amount": 0.67');
  cleaned = cleaned.replace(/"amount":\s*1\/4/g, '"amount": 0.25');
  cleaned = cleaned.replace(/"amount":\s*3\/4/g, '"amount": 0.75');
  cleaned = cleaned.replace(/"amount":\s*(\d+)\/(\d+)/g, (match, num, denom) => {
    return `"amount": ${parseFloat(num) / parseFloat(denom)}`;
  });

  // 修复未加引号的字符串字段（amount/unit/notes）
  cleaned = cleaned.replace(
    /"(amount|unit|notes)"\s*:\s*([^\d"{}\[\]-][^,\n}]*)/g,
    (match, key, rawValue) => {
      const value = String(rawValue).trim();
      if (value === "null") {
        return `"${key}": null`;
      }
      return `"${key}": "${value.replace(/"/g, '\\"')}"`;
    }
  );

  return cleaned.trim();
}

/**
 * 标准化AI生成的数据
 * 将字符串类型的数字转换为数字类型
 */
export function normalizeRecipeData(data: any): any {
  if (!data) return data;

  // 转换 summary 中的数字字段
  if (data.summary) {
    if (typeof data.summary.timeTotalMin === 'string') {
      data.summary.timeTotalMin = parseInt(data.summary.timeTotalMin, 10);
    }
    if (typeof data.summary.timeActiveMin === 'string') {
      data.summary.timeActiveMin = parseInt(data.summary.timeActiveMin, 10);
    }
    if (typeof data.summary.servings === 'string') {
      data.summary.servings = parseInt(data.summary.servings, 10);
    }
  }

  // 转换 ingredients 中的 amount 字段
  if (data.ingredients && Array.isArray(data.ingredients)) {
    data.ingredients.forEach((section: any) => {
      if (section.items && Array.isArray(section.items)) {
        section.items.forEach((item: any) => {
          if (typeof item.amount === 'string') {
            const numeric = parseFloat(item.amount);
            if (Number.isNaN(numeric)) {
              const amountLabel = item.amount.trim();
              item.amount = 1;
              if (!item.unit || String(item.unit).trim().length === 0) {
                item.unit = amountLabel;
              }
            } else {
              item.amount = numeric;
            }
          }
        });
      }
    });
  }

  // 转换 steps 中的 timerSec 字段
  if (data.steps && Array.isArray(data.steps)) {
    data.steps.forEach((step: any) => {
      if (typeof step.timerSec === 'string') {
        step.timerSec = parseInt(step.timerSec, 10);
      }
    });
  }

  return data;
}

/**
 * 生成单个菜谱
 */
export async function generateRecipe(params: {
  dishName: string;
  location?: string;
  cuisine?: string;
  mainIngredients?: string[];
}): Promise<{ success: true; data: Recipe } | { success: false; error: string }> {
  try {
    const provider = getTextProvider();

    // 构建提示词
    const prompt = buildRecipePrompt(params);

    // 调用AI生成
    const response = await provider.chat({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      maxTokens: 6000,
    });

    // 清理响应
    const cleanedContent = cleanAIResponse(response.content);

    // 解析JSON
    let recipeData: any;
    try {
      recipeData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("JSON解析失败:", parseError);
      console.error("原始内容（前500字符）:", response.content.substring(0, 500));
      console.error("清理后内容（前500字符）:", cleanedContent.substring(0, 500));

      // 尝试找到错误位置
      if (parseError instanceof SyntaxError && parseError.message.includes('position')) {
        const match = parseError.message.match(/position (\d+)/);
        if (match) {
          const pos = parseInt(match[1]);
          const context = cleanedContent.substring(Math.max(0, pos - 50), Math.min(cleanedContent.length, pos + 50));
          console.error("错误位置上下文:", context);
        }
      }

      return {
        success: false,
        error: `JSON解析失败：${parseError instanceof Error ? parseError.message : String(parseError)}`,
      };
    }

    // 标准化数据（转换字符串数字为数字类型）
    recipeData = normalizeRecipeData(recipeData);

    // 验证格式
    const validation = safeValidateRecipe(recipeData);

    if (!validation.success) {
      console.error("Schema验证失败:", validation.error.issues);
      return {
        success: false,
        error: `Schema验证失败：${validation.error.issues.map((i) => i.message).join(", ")}`,
      };
    }

    return {
      success: true,
      data: validation.data,
    };
  } catch (error) {
    console.error("生成菜谱失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 批量生成菜谱
 */
export async function generateRecipesBatch(
  dishNames: string[],
  options?: {
    location?: string;
    cuisine?: string;
    onProgress?: (current: number, total: number, dishName: string) => void;
  }
): Promise<{
  success: number;
  failed: number;
  results: Array<{
    dishName: string;
    success: boolean;
    data?: Recipe;
    error?: string;
  }>;
}> {
  const results: Array<{
    dishName: string;
    success: boolean;
    data?: Recipe;
    error?: string;
  }> = [];

  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < dishNames.length; i++) {
    const dishName = dishNames[i];

    // 触发进度回调
    if (options?.onProgress) {
      options.onProgress(i + 1, dishNames.length, dishName);
    }

    // 生成单个菜谱
    const result = await generateRecipe({
      dishName,
      location: options?.location,
      cuisine: options?.cuisine,
    });

    if (result.success) {
      successCount++;
      results.push({
        dishName,
        success: true,
        data: result.data,
      });
    } else {
      failedCount++;
      results.push({
        dishName,
        success: false,
        error: result.error,
      });
    }

    // 避免API限流，每次请求间隔1秒
    if (i < dishNames.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return {
    success: successCount,
    failed: failedCount,
    results,
  };
}
