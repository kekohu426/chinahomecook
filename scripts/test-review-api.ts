/**
 * 测试审核 API 的脚本
 */

import "dotenv/config";
import { prisma } from "../lib/db/prisma";

async function main() {
  console.log("=== 测试审核 API ===\n");

  // 1. 找一个待审核的菜谱
  const pendingRecipe = await prisma.recipe.findFirst({
    where: { reviewStatus: "pending" },
    select: { id: true, title: true, status: true, reviewStatus: true },
  });

  if (!pendingRecipe) {
    console.log("没有待审核的菜谱");
    return;
  }

  console.log("找到待审核菜谱:");
  console.log(`  ID: ${pendingRecipe.id}`);
  console.log(`  标题: ${pendingRecipe.title}`);
  console.log(`  status: ${pendingRecipe.status}`);
  console.log(`  reviewStatus: ${pendingRecipe.reviewStatus}`);

  // 2. 模拟审核通过
  console.log("\n模拟审核通过...");

  const updateData = {
    reviewStatus: "approved",
    reviewedAt: new Date(),
    reviewNote: "测试审核",
    status: "published",
    publishedAt: new Date(),
  };

  const updated = await prisma.recipe.update({
    where: { id: pendingRecipe.id },
    data: updateData,
  });

  console.log("\n更新后:");
  console.log(`  status: ${updated.status}`);
  console.log(`  reviewStatus: ${updated.reviewStatus}`);
  console.log(`  reviewedAt: ${updated.reviewedAt}`);

  // 3. 验证更新是否成功
  const verified = await prisma.recipe.findUnique({
    where: { id: pendingRecipe.id },
    select: { id: true, title: true, status: true, reviewStatus: true, reviewedAt: true },
  });

  console.log("\n验证查询:");
  console.log(`  status: ${verified?.status}`);
  console.log(`  reviewStatus: ${verified?.reviewStatus}`);
  console.log(`  reviewedAt: ${verified?.reviewedAt}`);

  // 4. 恢复原状（可选）
  // await prisma.recipe.update({
  //   where: { id: pendingRecipe.id },
  //   data: {
  //     reviewStatus: "pending",
  //     reviewedAt: null,
  //     reviewNote: null,
  //     status: pendingRecipe.status,
  //   },
  // });
  // console.log("\n已恢复原状");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
