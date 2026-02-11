/**
 * 检查并生成 Collection 英文翻译
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

// 中文到英文的翻译映射
const TRANSLATIONS: Record<string, string> = {
  // 菜系
  "徽菜": "Anhui Cuisine",
  "川菜": "Sichuan Cuisine",
  "粤菜": "Cantonese Cuisine",
  "湘菜": "Hunan Cuisine",
  "鲁菜": "Shandong Cuisine",
  "苏菜": "Jiangsu Cuisine",
  "浙菜": "Zhejiang Cuisine",
  "闽菜": "Fujian Cuisine",
  "江浙菜": "Jiangsu & Zhejiang",
  "西北菜": "Northwest Cuisine",

  // 场景/主题
  "晚餐": "Dinner",
  "下午茶": "Afternoon Tea",
  "早餐": "Breakfast",
  "午餐": "Lunch",
  "夜宵": "Late Night Snack",
  "下饭菜": "Rice Companion",
  "减脂餐": "Diet Meal",
  "快手菜": "Quick Meal",
  "宴客菜": "Banquet Dish",
  "家常菜": "Home Cooking",
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

  // 食材
  "猪肉": "Pork",
  "鸡肉": "Chicken",
  "牛肉": "Beef",
  "豆腐": "Tofu",
  "鱼": "Fish",
  "虾": "Shrimp",
  "鸡蛋": "Eggs",
  "白菜": "Chinese Cabbage",
  "土豆": "Potato",
  "番茄": "Tomato",
  "青菜": "Greens",
  "菌菇": "Mushrooms",
  "辣椒": "Chili Pepper",

  // 地域
  "川渝": "Sichuan & Chongqing",
  "粤港澳": "Cantonese Region",
  "江浙": "Jiangsu & Zhejiang",
  "东北": "Northeast",
  "湖南": "Hunan",
  "云贵": "Yunnan & Guizhou",
  "山东": "Shandong",
  "福建": "Fujian",
  "安徽": "Anhui",
};

async function main() {
  console.log("=== 检查 Collection 英文翻译 ===\n");

  const collections = await prisma.collection.findMany({
    where: { status: "published" },
    include: { translations: { where: { locale: "en" } } },
  });

  const noTrans = collections.filter((c) => c.translations.length === 0);
  const hasTrans = collections.filter((c) => c.translations.length > 0);

  console.log("有英文翻译:", hasTrans.length);
  console.log("无英文翻译:", noTrans.length);

  if (noTrans.length === 0) {
    console.log("\n✅ 所有 Collection 都有英文翻译");
    return;
  }

  console.log("\n缺少翻译的集合:");
  noTrans.forEach((c) => console.log("  -", c.name, "(" + c.type + ")"));

  console.log("\n=== 开始生成翻译 ===\n");

  let created = 0;
  for (const collection of noTrans) {
    const englishName = TRANSLATIONS[collection.name] || collection.nameEn || collection.name;
    const slug = englishName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/&/g, "and");

    try {
      await prisma.collectionTranslation.create({
        data: {
          collectionId: collection.id,
          locale: "en",
          name: englishName,
          slug: slug,
          description: collection.description || "",
        },
      });
      console.log(`✅ ${collection.name} -> ${englishName}`);
      created++;
    } catch (error: any) {
      if (error.code === "P2002") {
        console.log(`⏭️ ${collection.name} 已存在翻译`);
      } else {
        console.log(`❌ ${collection.name} 失败:`, error.message);
      }
    }
  }

  console.log(`\n完成！创建了 ${created} 条翻译`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
