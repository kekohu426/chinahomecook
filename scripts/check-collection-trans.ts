import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

// 加载环境变量
dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function check() {
  const collections = await prisma.collection.findMany({
    where: { status: "published" },
    include: { translations: { where: { locale: "en" } } },
    take: 50,
  });

  console.log("=== Collection 英文翻译情况 ===");
  console.log(
    "有英文翻译:",
    collections.filter((c) => c.translations.length > 0).length
  );
  console.log(
    "无英文翻译:",
    collections.filter((c) => c.translations.length === 0).length
  );

  const noTrans = collections.filter((c) => c.translations.length === 0);
  if (noTrans.length > 0) {
    console.log("\n缺少翻译:");
    noTrans.forEach((c) => console.log("  -", c.name, "(" + c.type + ")"));
  }

  await prisma.$disconnect();
}
check();
