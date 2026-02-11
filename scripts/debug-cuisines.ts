import "dotenv/config";
import { prisma } from "../lib/db/prisma";
import { getContentLocales } from "../lib/i18n/content";

async function debug() {
  const locale = "en";
  const locales = getContentLocales(locale);

  console.log("=== 调试菜系数据流 ===\n");
  console.log("locale:", locale);
  console.log("getContentLocales 返回:", locales);
  console.log();

  // 模拟 getCuisines 函数的查询
  const cuisines = await prisma.cuisine.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    take: 8,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      translations: {
        where: { locale: { in: locales } },
        select: { locale: true, name: true, description: true },
      },
    },
  });

  console.log("查询到的菜系数据:");
  for (const cuisine of cuisines) {
    const translation = locales
      .map((loc) => cuisine.translations.find((t) => t.locale === loc))
      .find(Boolean);

    console.log(`  ${cuisine.name}:`);
    console.log(`    翻译数量: ${cuisine.translations.length}`);
    console.log(`    翻译内容:`, cuisine.translations);
    console.log(`    选中的翻译:`, translation);
    console.log(`    最终显示: ${translation?.name || cuisine.name}`);
    console.log();
  }

  await prisma.$disconnect();
}

debug().catch(console.error);
