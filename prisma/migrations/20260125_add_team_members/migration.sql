-- CreateTable: TeamMember
-- 团队成员表，用于关于我们页面展示和食谱内容归属

CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "bioZh" TEXT,
    "bioEn" TEXT,
    "mottoZh" TEXT,
    "mottoEn" TEXT,
    "avatarUrl" TEXT,
    "specialtyCuisines" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specialtyRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_slug_key" ON "TeamMember"("slug");

-- CreateIndex
CREATE INDEX "TeamMember_role_isActive_idx" ON "TeamMember"("role", "isActive");

-- CreateIndex
CREATE INDEX "TeamMember_sortOrder_idx" ON "TeamMember"("sortOrder");

-- AlterTable: Recipe - 添加内容归属字段
ALTER TABLE "Recipe" ADD COLUMN "explorerId" TEXT;
ALTER TABLE "Recipe" ADD COLUMN "reviewerId" TEXT;

-- CreateIndex
CREATE INDEX "Recipe_explorerId_idx" ON "Recipe"("explorerId");

-- CreateIndex
CREATE INDEX "Recipe_reviewerId_idx" ON "Recipe"("reviewerId");

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_explorerId_fkey"
    FOREIGN KEY ("explorerId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
