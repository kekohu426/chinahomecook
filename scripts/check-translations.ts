import "dotenv/config";
import { prisma } from "../lib/db/prisma";

async function check() {
  console.log("=== 菜系翻译数据 ===\n");

  const cuisines = await prisma.cuisine.findMany({
    where: { isActive: true },
    include: { translations: true }
  });

  for (const c of cuisines) {
    const enTrans = c.translations.find(t => t.locale === "en");
    console.log(`${c.name} -> ${enTrans ? enTrans.name : "❌ 无英文翻译"}`);
  }

  console.log("\n=== 地域翻译数据 ===\n");

  const locations = await prisma.location.findMany({
    where: { isActive: true },
    include: { translations: true }
  });

  for (const l of locations) {
    const enTrans = l.translations.find(t => t.locale === "en");
    console.log(`${l.name} -> ${enTrans ? enTrans.name : "❌ 无英文翻译"}`);
  }

  console.log("\n=== 首页配置翻译 ===\n");

  const homeConfigs = await prisma.homeConfig.findMany({
    where: { isActive: true },
    include: { translations: true }
  });

  for (const h of homeConfigs) {
    const enTrans = h.translations.find(t => t.locale === "en");
    console.log(`${h.section}: ${h.title} -> ${enTrans ? enTrans.title : "❌ 无英文翻译"}`);
  }

  await prisma.$disconnect();
}

check().catch(console.error);
