-- Collection 扩展字段与索引迁移
-- 口径：为现有 Collection 表补充 ruleType/cached 统计/排序/关联等字段

-- 新增字段（带默认值，避免破坏性）
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "nameEn" TEXT;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "ruleType" TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "cachedMatchedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "cachedPublishedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "cachedPendingCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "cachedAt" TIMESTAMP;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "transStatus" JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "tagId" TEXT;

-- 外键约束（单标签关联 Tag）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Collection_tagId_fkey'
  ) THEN
    ALTER TABLE "Collection"
      ADD CONSTRAINT "Collection_tagId_fkey"
      FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- 唯一约束保持不变：slug 已有唯一索引

-- 索引
CREATE INDEX IF NOT EXISTS "Collection_type_status_idx" ON "Collection"("type", "status");
CREATE INDEX IF NOT EXISTS "Collection_status_cachedPublishedCount_idx" ON "Collection"("status", "cachedPublishedCount");
CREATE INDEX IF NOT EXISTS "Collection_sortOrder_idx" ON "Collection"("sortOrder");

-- 数据迁移：推断 ruleType
UPDATE "Collection"
SET "ruleType" = 'auto'
WHERE ("cuisineId" IS NOT NULL OR "locationId" IS NOT NULL OR "tagId" IS NOT NULL);

UPDATE "Collection"
SET "ruleType" = 'custom'
WHERE "cuisineId" IS NULL AND "locationId" IS NULL AND "tagId" IS NULL;

