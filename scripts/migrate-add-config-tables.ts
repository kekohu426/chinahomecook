/**
 * 手动迁移脚本：创建配置表
 *
 * 创建表：
 * - Location（地点配置）
 * - Cuisine（菜系配置）
 */

import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

// 加载环境变量
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log("开始创建配置表...");

    // 1. 创建 Location 表
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Location" (
        "id" TEXT PRIMARY KEY,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "name" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "slug" TEXT NOT NULL UNIQUE,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "sortOrder" INTEGER NOT NULL DEFAULT 0
      );
    `);
    console.log("✓ 创建 Location 表");

    // 2. 创建 Location 索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Location_isActive_idx" ON "Location"("isActive");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Location_sortOrder_idx" ON "Location"("sortOrder");
    `);
    console.log("✓ 创建 Location 索引");

    // 3. 创建 Cuisine 表
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Cuisine" (
        "id" TEXT PRIMARY KEY,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "name" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "slug" TEXT NOT NULL UNIQUE,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "sortOrder" INTEGER NOT NULL DEFAULT 0
      );
    `);
    console.log("✓ 创建 Cuisine 表");

    // 4. 创建 Cuisine 索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Cuisine_isActive_idx" ON "Cuisine"("isActive");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Cuisine_sortOrder_idx" ON "Cuisine"("sortOrder");
    `);
    console.log("✓ 创建 Cuisine 索引");

    // 5. 插入初始数据 - 地点
    const locations = [
      { id: "loc_chuanyu", name: "川渝", slug: "chuanyu", description: "四川重庆地区", sortOrder: 1 },
      { id: "loc_jiangzhe", name: "江浙", slug: "jiangzhe", description: "江苏浙江地区", sortOrder: 2 },
      { id: "loc_yuegangao", name: "粤港澳", slug: "yuegangao", description: "广东香港澳门地区", sortOrder: 3 },
      { id: "loc_dongbei", name: "东北", slug: "dongbei", description: "东北三省", sortOrder: 4 },
      { id: "loc_xibei", name: "西北", slug: "xibei", description: "陕甘宁青新", sortOrder: 5 },
      { id: "loc_hunan", name: "湖南", slug: "hunan", description: "湖南地区", sortOrder: 6 },
      { id: "loc_hubei", name: "湖北", slug: "hubei", description: "湖北地区", sortOrder: 7 },
      { id: "loc_fujian", name: "福建", slug: "fujian", description: "福建地区", sortOrder: 8 },
    ];

    for (const loc of locations) {
      await client.query(`
        INSERT INTO "Location" (id, "createdAt", "updatedAt", name, description, slug, "isActive", "sortOrder")
        VALUES ($1, NOW(), NOW(), $2, $3, $4, true, $5)
        ON CONFLICT (name) DO NOTHING;
      `, [loc.id, loc.name, loc.description, loc.slug, loc.sortOrder]);
    }
    console.log(`✓ 插入 ${locations.length} 个地点配置`);

    // 6. 插入初始数据 - 菜系
    const cuisines = [
      { id: "cui_chuan", name: "川菜", slug: "chuan", description: "四川菜系", sortOrder: 1 },
      { id: "cui_yue", name: "粤菜", slug: "yue", description: "广东菜系", sortOrder: 2 },
      { id: "cui_xiang", name: "湘菜", slug: "xiang", description: "湖南菜系", sortOrder: 3 },
      { id: "cui_su", name: "苏菜", slug: "su", description: "江苏菜系", sortOrder: 4 },
      { id: "cui_zhe", name: "浙菜", slug: "zhe", description: "浙江菜系", sortOrder: 5 },
      { id: "cui_min", name: "闽菜", slug: "min", description: "福建菜系", sortOrder: 6 },
      { id: "cui_hui", name: "徽菜", slug: "hui", description: "安徽菜系", sortOrder: 7 },
      { id: "cui_lu", name: "鲁菜", slug: "lu", description: "山东菜系", sortOrder: 8 },
      { id: "cui_dongbei", name: "东北菜", slug: "dongbei", description: "东北菜系", sortOrder: 9 },
      { id: "cui_jiachang", name: "家常菜", slug: "jiachang", description: "家常菜", sortOrder: 10 },
    ];

    for (const cui of cuisines) {
      await client.query(`
        INSERT INTO "Cuisine" (id, "createdAt", "updatedAt", name, description, slug, "isActive", "sortOrder")
        VALUES ($1, NOW(), NOW(), $2, $3, $4, true, $5)
        ON CONFLICT (name) DO NOTHING;
      `, [cui.id, cui.name, cui.description, cui.slug, cui.sortOrder]);
    }
    console.log(`✓ 插入 ${cuisines.length} 个菜系配置`);

    console.log("\n✅ 配置表创建完成！");
  } catch (error) {
    console.error("❌ 创建失败:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
