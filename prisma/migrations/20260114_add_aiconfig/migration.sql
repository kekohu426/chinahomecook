-- 添加 AIConfig 表
CREATE TABLE IF NOT EXISTS "AIConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    -- 文本生成模型
    "textProvider" TEXT,
    "textApiKey" TEXT,
    "textBaseUrl" TEXT,
    "textModel" TEXT,

    -- 图像生成模型
    "imageProvider" TEXT,
    "imageApiKey" TEXT,
    "imageBaseUrl" TEXT,
    "imageModel" TEXT,
    "imageNegativePrompt" TEXT,

    -- 翻译模型
    "transProvider" TEXT,
    "transApiKey" TEXT,
    "transBaseUrl" TEXT,
    "transModel" TEXT,

    -- 提示词模板
    "recipePrompt" TEXT,
    "recipeSystemPrompt" TEXT,
    "transPrompt" TEXT,
    "seoPrompt" TEXT,

    CONSTRAINT "AIConfig_pkey" PRIMARY KEY ("id")
);
