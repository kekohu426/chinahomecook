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

interface RecipeContentProps {
    recipe: Recipe;
    stepImages: Record<string, string | undefined>;
}

export function RecipeContent({ recipe, stepImages }: RecipeContentProps) {
    const locale = useLocale();
    const isEn = locale === "en";
    const [isDownloadingLongImage, setIsDownloadingLongImage] = useState(false);
    const [isPrintingLongImage, setIsPrintingLongImage] = useState(false);

    // 下载长图
    const handleDownloadLongImage = async () => {
        setIsDownloadingLongImage(true);
        const success = await downloadLongImage(recipe.titleZh, "steps-container");
        if (!success) {
            alert(isEn ? "Download failed. Please try again." : "下载长图失败，请重试");
        }
        setIsDownloadingLongImage(false);
    };

    // 打印长图
    const handlePrintLongImage = async () => {
        setIsPrintingLongImage(true);
        const success = await printLongImage("steps-container");
        if (!success) {
            alert(isEn ? "Print failed. Please try again." : "打印长图失败，请重试");
        }
        setIsPrintingLongImage(false);
    };

    return (
        <>
            {/* 制作步骤标题 + 进度标签 + 操作按钮 */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-serif font-medium text-textDark">
                        {isEn ? "Steps" : "制作步骤"}
                    </h2>
                    <span className="text-xs px-2 py-1 rounded-full bg-orangeAccent/10 text-brownWarm font-semibold">
                        {isEn
                            ? `${recipe.steps.length} steps`
                            : `共 ${recipe.steps.length} 步`}
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
                                ? isEn
                                    ? "Preparing..."
                                    : "生成中..."
                                : isEn
                                ? "Download Image"
                                : "下载长图"}
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
                                ? isEn
                                    ? "Preparing..."
                                    : "准备中..."
                                : isEn
                                ? "Print Image"
                                : "打印长图"}
                        </span>
                    </button>
                </div>
            </div>

            {/* 步骤容器 - 用于生成长图 */}
            <div id="steps-container">
                {/* 步骤卡片列表 */}
                {recipe.steps.map((step, index) => {
                    // 尝试更灵活地匹配 imageShot
                    const imageShot = recipe.imageShots?.find((shot) => {
                        // 1. 直接匹配 key === id
                        if (shot.key === step.id) return true;
                        // 2. 尝试匹配数字部分 (例如 step01 匹配 step1)
                        const stepNum = step.id.replace(/\D/g, '');
                        const shotNum = shot.key.replace(/\D/g, '');
                        if (stepNum && shotNum && stepNum === shotNum) return true;
                        return false;
                    });

                    // 动态导入 StepCard 组件
                    const StepCard = require("@/components/recipe/StepCard").StepCard;

                    return (
                        <StepCard
                            key={step.id}
                            step={step}
                            stepNumber={index + 1}
                            imageUrl={imageShot?.imageUrl}
                        />
                    );
                })}
            </div>
        </>
    );
}
