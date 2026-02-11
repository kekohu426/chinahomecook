import "dotenv/config";
import { prisma } from "../lib/db/prisma";
import { getTextProvider } from "../lib/ai/provider";

async function translateBrowseItems() {
  console.log("=== 为 HomeBrowseItem 生成英文翻译 ===\n");

  const provider = getTextProvider();

  // 获取所有类型的浏览项
  const items = await prisma.homeBrowseItem.findMany({
    where: { isActive: true },
    include: { translations: { where: { locale: "en" } } },
  });

  const itemsNeedingTranslation = items.filter(item => item.translations.length === 0);
  console.log(`找到 ${itemsNeedingTranslation.length} 个需要翻译的浏览项\n`);

  for (const item of itemsNeedingTranslation) {
    try {
      process.stdout.write(`${item.type} - ${item.name}... `);

      const response = await provider.chat({
        messages: [
          {
            role: "user",
            content: `Translate this Chinese cuisine/region/ingredient name and description to English. Return JSON only:
{"name": "...", "description": "..."}

Type: ${item.type}
Name: ${item.name}
Description: ${item.description || ""}`,
          },
        ],
        temperature: 0.3,
        maxTokens: 500,
      });

      const jsonMatch = (response.content || "").match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const translated = JSON.parse(jsonMatch[0]);
        await prisma.homeBrowseItemTranslation.create({
          data: {
            item: { connect: { id: item.id } },
            locale: "en",
            name: translated.name || item.name,
            description: translated.description || item.description,
          },
        });
        console.log(`✅ ${translated.name}`);
      } else {
        console.log("❌ 解析失败");
      }
    } catch (error) {
      console.log(`❌ ${(error as Error).message}`);
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\n=== 完成 ===");
  await prisma.$disconnect();
}

translateBrowseItems().catch(console.error);
