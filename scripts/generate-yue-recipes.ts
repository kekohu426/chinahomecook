/**
 * 生成10道粤菜食谱
 */

import { prisma } from "../lib/db/prisma";

// 粤菜经典菜名
const YUE_RECIPES = [
  "白切鸡",
  "清蒸鲈鱼",
  "蚝油生菜",
  "虾饺",
  "叉烧",
  "煲仔饭",
  "糖醋排骨",
  "蒸蛋",
  "干炒牛河",
  "菠萝咕噜肉",
];

async function main() {
  console.log("=== 创建粤菜生成任务 ===\n");

  // 获取粤菜聚合页
  const collection = await prisma.collection.findFirst({
    where: { cuisineId: "cui_yue" },
  });

  if (!collection) {
    console.error("❌ 粤菜聚合页不存在");
    return;
  }

  console.log(`聚合页: ${collection.name} (${collection.id})`);

  // 创建生成任务
  const job = await prisma.generateJob.create({
    data: {
      sourceType: "collection",
      collectionId: collection.id,
      lockedTags: {
        cuisine: "yue",
        location: "lingnan",
      },
      recipeNames: YUE_RECIPES,
      totalCount: YUE_RECIPES.length,
      status: "pending",
      successCount: 0,
      failedCount: 0,
    },
  });

  console.log(`\n✅ 任务已创建: ${job.id}`);
  console.log(`   菜名: ${YUE_RECIPES.join(", ")}`);
  console.log(`   总数: ${job.totalCount}`);
  console.log(`\n请使用以下命令启动任务:`);
  console.log(`   curl -X POST http://localhost:3000/api/admin/jobs/${job.id}/start`);
  console.log(`\n或使用脚本启动:`);
  console.log(`   JOB_ID="${job.id}" npx tsx scripts/start-job.ts`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
