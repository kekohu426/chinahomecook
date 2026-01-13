/**
 * AI 推荐菜名服务
 *
 * 根据合集规则和上下文，使用 AI 推荐适合的菜名
 */

import { getTextProvider } from "./provider";

export interface RecommendContext {
  collectionName: string;
  collectionType: string;
  cuisineName?: string;
  locationName?: string;
  tagName?: string;
  description?: string;
  existingTitles: string[];
  style?: string;
}

export interface RecommendedDish {
  name: string;
  reason: string;
  confidence: number;
}

/**
 * 构建推荐提示词
 */
function buildRecommendPrompt(context: RecommendContext, count: number): string {
  const parts: string[] = [];

  parts.push(`你是一个中国美食专家，请为以下合集推荐 ${count} 个适合的菜名。`);
  parts.push("");
  parts.push("【合集信息】");
  parts.push(`- 合集名称: ${context.collectionName}`);
  parts.push(`- 合集类型: ${context.collectionType}`);

  if (context.cuisineName) {
    parts.push(`- 菜系: ${context.cuisineName}`);
  }
  if (context.locationName) {
    parts.push(`- 地区: ${context.locationName}`);
  }
  if (context.tagName) {
    parts.push(`- 标签: ${context.tagName}`);
  }
  if (context.description) {
    parts.push(`- 描述: ${context.description}`);
  }
  if (context.style) {
    parts.push(`- 风格要求: ${context.style}`);
  }

  if (context.existingTitles.length > 0) {
    parts.push("");
    parts.push("【已有菜谱（请勿重复推荐）】");
    // 只显示前 30 个，避免 prompt 过长
    const displayTitles = context.existingTitles.slice(0, 30);
    parts.push(displayTitles.join("、"));
    if (context.existingTitles.length > 30) {
      parts.push(`...等共 ${context.existingTitles.length} 个`);
    }
  }

  parts.push("");
  parts.push("【输出要求】");
  parts.push("1. 输出严格 JSON 数组格式，不要 markdown 代码块");
  parts.push("2. 每个推荐包含: name(菜名), reason(推荐理由), confidence(置信度0-1)");
  parts.push("3. 菜名必须是真实存在的中国菜，不要编造");
  parts.push("4. 推荐理由简洁明了，20字以内");
  parts.push("5. 置信度表示该菜与合集的匹配程度");
  parts.push("6. 不要推荐已有菜谱中的菜名或其别名");
  parts.push("");
  parts.push("【输出示例】");
  parts.push('[{"name":"麻婆豆腐","reason":"川菜经典，麻辣鲜香","confidence":0.95}]');
  parts.push("");
  parts.push(`请推荐 ${count} 个菜名：`);

  return parts.join("\n");
}

/**
 * 解析 AI 响应
 */
function parseRecommendResponse(response: string): RecommendedDish[] {
  // 清理响应
  let cleaned = response.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");
  cleaned = cleaned.trim();

  // 提取 JSON 数组
  const jsonStart = cleaned.indexOf("[");
  const jsonEnd = cleaned.lastIndexOf("]");

  if (jsonStart >= 0 && jsonEnd >= 0 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      console.error("AI 响应不是数组:", cleaned);
      return [];
    }

    return parsed.map((item: any) => ({
      name: String(item.name || ""),
      reason: String(item.reason || ""),
      confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0.5)),
    })).filter((item) => item.name.length > 0);
  } catch (error) {
    console.error("解析 AI 推荐响应失败:", error);
    console.error("原始响应:", response);
    return [];
  }
}

/**
 * 使用 AI 推荐菜名
 */
export async function recommendDishes(
  context: RecommendContext,
  count: number = 10
): Promise<RecommendedDish[]> {
  try {
    const provider = getTextProvider();
    const prompt = buildRecommendPrompt(context, count);

    const response = await provider.chat({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8, // 稍高的温度增加多样性
      maxTokens: 2000,
    });

    const recommendations = parseRecommendResponse(response.content);

    // 过滤掉已存在的菜名（二次检查）
    const existingSet = new Set(
      context.existingTitles.map((t) => t.toLowerCase())
    );
    const filtered = recommendations.filter(
      (dish) => !existingSet.has(dish.name.toLowerCase())
    );

    // 按置信度排序
    filtered.sort((a, b) => b.confidence - a.confidence);

    return filtered.slice(0, count);
  } catch (error) {
    console.error("AI 推荐菜名失败:", error);
    // 返回空数组，让调用方使用备选方案
    return [];
  }
}

/**
 * 备选推荐（当 AI 不可用时使用）
 */
