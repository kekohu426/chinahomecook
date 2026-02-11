/**
 * 食谱详情页 - 客户端组件
 * 
 * 处理客户端交互：长图下载、打印等功能
 */

"use client";

import { useState } from "react";
import type { Recipe } from "@/types/recipe";
import { downloadLongImage, printLongImage } from "@/lib/recipe-utils";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { t } from "@/lib/i18n/translations";

interface RecipeContentProps {
    recipe: Recipe;
    stepImages: Record<string, string | undefined>;
}

export function RecipeContent({ recipe, stepImages }: RecipeContentProps) {
    const locale = useLocale();
    const [isDownloadingLongImage, setIsDownloadingLongImage] = useState(false);
    const [isPrintingLongImage, setIsPrintingLongImage] = useState(false);

    // 下载长图
    const handleDownloadLongImage = async () => {
        setIsDownloadingLongImage(true);
        const success = await downloadLongImage(recipe.titleZh, "steps-container");
        if (!success) {
            alert(t("recipe.downloadImageFailed", locale));
        }
        setIsDownloadingLongImage(false);
    };

    // 打印长图
    const handlePrintLongImage = async () => {
        setIsPrintingLongImage(true);
        const success = await printLongImage("steps-container");
        if (!success) {
            alert(t("recipe.printImageFailed", locale));
        }
        setIsPrintingLongImage(false);
    };

    return (
        <>
            {/* 制作步骤标题 + 进度标签 + 操作按钮 */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-serif font-medium text-textDark">
                        {t("recipe.steps", locale)}
                    </h2>
                    <span className="text-xs px-2 py-1 rounded-full bg-orangeAccent/10 text-brownWarm font-semibold">
                        {t("recipe.stepsCount", locale).replace("{count}", String(recipe.steps.length))}
                    </span>
                </div>

                {/* 右侧操作按钮 */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDownloadLongImage}
                        disabled={isDownloadingLongImage}
                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-brownWarm/30 text-brownDark hover:bg-brownWarm/5 rounded-button transition-colors disabled:opacity-50"
                    >
                        <span className="text-lg">{isDownloadingLongImage ? "⏳" : "📥"}</span>
                        <span className="text-sm font-medium">
                            {isDownloadingLongImage
                                ? t("recipe.preparing", locale)
                                : t("recipe.downloadImage", locale)}
                        </span>
                    </button>
                    <button
                        onClick={handlePrintLongImage}
                        disabled={isPrintingLongImage}
                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-brownWarm/30 text-brownDark hover:bg-brownWarm/5 rounded-button transition-colors disabled:opacity-50"
                    >
                        <span className="text-lg">{isPrintingLongImage ? "⏳" : "🖨️"}</span>
                        <span className="text-sm font-medium">
                            {isPrintingLongImage
                                ? t("recipe.preparingPrint", locale)
                                : t("recipe.printImage", locale)}
                        </span>
                    </button>
                </div>
            </div>

            {/* 步骤容器 - 用于生成长图 */}
            <div id="steps-container">
                {/* 步骤卡片列表 */}
                {recipe.steps.map((step, index) => {
                    // 使用步骤内的 imageUrl
                    const stepImageUrl = step.imageUrl;

                    // 动态导入 StepCard 组件
                    const StepCard = require("@/components/recipe/StepCard").StepCard;

                    return (
                        <StepCard
                            key={step.id}
                            step={step}
                            stepNumber={index + 1}
                            imageUrl={stepImageUrl}
                        />
                    );
                })}
            </div>
        </>
    );
}
