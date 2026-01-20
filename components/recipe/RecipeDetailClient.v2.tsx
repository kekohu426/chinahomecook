/**
 * 食谱详情页 V2 - SEO 友好版本
 *
 * 设计原则:
 * - 所有内容展开,无隐藏内容
 * - 左侧固定导航(锚点链接)
 * - 右侧完整内容区域
 * - 搜索引擎可以索引所有内容
 */

"use client";

import { useEffect, useRef, useState } from "react";
import type { Recipe } from "@/types/recipe";
import { DIFFICULTY_TO_LABEL } from "@/types/recipe";
import { CoverImage } from "@/components/ui/SafeImage";
import { useIngredientIcons } from "@/hooks/use-ingredient-icons";
import { matchIngredientIcon } from "@/lib/ingredient-icons";
import { cn } from "@/lib/utils";
import {
  Clock,
  Flame,
  ChefHat,
  Heart,
  Share2,
  Printer,
  Users,
  Star,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface RecipeDetailClientV2Props {
  recipe: Recipe;
  coverImages: string[];
  stepImages: Record<string, string | undefined>;
}

export function RecipeDetailClientV2({
  recipe,
  coverImages,
  stepImages,
}: RecipeDetailClientV2Props) {
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
  } = recipe;
  const displayTitle = isEn && recipe.titleEn ? recipe.titleEn : recipe.titleZh;

  // 食材图标
  const { icons } = useIngredientIcons();

  // 下载/打印状态
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(false);

  // 轮播状态
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // 活跃的导航项
  const [activeSection, setActiveSection] = useState("ingredients");

  // 监听滚动,更新活跃导航
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["ingredients", "steps", "tips", "nutrition", "faq", "pairing"];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 自动轮播
  useEffect(() => {
    if (!isAutoPlaying || coverImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % coverImages.length);
    }, 4000); // 每4秒切换一次

    return () => clearInterval(interval);
  }, [isAutoPlaying, coverImages.length]);

  // 手动切换图片
  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
    setIsAutoPlaying(false); // 手动切换后停止自动播放
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % coverImages.length);
    setIsAutoPlaying(false);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + coverImages.length) % coverImages.length);
    setIsAutoPlaying(false);
  };

  // 滚动到指定区域
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  // 格式化时间
  const formatMinutes = (mins: number) => (isEn ? `${mins} min` : `${mins}分钟`);

  // 格式化难度
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

  // 营养信息
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

  // 下载食谱长图
  const handleDownloadRecipe = async () => {
    if (!contentRef.current || isDownloading) return;

    console.log("开始下载食谱长图...");
    setIsDownloading(true);

    try {
      console.log("导入 html2canvas...");
      const html2canvas = (await import("html2canvas")).default;

      const element = contentRef.current;
      console.log("目标元素:", element);

      // 保存原始样式
      const originalStyles = {
        width: element.style.width,
        minWidth: element.style.minWidth,
        maxWidth: element.style.maxWidth,
      };

      // 设置固定宽度
      element.style.width = "1200px";
      element.style.minWidth = "1200px";
      element.style.maxWidth = "1200px";

      // 等待布局重排
      await new Promise((resolve) => setTimeout(resolve, 300));

      console.log("开始生成 canvas...");
      // 生成 canvas
      const canvas = await html2canvas(element, {
        backgroundColor: "#FDF8F3",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 30000,
        onclone: (clonedDoc, clonedElement) => {
          console.log("克隆元素，准备处理...");

          // 隐藏所有操作按钮
          const buttons = clonedDoc.querySelectorAll("button");
          buttons.forEach((btn) => {
            const text = (btn.textContent || "").toLowerCase();
            if (
              text.includes("收藏") ||
              text.includes("分享") ||
              text.includes("下载") ||
              text.includes("打印") ||
              text.includes("save") ||
              text.includes("share") ||
              text.includes("download") ||
              text.includes("print") ||
              text.includes("已收藏") ||
              text.includes("saved")
            ) {
              btn.style.display = "none";
            }
          });

          // 隐藏操作按钮容器
          const buttonContainers = clonedElement.querySelectorAll(".flex.items-center.gap-3");
          buttonContainers.forEach((container) => {
            if (container.querySelector("button")) {
              (container as HTMLElement).style.display = "none";
            }
          });

          // 隐藏左侧导航
          const aside = clonedElement.querySelector("aside") as HTMLElement;
          if (aside) {
            aside.style.display = "none";
          }

          // 调整主内容区域宽度
          const main = clonedElement.querySelector("main") as HTMLElement;
          if (main) {
            main.style.maxWidth = "100%";
          }

          // 转换所有 oklch 颜色为标准格式
          console.log("转换 oklch 颜色...");
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const computedStyle = window.getComputedStyle(el);

            // 颜色映射表（从 Tailwind 配置）
            const colorMap: Record<string, string> = {
              // 背景色
              "oklch(0.98 0.01 85)": "#FDF8F3", // cream
              "oklch(0.95 0.02 85)": "#F5F1E8", // lightGray
              "oklch(0.45 0.12 35)": "#E86F2C", // brownWarm
              "oklch(0.25 0.02 85)": "#44403C", // textDark
              "oklch(0.55 0.01 85)": "#78716C", // textGray
              // 白色
              "oklch(1 0 0)": "#FFFFFF",
              "oklch(0.99 0 0)": "#FAFAFA",
              // 黑色
              "oklch(0 0 0)": "#000000",
              "oklch(0.1 0 0)": "#1A1A1A",
            };

            // 处理所有可能包含颜色的属性
            const colorProps = [
              "color",
              "backgroundColor",
              "borderColor",
              "borderTopColor",
              "borderRightColor",
              "borderBottomColor",
              "borderLeftColor",
              "outlineColor",
              "fill",
              "stroke",
            ];

            colorProps.forEach((prop) => {
              const value = computedStyle.getPropertyValue(
                prop.replace(/([A-Z])/g, "-$1").toLowerCase()
              );

              if (value && value.includes("oklch")) {
                // 尝试从映射表中查找
                const mappedColor = colorMap[value.trim()];
                if (mappedColor) {
                  htmlEl.style.setProperty(
                    prop.replace(/([A-Z])/g, "-$1").toLowerCase(),
                    mappedColor
                  );
                } else {
                  // 使用默认颜色
                  if (prop === "backgroundColor") {
                    htmlEl.style.backgroundColor = "#FFFFFF";
                  } else if (prop === "color") {
                    htmlEl.style.color = "#1c1917";
                  } else {
                    htmlEl.style.setProperty(
                      prop.replace(/([A-Z])/g, "-$1").toLowerCase(),
                      "#d6d3d1"
                    );
                  }
                }
              }
            });
          });
          console.log("颜色转换完成");
        },
      });

      console.log("Canvas 生成成功，尺寸:", canvas.width, "x", canvas.height);

      // 恢复原始样式
      element.style.width = originalStyles.width;
      element.style.minWidth = originalStyles.minWidth;
      element.style.maxWidth = originalStyles.maxWidth;

      // 转为图片并下载
      console.log("转换为图片...");
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${displayTitle}${isEn ? "-recipe" : "-食谱"}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("下载完成！");
    } catch (error) {
      console.error("下载失败，详细错误:", error);
      alert(isEn ? `Download failed: ${error}` : `下载失败: ${error}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // 打印食谱
  const handlePrintRecipe = () => {
    if (isPrinting) return;

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

    // 构建打印内容
    const difficultyLabel = formatDifficulty(summary.difficulty);
    const servingsLabel = isEn ? "servings" : "人份";
    const prepLabel = isEn ? "Prep time" : "准备时间";
    const cookLabel = isEn ? "Cook time" : "烹饪时间";
    const difficultyText = isEn ? "Difficulty" : "难度";
    const servingsText = isEn ? "Servings" : "份量";
    const ingredientsTitle = isEn ? "Ingredients" : "食材清单";
    const stepsTitle = isEn ? "Steps" : "制作步骤";
    const stepLabel = isEn ? "Step" : "步骤";
    const tipsTitle = isEn ? "Tips" : "烹饪技巧";
    const nutritionTitle = isEn ? "Nutrition Facts" : "营养信息";
    const faqTitle = isEn ? "FAQ" : "常见问题";
    const printedAtLabel = isEn ? "Printed at" : "打印时间";

    // 使用第一张封面图
    const coverImage = coverImages[0];

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
          .list { list-style: none; }
          .list li { margin-bottom: 6px; line-height: 1.6; }
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

        ${summary?.oneLine ? `<div class="summary">${summary.oneLine}</div>` : ""}

        <div class="info-grid">
          ${summary?.servings ? `<div class="info-item"><div class="info-label">${servingsText}</div><div class="info-value">${summary.servings}${servingsLabel}</div></div>` : ""}
          ${summary?.timeTotalMin ? `<div class="info-item"><div class="info-label">${cookLabel}</div><div class="info-value">${formatMinutes(summary.timeTotalMin)}</div></div>` : ""}
          ${summary?.difficulty ? `<div class="info-item"><div class="info-label">${difficultyText}</div><div class="info-value">${difficultyLabel}</div></div>` : ""}
        </div>

        <h2>${ingredientsTitle}</h2>
        <div class="ingredients">
          ${ingredients?.map((section: any) => `
            <div class="ingredient-section">
              ${section.section ? `<h3>${section.section}</h3>` : ""}
              <ul class="ingredient-list">
                ${section.items?.map((item: any) => `
                  <li class="ingredient-item">
                    <span>${item.name}</span>
                    ${item.amount && item.unit ? `<span class="ingredient-amount">${item.amount}${item.unit}</span>` : ""}
                  </li>
                `).join("") || ""}
              </ul>
            </div>
          `).join("") || ""}
        </div>

        <h2>${stepsTitle}</h2>
        ${steps?.map((step: any, idx: number) => {
          const stepImage = step.imageUrl || stepImages[step.id] || stepImages[`step${idx + 1}`];
          return `
            <div class="step">
              <div class="step-header">
                <span class="step-number">${stepLabel} ${idx + 1}</span>
                ${step.title ? `<span class="step-title">${step.title}</span>` : ""}
              </div>
              ${stepImage ? `<img src="${stepImage}" alt="${step.title || `Step ${idx + 1}`}" class="step-image" />` : ""}
              <div class="step-action">${step.action}</div>
            </div>
          `;
        }).join("") || ""}

        ${tips && tips.length > 0 ? `
          <h2>${tipsTitle}</h2>
          <ul class="list">
            ${tips.map((tip: string) => `<li>• ${tip}</li>`).join("")}
          </ul>
        ` : ""}

        ${hasNutrition ? `
          <h2>${nutritionTitle}</h2>
          <div class="info-grid">
            ${nutritionItems.map((item) => {
              const value = (nutritionSource as any)[item.key];
              if (typeof value !== "number") return "";
              return `<div class="info-item"><div class="info-label">${item.label}</div><div class="info-value">${value}${item.unit}</div></div>`;
            }).join("")}
          </div>
        ` : ""}

        ${faq && faq.length > 0 ? `
          <h2>${faqTitle}</h2>
          ${faq.map((item: any) => `
            <div class="step">
              <h3>Q: ${item.question}</h3>
              <p>A: ${item.answer}</p>
            </div>
          `).join("")}
        ` : ""}

        <div class="footer">
          ${printedAtLabel}: ${new Date().toLocaleString(isEn ? "en-US" : "zh-CN")}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // 等待图片加载后打印
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        setIsPrinting(false);
      }, 500);
    };
  };

  // 营养信息

  // 导航项
  const navItems = [
    { id: "ingredients", icon: "📋", label: isEn ? "Ingredients" : "食材清单" },
    { id: "steps", icon: "👨‍🍳", label: isEn ? "Steps" : "制作步骤" },
    { id: "tips", icon: "💡", label: isEn ? "Tips" : "烹饪技巧" },
    { id: "nutrition", icon: "📊", label: isEn ? "Nutrition" : "营养信息" },
    { id: "faq", icon: "❓", label: isEn ? "FAQ" : "常见问题" },
    { id: "pairing", icon: "🍽️", label: isEn ? "Pairing" : "搭配推荐" },
  ];

  return (
    <div ref={contentRef} className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* 顶部大图和标题区域 */}
      <div className="mb-8">
        {/* 封面图轮播 */}
        {coverImages.length > 0 && (
          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-6 group">
            {/* 图片容器 */}
            <div className="relative w-full h-full">
              {coverImages.map((image, index) => (
                <div
                  key={index}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-500",
                    index === currentImageIndex ? "opacity-100" : "opacity-0"
                  )}
                >
                  <CoverImage
                    src={image}
                    alt={`${displayTitle} - ${index + 1}`}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>

            {/* 左右切换按钮 - 只在有多张图片时显示 */}
            {coverImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={isEn ? "Previous image" : "上一张"}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={isEn ? "Next image" : "下一张"}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* 底部指示器 */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  {coverImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        index === currentImageIndex
                          ? "bg-white w-8"
                          : "bg-white/50 hover:bg-white/75"
                      )}
                      aria-label={`${isEn ? "Go to image" : "跳转到第"} ${index + 1}${isEn ? "" : "张"}`}
                    />
                  ))}
                </div>

                {/* 图片计数 */}
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
                  {currentImageIndex + 1} / {coverImages.length}
                </div>
              </>
            )}
          </div>
        )}

        {/* 标题和元信息 */}
        <div className="mb-6">
          <h1 className="text-4xl font-serif font-bold text-textDark mb-4">
            {displayTitle}
          </h1>

          {/* 一句话描述 */}
          {summary?.oneLine && (
            <p className="text-lg text-textGray mb-4">{summary.oneLine}</p>
          )}

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-textGray mb-4">
            {/* 评分 */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>

            {/* 份量 */}
            {summary?.servings && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{summary.servings}{isEn ? " servings" : "人份"}</span>
              </div>
            )}

            {/* 时间 */}
            {summary?.timeTotalMin && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatMinutes(summary.timeTotalMin)}</span>
              </div>
            )}

            {/* 难度 */}
            {summary?.difficulty && (
              <div className="flex items-center gap-1">
                <ChefHat className="w-4 h-4" />
                <span>{formatDifficulty(summary.difficulty)}</span>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSaved(!saved)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                saved
                  ? "bg-brownWarm text-white hover:bg-brownWarm/90"
                  : "border border-lightGray hover:bg-cream"
              )}
            >
              <Heart className={cn("w-4 h-4", saved && "fill-current")} />
              <span>{isEn ? (saved ? "Saved" : "Save") : (saved ? "已收藏" : "收藏")}</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-lightGray rounded-lg hover:bg-cream transition-colors">
              <Share2 className="w-4 h-4" />
              <span>{isEn ? "Share" : "分享"}</span>
            </button>
            <button
              onClick={handleDownloadRecipe}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 border border-lightGray rounded-lg hover:bg-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isEn ? "Download" : "下载长图"}</span>
            </button>
            <button
              onClick={handlePrintRecipe}
              disabled={isPrinting}
              className="flex items-center gap-2 px-4 py-2 border border-lightGray rounded-lg hover:bg-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>{isEn ? "Print" : "打印"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域：左侧导航 + 右侧内容 */}
      <div className="flex gap-8">
        {/* 左侧固定导航 */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors",
                    activeSection === item.id
                      ? "bg-brownWarm text-white"
                      : "text-textGray hover:bg-cream"
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* 右侧内容区域 */}
        <main className="flex-1 min-w-0">
          {/* 食材清单 */}
          <section id="ingredients" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-serif font-bold text-textDark mb-6 flex items-center gap-2">
              <span>📋</span>
              <span>{isEn ? "Ingredients" : "食材清单"}</span>
            </h2>

            {ingredients && ingredients.length > 0 && (
              <div className="space-y-6">
                {ingredients.map((section: any, idx: number) => (
                  <div key={idx} className="bg-white rounded-lg p-6 shadow-sm">
                    {section.section && (
                      <h3 className="text-lg font-medium text-textDark mb-4">
                        {section.section}
                      </h3>
                    )}
                    <div className="space-y-3">
                      {section.items?.map((item: any, itemIdx: number) => {
                        const iconKey = matchIngredientIcon(item.name, icons);
                        const iconUrl = icons[iconKey];

                        return (
                          <div key={itemIdx} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-lightGray text-brownWarm focus:ring-brownWarm"
                            />
                            {iconUrl && (
                              <img
                                src={iconUrl}
                                alt={item.name}
                                className="w-8 h-8 object-contain"
                              />
                            )}
                            <span className="flex-1 text-textDark">
                              {item.name}
                              {item.amount && item.unit && (
                                <span className="text-textGray ml-2">
                                  {item.amount}{item.unit}
                                </span>
                              )}
                            </span>
                            {item.notes && (
                              <span className="text-sm text-textGray">
                                {item.notes}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 制作步骤 */}
          <section id="steps" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-serif font-bold text-textDark mb-6 flex items-center gap-2">
              <span>👨‍🍳</span>
              <span>{isEn ? "Cooking Steps" : "制作步骤"}</span>
            </h2>

            {steps && steps.length > 0 && (
              <div className="space-y-8">
                {steps.map((step: any, idx: number) => {
                  const stepImage = step.imageUrl || stepImages[step.id] || stepImages[`step${idx + 1}`];

                  return (
                    <div key={idx} className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brownWarm text-white flex items-center justify-center font-bold text-lg">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          {step.title && (
                            <h3 className="text-lg font-medium text-textDark mb-3">
                              {step.title}
                            </h3>
                          )}

                          {stepImage && (
                            <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-4">
                              <CoverImage
                                src={stepImage}
                                alt={step.title || `Step ${idx + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}

                          <p className="text-textDark mb-4 leading-relaxed">
                            {step.action}
                          </p>

                          {/* 成功秘诀 */}
                          {step.visualCue && (
                            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg mb-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="text-sm font-medium text-green-900 mb-1">
                                  {isEn ? "Success Tip" : "✅ 成功秘诀"}
                                </div>
                                <div className="text-sm text-green-800">
                                  {step.visualCue}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 失败原因 */}
                          {step.failurePoints && step.failurePoints.length > 0 && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="text-sm font-medium text-red-900 mb-1">
                                  {isEn ? "Common Mistakes" : "⚠️ 常见失败原因"}
                                </div>
                                <ul className="text-sm text-red-800 space-y-1">
                                  {step.failurePoints.map((point: string, i: number) => (
                                    <li key={i}>• {point}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 烹饪技巧 */}
          {tips && tips.length > 0 && (
            <section id="tips" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-serif font-bold text-textDark mb-6 flex items-center gap-2">
                <span>💡</span>
                <span>{isEn ? "Cooking Tips" : "烹饪技巧"}</span>
              </h2>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <ul className="space-y-3">
                  {tips.map((tip: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-textDark">
                      <span className="text-brownWarm mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* 营养信息 */}
          {hasNutrition && (
            <section id="nutrition" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-serif font-bold text-textDark mb-6 flex items-center gap-2">
                <span>📊</span>
                <span>{isEn ? "Nutrition Facts" : "营养信息"}</span>
                <span className="text-sm font-normal text-textGray">
                  ({isEn ? "per serving" : "每份"})
                </span>
              </h2>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {nutritionItems.map((item) => {
                    const value = (nutritionSource as any)[item.key];
                    if (typeof value !== "number") return null;

                    return (
                      <div key={item.key} className="text-center p-4 bg-cream rounded-lg">
                        <div className="text-2xl font-bold text-brownWarm mb-1">
                          {value}
                          <span className="text-sm text-textGray ml-1">{item.unit}</span>
                        </div>
                        <div className="text-sm text-textGray">{item.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* 常见问题 */}
          {faq && faq.length > 0 && (
            <section id="faq" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-serif font-bold text-textDark mb-6 flex items-center gap-2">
                <span>❓</span>
                <span>{isEn ? "FAQ" : "常见问题"}</span>
              </h2>
              <div className="space-y-4">
                {faq.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-medium text-textDark mb-3">
                      Q: {item.question}
                    </h3>
                    <p className="text-textGray leading-relaxed">
                      A: {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 搭配推荐 */}
          {(pairing?.similar?.length > 0 || pairing?.pairing?.length > 0) && (
            <section id="pairing" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-serif font-bold text-textDark mb-6 flex items-center gap-2">
                <span>🍽️</span>
                <span>{isEn ? "Pairing Suggestions" : "搭配推荐"}</span>
              </h2>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                {pairing.similar && pairing.similar.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-textDark mb-3">
                      {isEn ? "Similar Recipes" : "相似菜品"}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {pairing.similar.map((item: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-cream rounded-full text-textDark hover:bg-brownWarm hover:text-white transition-colors cursor-pointer"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {pairing.pairing && pairing.pairing.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-textDark mb-3">
                      {isEn ? "Goes Well With" : "适合搭配"}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {pairing.pairing.map((item: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-cream rounded-full text-textDark hover:bg-brownWarm hover:text-white transition-colors cursor-pointer"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
