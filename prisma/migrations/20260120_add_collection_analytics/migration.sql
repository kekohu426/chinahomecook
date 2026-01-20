-- Add analytics fields to Collection table
ALTER TABLE "Collection" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Collection" ADD COLUMN "lastViewedAt" TIMESTAMP(3);

-- Add index for analytics queries
CREATE INDEX "Collection_viewCount_idx" ON "Collection"("viewCount" DESC);
