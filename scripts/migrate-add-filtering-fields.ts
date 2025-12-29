/**
 * 手动迁移脚本：添加筛选和搜索字段
 *
 * 添加字段：
 * - location (String?)
 * - cuisine (String?)
 * - mainIngredients (String[])
 * - slug (String @unique)
 * - coverImage (String?)
 * - aiGenerated (Boolean)
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
    console.log("开始迁移...");

    // 1. 添加 location 字段
    await client.query(`
      ALTER TABLE "Recipe"
      ADD COLUMN IF NOT EXISTS "location" TEXT;
    `);
    console.log("✓ 添加 location 字段");

    // 2. 添加 cuisine 字段
    await client.query(`
      ALTER TABLE "Recipe"
      ADD COLUMN IF NOT EXISTS "cuisine" TEXT;
    `);
    console.log("✓ 添加 cuisine 字段");

    // 3. 添加 mainIngredients 字段（数组）
    await client.query(`
      ALTER TABLE "Recipe"
      ADD COLUMN IF NOT EXISTS "mainIngredients" TEXT[] DEFAULT '{}';
    `);
    console.log("✓ 添加 mainIngredients 字段");

    // 4. 添加 slug 字段（唯一）
    await client.query(`
      ALTER TABLE "Recipe"
      ADD COLUMN IF NOT EXISTS "slug" TEXT;
    `);
    console.log("✓ 添加 slug 字段");

    // 5. 为已存在的记录生成 slug（基于 id）
    await client.query(`
      UPDATE "Recipe"
      SET "slug" = 'recipe-' || id
      WHERE "slug" IS NULL;
    `);
    console.log("✓ 为现有记录生成 slug");

    // 6. 设置 slug 为 NOT NULL 并添加唯一约束
    await client.query(`
      DO $$
      BEGIN
        ALTER TABLE "Recipe" ALTER COLUMN "slug" SET NOT NULL;
      EXCEPTION
        WHEN OTHERS THEN NULL;
      END $$;
    `);

    await client.query(`
      DO $$
      BEGIN
        ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_slug_key" UNIQUE ("slug");
      EXCEPTION
        WHEN duplicate_table THEN NULL;
      END $$;
    `);
    console.log("✓ 设置 slug 约束");

    // 7. 添加 coverImage 字段
    await client.query(`
      ALTER TABLE "Recipe"
      ADD COLUMN IF NOT EXISTS "coverImage" TEXT;
    `);
    console.log("✓ 添加 coverImage 字段");

    // 8. 添加 aiGenerated 字段
    await client.query(`
      ALTER TABLE "Recipe"
      ADD COLUMN IF NOT EXISTS "aiGenerated" BOOLEAN DEFAULT false;
    `);
    console.log("✓ 添加 aiGenerated 字段");

    // 9. 创建索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Recipe_location_idx" ON "Recipe"("location");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Recipe_cuisine_idx" ON "Recipe"("cuisine");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Recipe_mainIngredients_idx" ON "Recipe"("mainIngredients");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Recipe_slug_idx" ON "Recipe"("slug");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Recipe_aiGenerated_idx" ON "Recipe"("aiGenerated");
    `);
    console.log("✓ 创建索引");

    console.log("\n✅ 迁移完成！");
  } catch (error) {
    console.error("❌ 迁移失败:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
