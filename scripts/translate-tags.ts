/**
 * 翻译 Tag 表的英文
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Tag 翻译映射
const TAG_TRANSLATIONS: Record<string, string> = {
  // 场景
  "暖胃": "Comfort Food",
  "汤羹": "Soup",
  "干锅": "Dry Pot",
  "地方名菜": "Regional Specialty",
  "节庆": "Festival",
  "名菜": "Famous Dish",
  "宴席": "Feast",
  "快手餐": "Quick Meal",
  "家常面": "Home Noodles",
  "街头小吃": "Street Food",
  "家常菜": "Home Cooking",
  "夜宵": "Late Night Snack",
  "简餐": "Light Meal",
  "正餐": "Main Meal",
  "日常": "Daily",
  "家庭聚餐": "Family Gathering",
  "聚会": "Party",
  // 口味
  "麻辣": "Spicy & Numbing",
  "酸辣": "Sour & Spicy",
  "香辣": "Aromatic Spicy",
  "清淡": "Light",
  "咸鲜": "Savory",
  "酸甜": "Sweet & Sour",
  "甜": "Sweet",
  "苦": "Bitter",
  "微辣": "Mild Spicy",
  "鲜辣": "Fresh Spicy",
  "甜辣": "Sweet & Spicy",
  "咸甜适口": "Savory Sweet",
  "果木香": "Fruity Aroma",
  "酥香": "Crispy",
  "清甜": "Refreshing Sweet",
  "浓郁": "Rich",
  "清润": "Light & Moist",
  "麻": "Numbing",
  "辣": "Spicy",
  // 做法
  "炒": "Stir-fry",
  "蒸": "Steam",
  "煮": "Boil",
  "炖": "Stew",
  "烤": "Roast",
  "煎": "Pan-fry",
  "炸": "Deep-fry",
  "凉拌": "Cold Mix",
  "焯": "Blanch",
  "煸": "Sauté",
  "收汁": "Reduce Sauce",
  "爆炒": "Quick Stir-fry",
  "煸炒": "Sauté",
  "快炒": "Quick Fry",
  "挂汁": "Glaze",
  "炒糖色": "Caramelize",
  "焖烧": "Braise",
  "炸香": "Deep-fry Aromatic",
  "乳化": "Emulsify",
  "鼓风分皮": "Air Separation",
  "烫皮": "Scald Skin",
  "风干": "Air Dry",
  // 人群
  "老人": "Elderly",
  "儿童": "Kids",
  "孕妇": "Pregnant",
  "减肥": "Diet",
  "家庭": "Family",
  "所有人": "Everyone",
  // 食材
  "猪肉": "Pork",
  "鸡肉": "Chicken",
  "牛肉": "Beef",
  "豆腐": "Tofu",
  "鱼": "Fish",
  "虾": "Shrimp",
  "鸡蛋": "Eggs",
  "白菜": "Chinese Cabbage",
  // 主题
  "下饭菜": "Rice Companion",
  "减脂餐": "Diet Meal",
  "快手菜": "Quick Meal",
  "宴客菜": "Banquet Dish",
};

async function main() {
  console.log("=== 检查 Tag 英文翻译 ===\n");

  const tags = await prisma.tag.findMany({
    include: { translations: { where: { locale: "en" } } },
  });

  const noTrans = tags.filter((t) => t.translations.length === 0);
  const hasTrans = tags.filter((t) => t.translations.length > 0);

  console.log("有英文翻译:", hasTrans.length);
  console.log("无英文翻译:", noTrans.length);

  if (noTrans.length === 0) {
    console.log("\n✅ 所有 Tag 都有英文翻译");
    return;
  }

  console.log("\n缺少翻译的标签:");
  noTrans.slice(0, 20).forEach((t) => console.log("  -", t.name, "(" + t.type + ")"));

  console.log("\n=== 开始生成翻译 ===\n");

  let created = 0;
  for (const tag of noTrans) {
    const englishName = TAG_TRANSLATIONS[tag.name] || tag.name;
    const slug = englishName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/&/g, "and");

    try {
      await prisma.tagTranslation.create({
        data: {
          tagId: tag.id,
          locale: "en",
          name: englishName,
          slug: slug,
        },
      });
      console.log(`✅ ${tag.name} -> ${englishName}`);
      created++;
    } catch (error: any) {
      if (error.code === "P2002") {
        console.log(`⏭️ ${tag.name} 已存在翻译`);
      } else {
        console.log(`❌ ${tag.name} 失败:`, error.message?.substring(0, 50));
      }
    }
  }

  console.log(`\n完成！创建了 ${created} 条翻译`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
