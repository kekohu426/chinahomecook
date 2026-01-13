/**
 * 发布新生成的食谱
 *
 * 适配新 schema: status 而非 isPublished
 */

import * as fs from "fs";
import * as path from "path";

const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex > 0) {
    const key = trimmed.slice(0, eqIndex);
    let value = trimmed.slice(eqIndex + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function run() {
  const { prisma } = await import("../lib/db/prisma");

  // 获取所有待发布的粤菜 (使用 cuisine 关系)
  const pendingRecipes = await prisma.recipe.findMany({
    where: {
      cuisine: { slug: "yue" },
      status: "draft",
    },
    select: { id: true, title: true },
  });

  console.log(`找到 ${pendingRecipes.length} 道待发布的粤菜:\n`);

  for (const recipe of pendingRecipes) {
    await prisma.recipe.update({
      where: { id: recipe.id },
      data: { status: "published", publishedAt: new Date() },
    });
    console.log(`✅ 已发布: ${recipe.title}`);
  }

  // 验证发布结果
  const publishedCount = await prisma.recipe.count({
    where: { cuisine: { slug: "yue" }, status: "published" },
  });

  console.log(`\n=== 结果 ===`);
  console.log(`粤菜已发布食谱总数: ${publishedCount}`);
}

run()
  .catch(console.error)
  .finally(() => process.exit(0));
