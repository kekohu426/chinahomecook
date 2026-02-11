import "dotenv/config";
import { prisma } from "../lib/db/prisma";

async function debug() {
  console.log("=== 检查 HomeBrowseItem 表 ===\n");

  const items = await prisma.homeBrowseItem.findMany({
    where: { type: "CUISINE", isActive: true },
    include: { translations: true },
  });

  console.log(`找到 ${items.length} 个菜系浏览项:\n`);

  for (const item of items) {
    const enTrans = item.translations.find(t => t.locale === "en");
    console.log(`${item.name}:`);
    console.log(`  翻译数量: ${item.translations.length}`);
    console.log(`  英文翻译: ${enTrans ? enTrans.name : "❌ 无"}`);
    console.log();
  }

  await prisma.$disconnect();
}

debug().catch(console.error);
