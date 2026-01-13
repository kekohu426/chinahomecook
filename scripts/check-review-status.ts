/**
 * 检查审核状态的脚本
 */

import "dotenv/config";
import { prisma } from "../lib/db/prisma";

async function main() {
  console.log("=== 检查待审核菜谱 ===\n");

  const pending = await prisma.recipe.findMany({
    where: { reviewStatus: "pending" },
    select: { id: true, title: true, status: true, reviewStatus: true },
    take: 5
  });

  console.log("待审核菜谱示例:");
  pending.forEach(r => {
    console.log(`  - ${r.title} (status: ${r.status}, reviewStatus: ${r.reviewStatus})`);
  });

  const counts = await prisma.recipe.groupBy({
    by: ["reviewStatus"],
    _count: true
  });

  console.log("\n各审核状态数量:");
  counts.forEach(c => {
    console.log(`  - ${c.reviewStatus}: ${c._count}`);
  });

  // 检查是否有 status=pending 但 reviewStatus 不是 pending 的情况
  const mismatch = await prisma.recipe.count({
    where: {
      status: "pending",
      reviewStatus: { not: "pending" }
    }
  });
  console.log(`\nstatus=pending 但 reviewStatus 不是 pending 的数量: ${mismatch}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
