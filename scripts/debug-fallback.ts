import "dotenv/config";
import { prisma } from "../lib/db/prisma";

async function debug() {
  console.log("=== 检查数据库菜系 vs 代码 Fallback ===\n");

  const dbCuisines = await prisma.cuisine.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { name: true, slug: true },
  });

  console.log("数据库菜系:", dbCuisines.map(c => c.name).join(", "));
  console.log();

  // 代码中的 Fallback 菜系
  const fallbackCuisines = ["川菜", "粤菜", "江浙菜", "鲁菜", "湘菜", "西北菜"];
  console.log("代码 Fallback:", fallbackCuisines.join(", "));
  console.log();

  // 检查匹配情况
  console.log("匹配检查:");
  for (const db of dbCuisines) {
    const matched = fallbackCuisines.includes(db.name);
    console.log(`  ${db.name}: ${matched ? "✓ 匹配" : "✗ 不匹配"}`);
  }

  await prisma.$disconnect();
}

debug().catch(console.error);
