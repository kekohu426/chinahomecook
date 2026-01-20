/**
 * 食谱详情页 - 客户端组件
 *
 * 完全复刻设计稿：
 * - 顶部：大图 + 标题 + 份量选择器
 * - 下方：左右分栏布局
 */

"use client";

import { useEffect, useRef, useState } from "react";
import type { Recipe } from "@/types/recipe";
import { DIFFICULTY_TO_LABEL } from "@/types/recipe";
import { CoverImage } from "@/components/ui/SafeImage";
import { CookModeModal } from "@/components/recipe/CookModeModal";
import { StepCardNew } from "@/components/recipe/StepCardNew";
import { useIngredientIcons } from "@/hooks/use-ingredient-icons";
import { matchIngredientIcon } from "@/lib/ingredient-icons";
import { cn } from "@/lib/utils";
import { Clock, Flame, ChefHat, Zap, Heart, Share2, Download, Play, Loader2, Printer } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface RecipeDetailClientProps {
  recipe: Recipe;
  coverImage?: string | null;
  stepImages: Record<string, string | undefined>;
}

export function RecipeDetailClient({
  recipe,
  coverImage,
  stepImages,
}: RecipeDetailClientProps) {
  const locale = useLocale();
  const isEn = locale === "en";
  const {
    summary,
    story,
    ingredients,
    steps,
    nutrition,
    faq,
    tips,
    troubleshooting,
    pairing,
    notes,
  } = recipe;
  const displayTitle = isEn && recipe.titleEn ? recipe.titleEn : recipe.titleZh;

  // Helper to safely get story content from string | RecipeStory union
  const getStoryContent = () => {
    if (!story) return "";
    if (typeof story === "string") return story;
    return story.content || "";
  };
  const formatMinutes = (mins: number) => (isEn ? `${mins} min` : `${mins}分钟`);
  const formatDifficulty = (value?: string) => {
    if (!value) return isEn ? "Easy" : "简单";
    if (isEn) {
      if (value === "easy" || value === "简单") return "Easy";
      if (value === "medium" || value === "中等") return "Medium";
      if (value === "hard" || value === "困难") return "Hard";
      return value;
    }
    return DIFFICULTY_TO_LABEL[value as keyof typeof DIFFICULTY_TO_LABEL] || value;
  };

  const nutritionSource = nutrition?.perServing || nutrition || {};
  const nutritionItems = [
    { key: "calories", label: isEn ? "Calories" : "热量", unit: "kcal" },
    { key: "protein", label: isEn ? "Protein" : "蛋白质", unit: "g" },
    { key: "fat", label: isEn ? "Fat" : "脂肪", unit: "g" },
    { key: "carbs", label: isEn ? "Carbs" : "碳水", unit: "g" },
    { key: "fiber", label: isEn ? "Fiber" : "膳食纤维", unit: "g" },
    { key: "sodium", label: isEn ? "Sodium" : "钠", unit: "mg" },
  ];
  const hasNutrition = nutritionItems.some(
    (item) => typeof (nutritionSource as any)[item.key] === "number"
  );

  // 份量选择器
  const baseServings = summary.servings || 4;
  const servingOptions = [2, 4, 8];
  const [servings, setServings] = useState(
    servingOptions.includes(baseServings) ? baseServings : 4
  );

  // 烹饪模式
  const [cookModeOpen, setCookModeOpen] = useState(false);

  // 下载/打印状态
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // 食材图标
  const { icons } = useIngredientIcons();

  // 将图片转为 base64（通过代理解决跨域）
  const imageToBase64 = async (imgSrc: string): Promise<string> => {
    try {
      // 使用 fetch 通过代理获取图片
      const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(imgSrc)}`);
      if (!response.ok) return imgSrc;
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(imgSrc);
        reader.readAsDataURL(blob);
      });
    } catch {
      return imgSrc;
    }
  };

  // 下载食谱长图
  const handleDownloadRecipe = async () => {
    if (!contentRef.current || isDownloading) return;

    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;

      const element = contentRef.current;

      // 保存原始样式
      const originalStyles = {
        width: element.style.width,
        minWidth: element.style.minWidth,
        maxWidth: element.style.maxWidth,
      };

      // 设置固定宽度，模拟桌面端布局（需要 >= 1024px 才能触发 lg 断点）
      element.style.width = "1100px";
      element.style.minWidth = "1100px";
      element.style.maxWidth = "1100px";

      // 等待布局重排
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 生成 canvas，使用 proxy 处理跨域图片
      const canvas = await html2canvas(element, {
        backgroundColor: "#FDF8F3",
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 30000,
        proxy: "/api/proxy-image",
        onclone: (clonedDoc, clonedElement) => {
          // 强制设置桌面端布局样式
          const container = clonedElement.querySelector(".flex.flex-col.lg\\:flex-row") as HTMLElement;
          if (container) {
            container.style.flexDirection = "row";
            container.style.gap = "2rem";
          }

          // 强制左侧宽度
          const leftSide = clonedElement.querySelector(".lg\\:w-\\[380px\\]") as HTMLElement;
          if (leftSide) {
            leftSide.style.width = "380px";
            leftSide.style.flexShrink = "0";
          }

          // 强制右侧 flex-1
          const rightSide = clonedElement.querySelector(".flex-1.min-w-0") as HTMLElement;
          if (rightSide) {
            rightSide.style.flex = "1";
            rightSide.style.minWidth = "0";
          }

          // 隐藏所有操作按钮（收藏、分享、下载、开始烹饪模式）
          const buttons = clonedDoc.querySelectorAll("button");
          buttons.forEach((btn) => {
            const text = (btn.textContent || "").toLowerCase();
            if (
              text.includes("开始烹饪模式") ||
              text.includes("收藏") ||
              text.includes("分享") ||
              text.includes("下载") ||
              text.includes("start cook mode") ||
              text.includes("start cooking mode") ||
              text.includes("save") ||
              text.includes("share") ||
              text.includes("download") ||
              text.includes("print")
            ) {
              btn.style.display = "none";
            }
          });

          // 隐藏操作按钮容器（收藏、分享、下载那一行）
          const buttonContainer = clonedElement.querySelector(".flex.items-center.gap-3") as HTMLElement;
          if (buttonContainer && buttonContainer.querySelector("button")) {
            buttonContainer.style.display = "none";
          }

          // 确保所有步骤都显示（移除可能的 overflow hidden）
          const stepsContainer = clonedElement.querySelector(".space-y-6") as HTMLElement;
          if (stepsContainer) {
            stepsContainer.style.overflow = "visible";
            stepsContainer.style.maxHeight = "none";
          }

          // 替换 oklch 颜色为兼容格式
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            const styles = window.getComputedStyle(el);
            const htmlEl = el as HTMLElement;

            // 替换常见的颜色属性
            ["color", "backgroundColor", "borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor"].forEach((prop) => {
              const value = styles.getPropertyValue(prop.replace(/([A-Z])/g, "-$1").toLowerCase());
              if (value && value.includes("oklch")) {
                // 使用回退颜色
                if (prop === "backgroundColor") {
                  htmlEl.style.backgroundColor = "#FDF8F3";
                } else if (prop === "color") {
                  htmlEl.style.color = "#1c1917";
                } else {
                  htmlEl.style.setProperty(prop.replace(/([A-Z])/g, "-$1").toLowerCase(), "#d6d3d1");
                }
              }
            });
          });
        },
      });

      // 恢复原始样式
      element.style.width = originalStyles.width;
      element.style.minWidth = originalStyles.minWidth;
      element.style.maxWidth = originalStyles.maxWidth;

      // 转为图片并下载
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${displayTitle}${isEn ? "-recipe" : "-食谱"}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("下载失败:", error);
      alert(isEn ? "Download failed. Please try again." : "下载失败，请稍后重试");
    } finally {
      setIsDownloading(false);
    }
  };

  // 打印食谱
  const handlePrintRecipe = () => {
    if (!contentRef.current || isPrinting) return;

    setIsPrinting(true);

    // 创建打印窗口
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert(
        isEn
          ? "Please allow pop-ups to print the recipe."
          : "请允许弹出窗口以打印食谱"
      );
      setIsPrinting(false);
      return;
    }

    // 获取步骤图片
    const getStepImage = (step: typeof steps[0]): string | undefined => {
      if (step.imageUrl) return step.imageUrl;
      const imageShot = recipe.imageShots?.find((shot) => {
        if (shot.key === step.id) return true;
        const stepNum = step.id.replace(/\D/g, "");
        const shotNum = shot.key.replace(/\D/g, "");
        if (stepNum && shotNum && stepNum === shotNum) return true;
        return false;
      });
      return imageShot?.imageUrl;
    };

    // 构建打印内容
    const difficultyLabel = formatDifficulty(summary.difficulty);
    const servingsLabel = isEn ? "servings" : "人份";
    const prepLabel = isEn ? "Prep time" : "准备时间";
    const cookLabel = isEn ? "Cook time" : "烹饪时间";
    const difficultyText = isEn ? "Difficulty" : "难度";
    const servingsText = isEn ? "Servings" : "份量";
    const aboutTitle = isEn ? "About this dish:" : "关于这道菜：";
    const ingredientsTitle = isEn ? "Ingredients" : "食材清单";
    const mainLabel = isEn ? "Main" : "主料";
    const extraLabel = isEn ? "Extras" : "辅料";
    const stepsTitle = isEn ? "Steps" : "制作步骤";
    const stepLabel = isEn ? "Step" : "步骤";
    const checkLabel = isEn ? "Check:" : "状态检查：";
    const pitfallLabel = isEn ? "Pitfall:" : "失败点：";
    const printedAtLabel = isEn ? "Printed at" : "打印时间";
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${displayTitle} - ${isEn ? "Recipe" : "食谱"}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #1c1917; }
          h1 { font-size: 28px; margin-bottom: 20px; }
          h2 { font-size: 20px; margin: 20px 0 10px; border-bottom: 2px solid #E86F2C; padding-bottom: 5px; }
          h3 { font-size: 16px; margin: 15px 0 8px; }
          .cover-image { width: 100%; max-height: 320px; height: auto; object-fit: contain; background: #f5f5f4; border-radius: 12px; margin-bottom: 20px; display: block; }
          .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
          .info-item { text-align: center; padding: 10px; background: #f5f5f4; border-radius: 8px; }
          .info-label { font-size: 12px; color: #78716c; }
          .info-value { font-size: 14px; font-weight: 500; }
          .story { background: #fafaf9; padding: 15px; border-radius: 8px; margin-bottom: 20px; line-height: 1.6; }
          .summary { background: #fff7ed; padding: 12px 15px; border-radius: 8px; margin-bottom: 20px; line-height: 1.6; }
          .ingredients { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .ingredient-section h3 { color: #78716c; }
          .ingredient-list { list-style: none; }
          .ingredient-item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #e7e5e4; }
          .ingredient-amount { color: #E86F2C; font-weight: 500; }
          .step { margin-bottom: 20px; padding: 15px; background: #fafaf9; border-radius: 8px; page-break-inside: avoid; }
          .step-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
          .step-number { color: #E86F2C; font-weight: bold; }
          .step-title { font-weight: 500; }
          .step-image { width: 100%; max-height: 240px; height: auto; object-fit: contain; background: #f5f5f4; border-radius: 8px; margin-bottom: 10px; display: block; }
          .step-action { line-height: 1.6; margin-bottom: 10px; }
          .step-tip { font-size: 13px; padding: 8px; border-radius: 4px; margin-top: 8px; }
          .step-tip.success { background: #dcfce7; color: #166534; }
          .step-tip.warning { background: #fef3c7; color: #92400e; }
          .section-card { background: #fafaf9; padding: 12px 15px; border-radius: 8px; margin-bottom: 16px; }
          .list { list-style: none; }
          .list li { margin-bottom: 6px; line-height: 1.6; }
          .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; background: #f5f5f4; color: #78716c; margin-right: 6px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #a8a29e; }
          @media print {
            body { padding: 0; }
            .step { break-inside: avoid; }
            .cover-image { max-height: 260px; }
            .step-image { max-height: 200px; }
          }
        </style>
      </head>
      <body>
        ${coverImage ? `<img src="${coverImage}" alt="${displayTitle}" class="cover-image" />` : ""}

        <h1>${displayTitle}</h1>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">${prepLabel}</div>
            <div class="info-value">${formatMinutes(summary.timeActiveMin || 15)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">${cookLabel}</div>
            <div class="info-value">${formatMinutes((summary.timeTotalMin || 30) - (summary.timeActiveMin || 15))}</div>
          </div>
          <div class="info-item">
            <div class="info-label">${difficultyText}</div>
            <div class="info-value">${difficultyLabel}</div>
          </div>
          <div class="info-item">
            <div class="info-label">${servingsText}</div>
            <div class="info-value">${servings} ${servingsLabel}</div>
          </div>
        </div>

        <div class="summary">
          <strong>${isEn ? "Summary:" : "摘要："}</strong>
          ${summary.oneLine || ""}
          ${summary.healingTone ? `<div>${summary.healingTone}</div>` : ""}
        </div>

        <div class="story">
          <strong>${aboutTitle}</strong>
          ${getStoryContent() || summary.oneLine}
        </div>

        <h2>${ingredientsTitle}</h2>
        <div class="ingredients">
          <div class="ingredient-section">
            <h3>${mainLabel}</h3>
            <ul class="ingredient-list">
              ${mainIngredients.map(item => `
                <li class="ingredient-item">
                  <span>${item.name}</span>
                  <span class="ingredient-amount">${calculateAmount(item.amount)}${item.unit}</span>
                </li>
              `).join("")}
            </ul>
          </div>
          <div class="ingredient-section">
            <h3>${extraLabel}</h3>
            <ul class="ingredient-list">
              ${subIngredients.map(item => `
                <li class="ingredient-item">
                  <span>${item.name}</span>
                  <span class="ingredient-amount">${calculateAmount(item.amount)}${item.unit}</span>
                </li>
              `).join("")}
            </ul>
          </div>
        </div>

        <h2>${stepsTitle}</h2>
        ${steps.map((step, index) => {
          const stepImage = getStepImage(step);
          return `
            <div class="step">
              <div class="step-header">
                <span class="step-number">${stepLabel.toUpperCase()} ${String(index + 1).padStart(2, "0")}</span>
                <span class="step-title">${step.title}</span>
                ${(step.timerSec ?? 0) > 0 ? `<span style="color: #78716c; font-size: 12px;">⏱ ${formatMinutes(Math.floor((step.timerSec ?? 0) / 60))}</span>` : ""}
              </div>
              ${stepImage ? `<img src="${stepImage}" alt="${stepLabel} ${index + 1}" class="step-image" />` : ""}
              <div class="step-action">${step.action}</div>
              ${step.visualCue ? `<div class="step-tip success">✓ ${checkLabel}${step.visualCue}</div>` : ""}
              ${step.failPoint ? `<div class="step-tip warning">⚠ ${pitfallLabel}${step.failPoint}</div>` : ""}
            </div>
          `;
        }).join("")}

        ${hasNutrition ? `
          <h2>${isEn ? "Nutrition" : "营养信息"}</h2>
          <div class="section-card">
            ${nutritionItems.map((item) => {
              const value = (nutritionSource as any)[item.key];
              if (typeof value !== "number") return "";
              return `<span class="pill">${item.label}: ${value}${item.unit}</span>`;
            }).join("")}
            ${nutrition?.dietaryLabels?.length ? `<div style="margin-top:8px;">${nutrition.dietaryLabels.map((label) => `<span class="pill">${label}</span>`).join("")}</div>` : ""}
            ${nutrition?.disclaimer ? `<div style="margin-top:8px; color:#78716c; font-size:12px;">${nutrition.disclaimer}</div>` : ""}
          </div>
        ` : ""}

        ${Array.isArray(tips) && tips.length > 0 ? `
          <h2>${isEn ? "Tips" : "小贴士"}</h2>
          <div class="section-card">
            <ul class="list">
              ${tips.map((tip) => `<li>• ${tip}</li>`).join("")}
            </ul>
          </div>
        ` : ""}

        ${Array.isArray(troubleshooting) && troubleshooting.length > 0 ? `
          <h2>${isEn ? "Troubleshooting" : "失败排查"}</h2>
          <div class="section-card">
            <ul class="list">
              ${troubleshooting.map((item) => `<li>• ${item.problem}: ${item.fix || item.solution || ""}</li>`).join("")}
            </ul>
          </div>
        ` : ""}

        ${Array.isArray(faq) && faq.length > 0 ? `
          <h2>${isEn ? "FAQ" : "常见问题"}</h2>
          <div class="section-card">
            <ul class="list">
              ${faq.map((item) => `<li><strong>Q:</strong> ${item.question}<br/><strong>A:</strong> ${item.answer}</li>`).join("")}
            </ul>
          </div>
        ` : ""}

        ${Array.isArray(notes) && notes.length > 0 ? `
          <h2>${isEn ? "Notes" : "备注"}</h2>
          <div class="section-card">
            <ul class="list">
              ${notes.map((note) => `<li>• ${note}</li>`).join("")}
            </ul>
          </div>
        ` : ""}

        <div class="footer">
          Recipe Zen - ${displayTitle} | ${printedAtLabel}: ${new Date().toLocaleDateString(isEn ? "en-US" : "zh-CN")}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // 等待内容和图片加载完成后打印
    printWindow.onload = () => {
      // 给图片额外加载时间
      setTimeout(() => {
        printWindow.print();
        setIsPrinting(false);
      }, 500);
    };

    // 备用：如果 onload 不触发
    setTimeout(() => {
      if (isPrinting) {
        printWindow.print();
        setIsPrinting(false);
      }
    }, 2000);
  };

  // 计算食材数量
  const calculateAmount = (baseAmount: number): number => {
    const ratio = servings / baseServings;
    return Math.round(baseAmount * ratio * 10) / 10;
  };

  // 分离主料和辅料
  const isMainSection = (section: string) =>
    section.includes("主料") || section.toLowerCase().includes("main");
  const mainSection =
    ingredients.find((section) => isMainSection(section.section)) || ingredients[0];
  const mainIngredients = mainSection?.items || [];
  const subIngredients = ingredients
    .filter((section) => section !== mainSection)
    .flatMap((section) => section.items || []);
  const hasExtras = subIngredients.length > 0;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSave = () => {
    setSaved((prev) => {
      const next = !prev;
      setToast(
        next
          ? isEn
            ? "Saved to your favorites."
            : "已加入收藏"
          : isEn
          ? "Removed from favorites."
          : "已取消收藏"
      );
      return next;
    });
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    if (!shareUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: displayTitle,
          url: shareUrl,
        });
        setToast(isEn ? "Share opened." : "已打开分享");
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast(isEn ? "Link copied." : "链接已复制");
    } catch {
      setToast(isEn ? "Share failed." : "分享失败");
    }
  };

  return (
    <>
      {/* 顶部大图区 */}
      <section className="relative">
        {/* 背景图 */}
        <div className="relative h-[400px] overflow-hidden">
          {coverImage ? (
            <CoverImage src={coverImage} alt={displayTitle} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-100 via-orange-50 to-amber-100" />
          )}
          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* 标题 + 份量选择器 */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-serif font-medium text-white mb-4 drop-shadow-lg">
              {displayTitle}
            </h1>
            {/* 份量选择器 */}
            <div className="inline-flex bg-black/30 backdrop-blur-sm rounded-full p-1">
              {servingOptions.map((size) => (
                <button
                  key={size}
                  onClick={() => setServings(size)}
                  className={cn(
                    "px-5 py-2 rounded-full text-sm font-medium transition-all",
                    servings === size
                      ? "bg-[#E86F2C] text-white"
                      : "text-white/80 hover:text-white"
                  )}
                >
                  {size}
                  {locale === "en" ? " servings" : "人"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 主内容区：左右分栏 - 用于截图 */}
      <section ref={contentRef} className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧：信息区域 */}
          <div className="lg:w-[380px] flex-shrink-0 space-y-6">
            {/* 食谱信息卡片 */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
              <h3 className="text-lg font-medium text-stone-800 mb-4">
                {locale === "en" ? "Recipe Info" : "食谱信息"}
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {/* 准备时间 */}
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-stone-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-stone-600" />
                  </div>
                  <div className="text-xs text-stone-500">
                    {locale === "en" ? "Prep" : "准备"}
                  </div>
                  <div className="text-sm font-medium text-stone-800">
                    {summary.timeActiveMin || 15}
                    {locale === "en" ? " min" : "分钟"}
                  </div>
                </div>
                {/* 烹饪时间 */}
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-stone-100 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-stone-600" />
                  </div>
                  <div className="text-xs text-stone-500">
                    {locale === "en" ? "Cook" : "烹饪"}
                  </div>
                  <div className="text-sm font-medium text-stone-800">
                    {(summary.timeTotalMin || 30) - (summary.timeActiveMin || 15)}
                    {locale === "en" ? " min" : "分钟"}
                  </div>
                </div>
                {/* 难度 */}
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-stone-100 flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-stone-600" />
                  </div>
                  <div className="text-xs text-stone-500">
                    {locale === "en" ? "Difficulty" : "难度"}
                  </div>
                  <div className="text-sm font-medium text-stone-800">
                    {formatDifficulty(summary.difficulty)}
                  </div>
                </div>
                {/* 卡路里 */}
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-stone-100 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-stone-600" />
                  </div>
                  <div className="text-xs text-stone-500">
                    {locale === "en" ? "Calories" : "热量"}
                  </div>
                  <div className="text-sm font-medium text-stone-800">
                    {(summary as any).calories || "180"}
                    {locale === "en" ? " kcal/serving" : "卡/份"}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-stone-400">
                {locale === "en"
                  ? `Based on ${baseServings} servings.`
                  : `基于 ${baseServings} 人份。`}
              </p>
            </div>

            {/* 关于这道菜 */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
              <h3 className="text-lg font-medium text-stone-800 mb-3">
                {locale === "en" ? "About this dish" : "关于这道菜"}
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                {getStoryContent() || summary.oneLine}
              </p>
            </div>

            {/* 食材清单 */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
              <h3 className="text-lg font-medium text-stone-800 mb-4">
                {locale === "en"
                  ? `Ingredients (${servings} servings)`
                  : `食材清单（${servings}人份）`}
              </h3>

              <div className={`grid gap-6 ${hasExtras ? "grid-cols-2" : "grid-cols-1"}`}>
                {/* 主料 */}
                <div>
                  <h4 className="text-sm font-medium text-stone-700 mb-3">
                    {locale === "en" ? "Main" : "主料"}
                  </h4>
                  <ul className="space-y-2">
                    {mainIngredients.map((item, idx) => {
                      const iconUrl = matchIngredientIcon(item.name, icons);
                      return (
                        <li key={idx} className="flex items-center gap-2">
                          {iconUrl ? (
                            <img
                              src={iconUrl}
                              alt={item.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-amber-100" />
                          )}
                          <span className="text-sm text-stone-700 flex-1">{item.name}</span>
                          <span className="text-sm text-[#E86F2C] font-medium">
                            {calculateAmount(item.amount)}{item.unit}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* 辅料 */}
                {hasExtras && (
                  <div>
                    <h4 className="text-sm font-medium text-stone-700 mb-3">
                      {locale === "en" ? "Extras" : "辅料"}
                    </h4>
                    <ul className="space-y-2">
                      {subIngredients.map((item, idx) => {
                        const iconUrl = matchIngredientIcon(item.name, icons);
                        return (
                          <li key={idx} className="flex items-center gap-2">
                            {iconUrl ? (
                              <img
                                src={iconUrl}
                                alt={item.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-stone-100" />
                            )}
                            <span className="text-sm text-stone-700 flex-1">{item.name}</span>
                            <span className="text-sm text-[#E86F2C] font-medium">
                              {calculateAmount(item.amount)}{item.unit}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-full text-sm text-stone-600 hover:bg-stone-50 transition-colors"
              >
                <Heart className={`w-4 h-4 ${saved ? "fill-[#E86F2C] text-[#E86F2C]" : ""}`} />
                {locale === "en" ? (saved ? "Saved" : "Save") : saved ? "已收藏" : "收藏"}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-full text-sm text-stone-600 hover:bg-stone-50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                {locale === "en" ? "Share" : "分享"}
              </button>
              <button
                onClick={handleDownloadRecipe}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-full text-sm text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {locale === "en" ? "Download" : "下载食谱"}
              </button>
              <button
                onClick={handlePrintRecipe}
                disabled={isPrinting}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-full text-sm text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                {isPrinting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                {locale === "en" ? "Print" : "打印食谱"}
              </button>
            </div>
          </div>

          {/* 右侧：制作步骤 */}
          <div className="flex-1 min-w-0">
            {/* 标题行：制作步骤 + 开始烹饪模式按钮 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-stone-800">
                {locale === "en" ? "Steps" : "制作步骤"}
              </h2>
              <button
                onClick={() => setCookModeOpen(true)}
                className="group flex items-center gap-2 bg-[#E86F2C] hover:bg-[#D55F1C] transition-colors rounded-full px-5 py-2.5 text-white font-medium text-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                {locale === "en" ? "Start Cook Mode" : "开始烹饪模式"}
              </button>
            </div>

            <div className="space-y-6">
              {steps.map((step, index) => {
                // 匹配步骤图片
                const imageShot = recipe.imageShots?.find((shot) => {
                  if (shot.key === step.id) return true;
                  const stepNum = step.id.replace(/\D/g, "");
                  const shotNum = shot.key.replace(/\D/g, "");
                  if (stepNum && shotNum && stepNum === shotNum) return true;
                  return false;
                });

                return (
                  <StepCardNew
                    key={step.id}
                    step={step}
                    stepNumber={index + 1}
                    imageUrl={step.imageUrl || imageShot?.imageUrl}
                  />
                );
              })}
            </div>

            {/* 额外信息 */}
            <div className="mt-10 space-y-8">
              {hasNutrition && (
                <div className="bg-white rounded-2xl border border-stone-200 p-6">
                  <h3 className="text-lg font-medium text-stone-800 mb-4">
                    {isEn ? "Nutrition (per serving)" : "营养信息（每份）"}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {nutritionItems.map((item) => {
                      const value = (nutritionSource as any)[item.key];
                      if (typeof value !== "number") return null;
                      return (
                        <div
                          key={item.key}
                          className="rounded-xl bg-stone-50 px-4 py-3"
                        >
                          <div className="text-xs text-stone-500">
                            {item.label}
                          </div>
                          <div className="text-base font-semibold text-stone-800 mt-1">
                            {value}
                            <span className="text-xs font-normal text-stone-500 ml-1">
                              {item.unit}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {(nutrition?.dietaryLabels?.length || nutrition?.disclaimer) && (
                    <div className="mt-4 space-y-2 text-sm text-stone-600">
                      {nutrition?.dietaryLabels?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {nutrition.dietaryLabels.map((label) => (
                            <span
                              key={label}
                              className="px-2 py-1 rounded-full bg-stone-100 text-stone-600 text-xs"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {nutrition?.disclaimer ? (
                        <div>{nutrition.disclaimer}</div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {Array.isArray(tips) && tips.length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-200 p-6">
                  <h3 className="text-lg font-medium text-stone-800 mb-4">
                    {isEn ? "Tips" : "烹饪小贴士"}
                  </h3>
                  <ul className="space-y-2 text-sm text-stone-700">
                    {tips.map((tip, idx) => (
                      <li key={`${tip}-${idx}`} className="flex gap-2">
                        <span className="text-[#E86F2C]">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(faq) && faq.length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-200 p-6">
                  <h3 className="text-lg font-medium text-stone-800 mb-4">
                    {isEn ? "FAQ" : "常见问题"}
                  </h3>
                  <div className="space-y-4 text-sm text-stone-700">
                    {faq.map((item, idx) => (
                      <div key={`${item.question}-${idx}`}>
                        <div className="font-medium text-stone-800">
                          {item.question}
                        </div>
                        <div className="mt-1 text-stone-600">
                          {item.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(troubleshooting) && troubleshooting.length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-200 p-6">
                  <h3 className="text-lg font-medium text-stone-800 mb-4">
                    {isEn ? "Troubleshooting" : "失败排查"}
                  </h3>
                  <div className="space-y-4 text-sm text-stone-700">
                    {troubleshooting.map((item, idx) => (
                      <div key={`${item.problem}-${idx}`}>
                        <div className="font-medium text-stone-800">
                          {item.problem}
                        </div>
                        <div className="mt-1 text-stone-600">
                          {isEn ? "Cause:" : "原因："} {item.cause}
                        </div>
                        <div className="mt-1 text-stone-600">
                          {isEn ? "Fix:" : "解决："} {item.fix}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(pairing?.suggestions?.length || pairing?.sauceOrSide?.length) && (
                <div className="bg-white rounded-2xl border border-stone-200 p-6">
                  <h3 className="text-lg font-medium text-stone-800 mb-4">
                    {isEn ? "Pairing Suggestions" : "搭配建议"}
                  </h3>
                  <div className="space-y-3 text-sm text-stone-700">
                    {pairing?.suggestions?.length ? (
                      <div>
                        <div className="text-stone-500 mb-1">
                          {isEn ? "Suggestions" : "推荐搭配"}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {pairing.suggestions.map((item) => (
                            <span
                              key={item}
                              className="px-2 py-1 rounded-full bg-stone-100 text-stone-600 text-xs"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {pairing?.sauceOrSide?.length ? (
                      <div>
                        <div className="text-stone-500 mb-1">
                          {isEn ? "Sauce or Side" : "酱料/配菜"}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {pairing.sauceOrSide.map((item) => (
                            <span
                              key={item}
                              className="px-2 py-1 rounded-full bg-stone-100 text-stone-600 text-xs"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {Array.isArray(notes) && notes.length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-200 p-6">
                  <h3 className="text-lg font-medium text-stone-800 mb-4">
                    {isEn ? "Notes" : "备注"}
                  </h3>
                  <ul className="space-y-2 text-sm text-stone-700">
                    {notes.map((note, idx) => (
                      <li key={`${note}-${idx}`} className="flex gap-2">
                        <span className="text-[#E86F2C]">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 烹饪模式弹窗 */}
      <CookModeModal
        open={cookModeOpen}
        onClose={() => setCookModeOpen(false)}
        steps={steps}
        recipeTitle={displayTitle}
        stepImages={stepImages}
      />
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
    </>
  );
}
