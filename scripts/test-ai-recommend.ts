/**
 * 测试 AI 推荐菜名功能
 *
 * 运行: npx tsx scripts/test-ai-recommend.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { recommendDishes, getFallbackRecommendations, type RecommendContext } from "../lib/ai/recommend-dishes";

async function main() {
  console.log("=== 测试 AI 推荐菜名功能 ===\n");

  // 测试上下文
  const context: RecommendContext = {
    collectionName: "川菜食谱",
    collectionType: "cuisine",
    cuisineName: "川菜",
    description: "麻辣鲜香的经典川菜做法合集",
    existingTitles: ["麻婆豆腐", "宫保鸡丁", "回锅肉"],
    style: "家常菜为主",
  };

  console.log("测试上下文:");
  console.log(JSON.stringify(context, null, 2));
  console.log("\n");

  // 测试 AI 推荐
  console.log("1. 测试 AI 推荐 (调用真实 AI 模型)...\n");
  try {
    const aiRecommendations = await recommendDishes(context, 5);
    if (aiRecommendations.length > 0) {
      console.log("AI 推荐结果:");
      aiRecommendations.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.name} (置信度: ${r.confidence.toFixed(2)})`);
        console.log(`     理由: ${r.reason}`);
      });
    } else {
      console.log("AI 推荐返回空，可能是 API Key 未配置或调用失败");
    }
  } catch (error) {
    console.log("AI 推荐失败:", error instanceof Error ? error.message : String(error));
  }

  console.log("\n");

  // 测试备选推荐
  console.log("2. 测试备选推荐 (硬编码候选列表)...\n");
  const fallbackRecommendations = getFallbackRecommendations(context, 5);
  console.log("备选推荐结果:");
  fallbackRecommendations.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name} (置信度: ${r.confidence.toFixed(2)})`);
    console.log(`     理由: ${r.reason}`);
  });

  console.log("\n=== 测试完成 ===");
}

main().catch(console.error);
