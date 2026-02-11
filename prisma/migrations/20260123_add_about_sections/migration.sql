-- CreateTable
CREATE TABLE "AboutSection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "titleZh" TEXT NOT NULL,
    "contentZh" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AboutSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AboutSectionTranslation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sectionId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "AboutSectionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AboutSection_sortOrder_idx" ON "AboutSection"("sortOrder");

-- CreateIndex
CREATE INDEX "AboutSection_isActive_idx" ON "AboutSection"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AboutSectionTranslation_sectionId_locale_key" ON "AboutSectionTranslation"("sectionId", "locale");

-- CreateIndex
CREATE INDEX "AboutSectionTranslation_locale_idx" ON "AboutSectionTranslation"("locale");

-- AddForeignKey
ALTER TABLE "AboutSectionTranslation" ADD CONSTRAINT "AboutSectionTranslation_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "AboutSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