export function getFallbackRecommendations(
  context: RecommendContext,
  count: number = 10
): RecommendedDish[] {
  // 根据合集类型选择推荐策略
  const cuisineRecommendations: Record<string, RecommendedDish[]> = {
    川菜: [
      { name: "麻婆豆腐", reason: "川菜经典，麻辣鲜香", confidence: 0.95 },
      { name: "宫保鸡丁", reason: "川菜名菜，口味独特", confidence: 0.92 },
      { name: "回锅肉", reason: "川菜代表，香辣可口", confidence: 0.90 },
      { name: "水煮鱼", reason: "麻辣鲜香，适合聚餐", confidence: 0.88 },
      { name: "鱼香肉丝", reason: "风味独特，家常必备", confidence: 0.87 },
      { name: "夫妻肺片", reason: "凉菜经典，麻辣爽口", confidence: 0.85 },
      { name: "担担面", reason: "川味小吃，香辣开胃", confidence: 0.84 },
      { name: "口水鸡", reason: "凉菜佳品，麻辣鲜香", confidence: 0.83 },
      { name: "酸菜鱼", reason: "酸辣开胃，鱼肉鲜嫩", confidence: 0.82 },
      { name: "辣子鸡", reason: "香辣酥脆，下酒佳品", confidence: 0.81 },
    ],
    粤菜: [
      { name: "白切鸡", reason: "粤菜经典，原汁原味", confidence: 0.95 },
      { name: "清蒸鲈鱼", reason: "清淡鲜美，营养丰富", confidence: 0.92 },
      { name: "叉烧", reason: "广式烧腊，甜香可口", confidence: 0.90 },
      { name: "虾饺", reason: "早茶必点，皮薄馅鲜", confidence: 0.88 },
      { name: "烧鹅", reason: "广式烧腊，皮脆肉嫩", confidence: 0.87 },
      { name: "蒸排骨", reason: "豉汁蒸制，鲜嫩入味", confidence: 0.85 },
      { name: "煲仔饭", reason: "广式特色，锅巴香脆", confidence: 0.84 },
      { name: "老火靓汤", reason: "广式煲汤，滋补养生", confidence: 0.83 },
      { name: "肠粉", reason: "早茶经典，滑嫩爽口", confidence: 0.82 },
      { name: "糖醋咕噜肉", reason: "酸甜可口，老少皆宜", confidence: 0.81 },
    ],
    湘菜: [
      { name: "剁椒鱼头", reason: "湘菜名菜，鲜辣开胃", confidence: 0.95 },
      { name: "小炒肉", reason: "湘菜经典，香辣下饭", confidence: 0.92 },
      { name: "口味虾", reason: "长沙名吃，麻辣鲜香", confidence: 0.90 },
      { name: "毛氏红烧肉", reason: "湘菜代表，肥而不腻", confidence: 0.88 },
      { name: "干锅花菜", reason: "干香入味，下饭神器", confidence: 0.85 },
      { name: "酸辣鸡杂", reason: "酸辣开胃，口感丰富", confidence: 0.83 },
    ],
  };

  const generalRecommendations: RecommendedDish[] = [
    { name: "红烧肉", reason: "经典家常菜，肥而不腻", confidence: 0.90 },
    { name: "糖醋排骨", reason: "酸甜可口，老少皆宜", confidence: 0.88 },
    { name: "番茄炒蛋", reason: "入门级家常菜，简单美味", confidence: 0.87 },
    { name: "酸辣土豆丝", reason: "开胃小菜，制作快捷", confidence: 0.85 },
    { name: "可乐鸡翅", reason: "甜咸适口，孩子喜爱", confidence: 0.84 },
    { name: "蒜蓉蒸虾", reason: "海鲜佳品，营养丰富", confidence: 0.83 },
    { name: "青椒肉丝", reason: "家常小炒，简单美味", confidence: 0.82 },
    { name: "蚂蚁上树", reason: "下饭神器，口感丰富", confidence: 0.81 },
    { name: "地三鲜", reason: "东北名菜，素菜经典", confidence: 0.80 },
    { name: "西红柿牛腩", reason: "酸甜开胃，营养丰富", confidence: 0.79 },
  ];

  // 选择推荐来源
  let candidates: RecommendedDish[] = [];

  if (context.cuisineName && cuisineRecommendations[context.cuisineName]) {
    candidates = [...cuisineRecommendations[context.cuisineName]];
  }

  // 补充通用推荐
  candidates = [...candidates, ...generalRecommendations];

  // 去重已存在的菜谱
  const existingSet = new Set(
    context.existingTitles.map((t) => t.toLowerCase())
  );
  const filtered = candidates.filter(
    (dish) => !existingSet.has(dish.name.toLowerCase())
  );

  // 去重候选列表本身
  const uniqueFiltered = filtered.filter(
    (dish, index, self) =>
      index === self.findIndex((d) => d.name === dish.name)
  );

  return uniqueFiltered.slice(0, count);
}
