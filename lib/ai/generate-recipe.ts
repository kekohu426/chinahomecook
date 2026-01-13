/**
 * AI生成菜谱服务
 *
 * 使用GLM生成符合PRD Schema v2.0.0的完整菜谱JSON
 */

import { getTextProvider } from "./provider";
import { safeValidateRecipe } from "../validators/recipe";
import type { Recipe } from "@/types/recipe";

/**
 * 生成菜谱的提示词模板 - Schema v2.0.0
 */
function buildRecipePrompt(params: {
  dishName: string;
  location?: string;
  cuisine?: string;
  mainIngredients?: string[];
}): string {
  const { dishName, location, cuisine, mainIngredients } = params;

  const constraints = [
    location ? `地域：${location}` : null,
    cuisine ? `菜系：${cuisine}` : null,
    mainIngredients?.length ? `主要食材：${mainIngredients.join("、")}` : null,
  ].filter(Boolean).join("\n");

  return `你是"Recipe Zen 治愈系菜谱内容生成器"。根据菜名生成完整的菜谱JSON数据。

${constraints ? `【约束条件】\n${constraints}\n` : ""}
【核心要求】
1. 输出严格UTF-8 JSON，不要markdown代码块
2. 中文为主，英文名为辅
3. 步骤必须包含：动作、火候(heat)、时间范围(timeMin/timeMax)、视觉信号(visualCue)、失败点(failurePoints数组)、补救方法(recovery)
4. 图片提示词(imagePrompt)必须用英文，包含"no text, no watermark"
5. 成品图3张：cover_main(俯拍)、cover_detail(侧面特写)、cover_inside(内部展示)
6. 每张图必须有negativePrompt排除AI痕迹
7. culturalStory写150-250字的文化故事
8. nutrition包含卡路里、蛋白质、脂肪、碳水、钠
9. faq至少3个常见问题
10. 时间、温度、份量要符合实际

【JSON Schema v2.0.0】
{
  "schemaVersion": "2.0.0",
  "titleZh": "中文菜名",
  "titleEn": "English Name",
  "aliases": ["别名数组"],
  "origin": { "country": "国家", "region": "地区/菜系", "notes": "说明" },
  "summary": {
    "oneLine": "一句话描述(50字内)",
    "healingTone": "治愈系文案(80字内)",
    "flavorTags": ["风味标签"],
    "difficulty": "easy|medium|hard",
    "servings": 2,
    "timeTotalMin": 30,
    "timeActiveMin": 20,
    "scaleHint": "缩放说明"
  },
  "culturalStory": "150-250字文化故事",
  "nutrition": {
    "perServing": { "calories": 245, "protein": 38, "fat": 9, "carbs": 3, "sodium": 680 },
    "dietaryLabels": ["低卡", "高蛋白"],
    "disclaimer": "营养数据为估算值"
  },
  "equipment": [{ "name": "设备名", "required": true, "notes": "说明" }],
  "ingredients": [{
    "section": "主料",
    "items": [{
      "name": "食材名",
      "iconKey": "meat|veg|seafood|egg|spice|sauce|grain|other",
      "amount": 100,
      "unit": "g",
      "prep": "切丁",
      "optional": false,
      "substitutes": ["替代品"],
      "allergens": ["过敏原"],
      "notes": "备注"
    }]
  }],
  "steps": [{
    "id": "step01",
    "title": "步骤标题",
    "action": "详细动作描述",
    "heat": "low|medium-low|medium|medium-high|high",
    "timeMin": 5,
    "timeMax": 8,
    "timerSec": 300,
    "visualCue": "视觉信号",
    "statusChecks": ["检查标准1", "检查标准2"],
    "failurePoints": ["失败点1", "失败点2"],
    "recovery": "补救方法",
    "safeNote": "食品安全提示",
    "photoBrief": "拍照要点",
    "imagePrompt": "English prompt for AI image, natural light, warm tones, no text, no watermark",
    "negativePrompt": "AI generated, plastic, unnatural, cartoon, 3D render, text, watermark",
    "ingredientRefs": ["关联食材"],
    "equipmentRefs": ["关联设备"]
  }],
  "faq": [{ "question": "问题", "answer": "回答(50-100字)" }],
  "tips": ["烹饪小贴士"],
  "troubleshooting": [{ "problem": "问题", "cause": "原因", "fix": "解决方法" }],
  "relatedRecipes": { "similar": ["同类菜品ID"], "pairing": ["搭配菜谱ID"] },
  "pairing": { "suggestions": ["搭配建议"], "sauceOrSide": ["酱料或配菜"] },
  "styleGuide": {
    "visualTheme": "治愈系暖调留白自然质感",
    "palette": ["燕麦米", "奶油白", "陶土棕"],
    "lighting": "柔和侧光/窗边自然光",
    "materials": ["原木托盘", "亚麻布", "陶瓷小碟"],
    "props": ["木勺", "小碗装香料"],
    "compositionRules": ["留白充足", "主体占比60-70%"],
    "imageRatios": { "cover": "16:9", "step": "4:3", "ingredientsFlatlay": "3:2" }
  },
  "imageShots": [
    {
      "key": "cover_main",
      "title": "成品俯拍全景",
      "ratio": "16:9",
      "imagePrompt": "Real food photography, top-down view, [dish description], natural light, warm tones, wooden table, white ceramic plate, steam rising, shallow depth of field, no text, no watermark, high detail",
      "negativePrompt": "AI generated, plastic texture, unnatural lighting, oversaturated, cartoon style, 3D render, text, watermark, logo"
    },
    {
      "key": "cover_detail",
      "title": "成品侧面特写",
      "ratio": "16:9",
      "imagePrompt": "Real food close-up photography, 45 degree angle, [dish detail], shallow depth of field f/2.8, natural light from window, texture visible, no text, no watermark",
      "negativePrompt": "AI generated, fake texture, unnatural shadows, oversaturated, cartoon, 3D render, text, watermark"
    },
    {
      "key": "cover_inside",
      "title": "内部展示",
      "ratio": "16:9",
      "imagePrompt": "Real food interior shot, [cut open or split to show inside], steam rising, texture visible, natural light, shallow depth of field, no text, no watermark",
      "negativePrompt": "AI generated, plastic food, fake steam, unnatural, cartoon, 3D render, text, watermark"
    }
  ],
  "seo": {
    "slug": "dish-name-recipe",
    "metaTitle": "菜名的做法 | 简单家常做法",
    "metaDescription": "150字内的SEO描述",
    "keywords": ["关键词1", "关键词2"]
  },
  "notes": ["备注信息"]
}

【One-Shot 示例】
{
  "schemaVersion": "2.0.0",
  "titleZh": "番茄炒蛋",
  "titleEn": "Tomato and Egg Stir-Fry",
  "aliases": ["西红柿炒鸡蛋"],
  "origin": { "country": "中国", "region": "家常菜", "notes": "全国流行" },
  "summary": {
    "oneLine": "酸甜交织的家常温暖，唤醒儿时记忆。",
    "healingTone": "温柔治愈，像母亲的拥抱般温暖。简单的食材，承载着最深的眷恋。",
    "flavorTags": ["酸甜", "鲜嫩", "家常"],
    "difficulty": "easy",
    "servings": 2,
    "timeTotalMin": 15,
    "timeActiveMin": 10,
    "scaleHint": "按人数等比例增减"
  },
  "culturalStory": "在广袤的中国大地上，番茄炒蛋如一缕阳光，洒进无数寻常百姓的餐桌。这道菜不需华丽调味，却能慰藉游子心魂。酸甜的番茄遇上金黄的鸡蛋，碰撞出最朴实的美味。无论身在何方，一口熟悉的味道，便能唤醒内心深处的温暖与满足。",
  "nutrition": {
    "perServing": { "calories": 180, "protein": 12, "fat": 10, "carbs": 8, "sodium": 450 },
    "dietaryLabels": ["高蛋白", "低卡"],
    "disclaimer": "营养数据基于标准食材用量估算"
  },
  "equipment": [
    { "name": "炒锅", "required": true, "notes": "不粘锅更易操作" },
    { "name": "锅铲", "required": true, "notes": null }
  ],
  "ingredients": [
    {
      "section": "主料",
      "items": [
        { "name": "番茄", "iconKey": "veg", "amount": 3, "unit": "个", "prep": "切块", "optional": false, "substitutes": [], "allergens": [], "notes": "选熟透的" },
        { "name": "鸡蛋", "iconKey": "egg", "amount": 4, "unit": "个", "prep": "打散", "optional": false, "substitutes": [], "allergens": ["蛋类"], "notes": null }
      ]
    },
    {
      "section": "调味料",
      "items": [
        { "name": "盐", "iconKey": "spice", "amount": 3, "unit": "g", "prep": null, "optional": false, "substitutes": [], "allergens": [], "notes": null },
        { "name": "糖", "iconKey": "spice", "amount": 5, "unit": "g", "prep": null, "optional": false, "substitutes": [], "allergens": [], "notes": "平衡酸味" }
      ]
    }
  ],
  "steps": [
    {
      "id": "step01",
      "title": "准备食材",
      "action": "番茄洗净切成小块，鸡蛋打入碗中加少许盐搅拌均匀至起泡。",
      "heat": "low",
      "timeMin": 3,
      "timeMax": 5,
      "timerSec": 0,
      "visualCue": "蛋液呈均匀金黄色，番茄块鲜红多汁",
      "statusChecks": ["蛋液无蛋清块", "番茄切块均匀"],
      "failurePoints": ["蛋液搅拌不匀导致炒蛋不嫩滑"],
      "recovery": "继续搅拌至均匀即可",
      "safeNote": null,
      "photoBrief": "切好的番茄与打散的蛋液特写",
      "imagePrompt": "Fresh tomato chunks and beaten eggs in bowl, natural light, warm tones, wooden cutting board, shallow depth of field, no text, no watermark",
      "negativePrompt": "AI generated, plastic, unnatural colors, cartoon, 3D render, text, watermark",
      "ingredientRefs": ["番茄", "鸡蛋"],
      "equipmentRefs": []
    },
    {
      "id": "step02",
      "title": "炒蛋",
      "action": "热锅倒入1汤匙油，中火加热至油温7成热，倒入蛋液快速翻炒至凝固成块，盛出备用。",
      "heat": "medium",
      "timeMin": 1,
      "timeMax": 2,
      "timerSec": 60,
      "visualCue": "蛋块金黄松软，不粘锅底",
      "statusChecks": ["蛋块凝固但仍嫩滑", "无焦糊"],
      "failurePoints": ["火太大蛋会焦糊", "火太小蛋不蓬松"],
      "recovery": "火大立即转小火，火小转大火",
      "safeNote": "油温较高注意防溅",
      "photoBrief": "锅中金黄蛋块翻炒瞬间",
      "imagePrompt": "Golden fluffy scrambled eggs in wok, action shot of stir-frying, steam rising, natural light, warm kitchen atmosphere, no text, no watermark",
      "negativePrompt": "AI generated, fake texture, unnatural, cartoon, 3D render, text, watermark",
      "ingredientRefs": ["鸡蛋"],
      "equipmentRefs": ["炒锅", "锅铲"]
    },
    {
      "id": "step03",
      "title": "炒番茄",
      "action": "锅中再加少许油，放入番茄块中火翻炒2-3分钟至出汁软烂，加入盐和糖调味。",
      "heat": "medium",
      "timeMin": 2,
      "timeMax": 3,
      "timerSec": 150,
      "visualCue": "番茄出汁变软，呈浓稠酱状",
      "statusChecks": ["番茄出汁", "调味均匀"],
      "failurePoints": ["翻炒不够番茄不出汁"],
      "recovery": "盖锅盖焖1分钟帮助出汁",
      "safeNote": null,
      "photoBrief": "番茄在锅中炒软出汁",
      "imagePrompt": "Tomatoes stir-frying in wok, juicy and soft, natural red color, steam, warm tones, no text, no watermark",
      "negativePrompt": "AI generated, unnatural red, plastic, cartoon, 3D render, text, watermark",
      "ingredientRefs": ["番茄", "盐", "糖"],
      "equipmentRefs": ["炒锅"]
    },
    {
      "id": "step04",
      "title": "合炒出锅",
      "action": "将炒好的蛋块倒回锅中，与番茄快速翻炒均匀，让蛋块裹上番茄汁即可出锅装盘。",
      "heat": "medium-high",
      "timeMin": 0.5,
      "timeMax": 1,
      "timerSec": 30,
      "visualCue": "蛋块裹满番茄汁，色泽红亮",
      "statusChecks": ["蛋块与番茄融合", "汁水包裹均匀"],
      "failurePoints": ["翻炒过久蛋块变老"],
      "recovery": "快速出锅即可",
      "safeNote": null,
      "photoBrief": "成品翻炒完成即将出锅",
      "imagePrompt": "Final stir-fry of tomato and eggs, golden eggs coated with red tomato sauce, steam, vibrant colors, wok, no text, no watermark",
      "negativePrompt": "AI generated, oversaturated, plastic, cartoon, 3D render, text, watermark",
      "ingredientRefs": ["番茄", "鸡蛋"],
      "equipmentRefs": ["炒锅"]
    }
  ],
  "faq": [
    { "question": "番茄炒蛋要先炒蛋还是先炒番茄？", "answer": "建议先炒蛋。蛋需要大火快炒保持嫩滑，先炒好盛出，再炒番茄出汁后合炒，这样蛋不会老，番茄汁也更浓郁。" },
    { "question": "怎么让鸡蛋更嫩滑？", "answer": "打蛋时加少许盐和几滴水，搅拌至起泡。炒蛋时油温七成热，倒入蛋液后快速翻炒，蛋液刚凝固就盛出，余温会继续加热。" },
    { "question": "番茄需要去皮吗？", "answer": "不需要。番茄皮富含营养，炒软后口感也不影响。如果介意可以用开水烫30秒后去皮，但会损失部分营养和节省时间。" }
  ],
  "tips": [
    "番茄选熟透的，颜色深红，这样酸甜度适中出汁多",
    "鸡蛋加少许水或牛奶可以更嫩滑",
    "糖的量可以根据番茄酸度调整"
  ],
  "troubleshooting": [
    { "problem": "蛋块太老", "cause": "火太大或炒太久", "fix": "下次中火快炒，蛋液刚凝固就盛出" },
    { "problem": "番茄不出汁", "cause": "火太小或翻炒不够", "fix": "中火翻炒或盖盖焖一下" }
  ],
  "relatedRecipes": { "similar": ["egg-fried-rice-001"], "pairing": ["seaweed-soup-001"] },
  "pairing": { "suggestions": ["米饭", "馒头"], "sauceOrSide": ["紫菜蛋花汤"] },
  "styleGuide": {
    "visualTheme": "治愈系暖调留白自然质感",
    "palette": ["番茄红", "蛋黄金", "奶油白"],
    "lighting": "柔和侧光/窗边自然光",
    "materials": ["白色陶瓷盘", "木纹桌面"],
    "props": ["木筷", "小碗米饭"],
    "compositionRules": ["留白充足", "主体占比60-70%", "避免杂乱"],
    "imageRatios": { "cover": "16:9", "step": "4:3", "ingredientsFlatlay": "3:2" }
  },
  "imageShots": [
    {
      "key": "cover_main",
      "title": "成品俯拍全景",
      "ratio": "16:9",
      "imagePrompt": "Real food photography, top-down view, tomato and egg stir-fry on white ceramic plate, golden eggs mixed with red tomato sauce, steam rising, natural light, wooden table, ample white space, warm cozy atmosphere, no text, no watermark, high detail",
      "negativePrompt": "AI generated, plastic texture, unnatural lighting, oversaturated colors, cartoon style, 3D render, text, watermark, logo"
    },
    {
      "key": "cover_detail",
      "title": "成品侧面特写",
      "ratio": "16:9",
      "imagePrompt": "Real food close-up photography, 45 degree side angle, tomato and egg stir-fry detail, fluffy golden eggs coated with glossy red tomato sauce, shallow depth of field f/2.8, natural window light, texture visible, no text, no watermark",
      "negativePrompt": "AI generated, fake texture, unnatural shadows, oversaturated, plastic food, cartoon, 3D render, text, watermark"
    },
    {
      "key": "cover_inside",
      "title": "用筷子夹起展示",
      "ratio": "16:9",
      "imagePrompt": "Real food photography, chopsticks lifting a piece of tomato egg stir-fry, showing the fluffy egg texture and juicy tomato, steam rising, natural light, shallow depth of field, no text, no watermark",
      "negativePrompt": "AI generated, deformed chopsticks, plastic food, unnatural, cartoon, 3D render, text, watermark"
    },
    {
      "key": "ingredients",
      "title": "食材平铺",
      "ratio": "3:2",
      "imagePrompt": "Flat lay food photography, fresh tomatoes and eggs on wooden cutting board, natural light, warm tones, clean composition, ample white space, no text, no watermark",
      "negativePrompt": "AI generated, plastic vegetables, unnatural arrangement, cartoon, 3D render, text, watermark"
    }
  ],
  "seo": {
    "slug": "tomato-egg-stir-fry-recipe",
    "metaTitle": "番茄炒蛋的做法 | 10分钟家常简单做法",
    "metaDescription": "番茄炒蛋家常做法，10分钟简单步骤，蛋嫩番茄酸甜，配详细图文教程和失败避坑指南。",
    "keywords": ["番茄炒蛋", "西红柿炒鸡蛋", "家常菜", "简单食谱", "快手菜"]
  },
  "notes": ["营养数据为估算值", "可根据口味调整糖盐比例"]
}

【现在请为"${dishName}"生成完整的菜谱JSON数据】
（直接输出JSON，不要markdown代码块）`;
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
  cleaned = cleaned.replace(/"amount":\s*1\/2/g, '"amount": 0.5');
  cleaned = cleaned.replace(/"amount":\s*1\/3/g, '"amount": 0.33');
  cleaned = cleaned.replace(/"amount":\s*2\/3/g, '"amount": 0.67');
  cleaned = cleaned.replace(/"amount":\s*1\/4/g, '"amount": 0.25');
  cleaned = cleaned.replace(/"amount":\s*3\/4/g, '"amount": 0.75');
  cleaned = cleaned.replace(/"amount":\s*(\d+)\/(\d+)/g, (match, num, denom) => {
    return `"amount": ${parseFloat(num) / parseFloat(denom)}`;
  });

  // 修复未加引号的字符串字段
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

  // 转换 ingredients 中的字段
  if (data.ingredients && Array.isArray(data.ingredients)) {
    const validIcons = [
      "meat", "veg", "fruit", "seafood", "grain", "bean",
      "dairy", "egg", "spice", "sauce", "oil", "tool", "other"
    ];

    data.ingredients.forEach((section: any) => {
      if (section.items && Array.isArray(section.items)) {
        section.items.forEach((item: any) => {
          // 修复 notes: null -> undefined
          if (item.notes === null) {
            item.notes = undefined;
          }

          // 修复 iconKey
          if (item.iconKey) {
            const key = item.iconKey.toLowerCase();
            if (!validIcons.includes(key)) {
              if (key.includes("vegetable")) item.iconKey = "veg";
              else if (key === "tool") item.iconKey = "other";
              else {
                console.warn(`Invalid iconKey: ${item.iconKey}, fallback to 'other'`);
                item.iconKey = "other";
              }
            }
          }

          // 修复 amount
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

  // 转换 steps 中的字段
  if (data.steps && Array.isArray(data.steps)) {
    data.steps.forEach((step: any) => {
      if (typeof step.timerSec === 'string') {
        step.timerSec = parseInt(step.timerSec, 10);
      }
      if (typeof step.timeMin === 'string') {
        step.timeMin = parseFloat(step.timeMin);
      }
      if (typeof step.timeMax === 'string') {
        step.timeMax = parseFloat(step.timeMax);
      }
      // 兼容 failPoint -> failurePoints
      if (step.failPoint && !step.failurePoints) {
        step.failurePoints = [step.failPoint];
      }
    });
  }

  // 转换 nutrition 中的数字
  if (data.nutrition?.perServing) {
    const ps = data.nutrition.perServing;
    ['calories', 'protein', 'fat', 'carbs', 'fiber', 'sodium'].forEach(key => {
      if (typeof ps[key] === 'string') {
        ps[key] = parseFloat(ps[key]);
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
      maxTokens: 8000, // 增加token限制以支持v2.0.0完整输出
    });

    // 清理响应
    const cleanedContent = cleanAIResponse(response.content);

    // 解析JSON
    let recipeData: any;
    try {
      recipeData = JSON.parse(cleanedContent);

      // 兼容处理：如果AI返回的数据包裹在recipe字段中，提取出来
      if (recipeData.recipe && typeof recipeData.recipe === 'object') {
        const { recipe, ...rest } = recipeData;
        recipeData = {
          ...rest,
          ...recipe
        };
      }
    } catch (parseError) {
      console.error("JSON解析失败:", parseError);
      console.error("原始内容（前500字符）:", response.content.substring(0, 500));
      console.error("清理后内容（前500字符）:", cleanedContent.substring(0, 500));

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

    // 标准化数据
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

    if (options?.onProgress) {
      options.onProgress(i + 1, dishNames.length, dishName);
    }

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

    // 避免API限流
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
