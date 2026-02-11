/**
 * 椋熻氨璇︽儏椤?- 瀹㈡埛绔粍浠?
 *
 * 瀹屽叏澶嶅埢璁捐绋匡細
 * - 椤堕儴锛氬ぇ鍥?+ 鏍囬 + 浠介噺閫夋嫨鍣?
 * - 涓嬫柟锛氬乏鍙冲垎鏍忓竷灞€
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Recipe } from "@/types/recipe";
import { CoverImage } from "@/components/ui/SafeImage";
import { CookModeModal } from "@/components/recipe/CookModeModal";
import { StepCardNew } from "@/components/recipe/StepCardNew";
import { useIngredientIcons } from "@/hooks/use-ingredient-icons";
import { matchIngredientIcon } from "@/lib/ingredient-icons";
import { cn } from "@/lib/utils";
import {
  Clock,
  ChefHat,
  Heart,
  Share2,
  Download,
  Play,
  Loader2,
  Printer,
  User,
  Users,
  ClipboardList,
  ListChecks,
  Sparkles,
  Leaf,
  HelpCircle,
  Utensils,
} from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { t } from "@/lib/i18n/translations";
import { ensureEnglish } from "@/lib/i18n/english";
import { getDateLocale } from "@/lib/i18n/format";
import Image from "next/image";

// 鍥㈤槦鎴愬憳绫诲瀷
interface TeamMemberBrief {
  id: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  role: string;
  avatarUrl: string | null;
  mottoZh: string | null;
  mottoEn: string | null;
}

interface RecipeDetailClientProps {
  recipe: Recipe;
  coverImage?: string | null;
  stepImages: Record<string, string | undefined>;
  explorer?: TeamMemberBrief | null;
  reviewer?: TeamMemberBrief | null;
  preferSourceTextWhenEnMissing?: boolean;
}

export function RecipeDetailClient({
  recipe,
  coverImage,
  stepImages,
  explorer,
  reviewer,
  preferSourceTextWhenEnMissing = false,
}: RecipeDetailClientProps) {
  const locale = useLocale();
  const isEn = locale === "en";
  const useSourceTextFallback = isEn && preferSourceTextWhenEnMissing;
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
  const displayTitle = useSourceTextFallback
    ? recipe.titleEn || recipe.titleZh
    : isEn
    ? ensureEnglish(recipe.titleEn || recipe.titleZh, "Untitled Recipe")
    : recipe.titleZh;

  const displaySummary = useMemo(() => {
    if (!isEn || useSourceTextFallback) return summary;
    return {
      ...summary,
      oneLine: ensureEnglish(summary?.oneLine, "English version coming soon."),
      healingTone: ensureEnglish(summary?.healingTone, ""),
      scaleHint: summary?.scaleHint
        ? ensureEnglish(summary.scaleHint, "")
        : summary?.scaleHint,
      flavorTags: Array.isArray(summary?.flavorTags)
        ? summary.flavorTags
            .map((tag) => ensureEnglish(tag, ""))
            .filter(Boolean)
        : summary?.flavorTags,
    };
  }, [isEn, summary, useSourceTextFallback]);

  const displayStory = useMemo(() => {
    if (!isEn || useSourceTextFallback) return story;
    if (!story) return story;
    if (typeof story === "string") {
      const cleaned = ensureEnglish(story, "");
      return cleaned || undefined;
    }
    const title = ensureEnglish(story.title, "");
    const content = ensureEnglish(story.content, "");
    const tags = Array.isArray(story.tags)
      ? story.tags.map((tag) => ensureEnglish(tag, "")).filter(Boolean)
      : story.tags;
    if (!title && !content && (!tags || tags.length === 0)) return undefined;
    return {
      ...story,
      title,
      content,
      tags,
    };
  }, [isEn, story, useSourceTextFallback]);

  const displayIngredients = useMemo(() => {
    if (!isEn || useSourceTextFallback) return ingredients;
    return (ingredients || [])
      .map((section) => {
        const items = (section.items || [])
          .map((item) => {
            const name = ensureEnglish(item.name, "");
            if (!name) return null;
            return {
              ...item,
              name,
              unit: ensureEnglish(item.unit, ""),
              prep: item.prep ? ensureEnglish(item.prep, "") : item.prep,
              notes: item.notes ? ensureEnglish(item.notes, "") : item.notes,
              substitutes: Array.isArray(item.substitutes)
                ? item.substitutes
                    .map((sub) => ensureEnglish(sub, ""))
                    .filter(Boolean)
                : item.substitutes,
              allergens: Array.isArray(item.allergens)
                ? item.allergens
                    .map((allergen) => ensureEnglish(allergen, ""))
                    .filter(Boolean)
                : item.allergens,
            };
          })
          .filter(Boolean);
        if (items.length === 0) return null;
        return {
          ...section,
          section: ensureEnglish(section.section, "Ingredients"),
          items,
        };
      })
      .filter(Boolean);
  }, [ingredients, isEn, useSourceTextFallback]);

  const displaySteps = useMemo(() => {
    if (!isEn || useSourceTextFallback) return steps;
    return (steps || [])
      .map((step, index) => {
        const title = ensureEnglish(step.title, `Step ${index + 1}`);
        const action = ensureEnglish(step.action, "");
        return {
          ...step,
          title,
          action,
          speechText: step.speechText
            ? ensureEnglish(step.speechText, "")
            : step.speechText,
          visualCue: step.visualCue ? ensureEnglish(step.visualCue, "") : step.visualCue,
          failPoint: step.failPoint ? ensureEnglish(step.failPoint, "") : step.failPoint,
          photoBrief: step.photoBrief ? ensureEnglish(step.photoBrief, "") : step.photoBrief,
          statusChecks: Array.isArray(step.statusChecks)
            ? step.statusChecks
                .map((check) => ensureEnglish(check, ""))
                .filter(Boolean)
            : step.statusChecks,
          failurePoints: Array.isArray(step.failurePoints)
            ? step.failurePoints
                .map((point) => ensureEnglish(point, ""))
                .filter(Boolean)
            : step.failurePoints,
          recovery: step.recovery ? ensureEnglish(step.recovery, "") : step.recovery,
          safeNote: step.safeNote ? ensureEnglish(step.safeNote, "") : step.safeNote,
        };
      })
      .filter((step) => step.title || step.action);
  }, [isEn, steps, useSourceTextFallback]);

  const displayNutrition = useMemo(() => {
    if (!isEn || useSourceTextFallback || !nutrition) return nutrition;
    return {
      ...nutrition,
      dietaryLabels: Array.isArray(nutrition.dietaryLabels)
        ? nutrition.dietaryLabels
            .map((label) => ensureEnglish(label, ""))
            .filter(Boolean)
        : nutrition.dietaryLabels,
      disclaimer: nutrition.disclaimer
        ? ensureEnglish(nutrition.disclaimer, "")
        : nutrition.disclaimer,
    };
  }, [isEn, nutrition, useSourceTextFallback]);

  const displayFaq = useMemo(() => {
    if (!isEn || useSourceTextFallback) return faq;
    return Array.isArray(faq)
      ? faq
          .map((item) => {
            const question = ensureEnglish(item.question, "");
            const answer = ensureEnglish(item.answer, "");
            if (!question && !answer) return null;
            return { ...item, question, answer };
          })
          .filter(Boolean)
      : faq;
  }, [faq, isEn, useSourceTextFallback]);

  const displayTips = useMemo(() => {
    if (!isEn || useSourceTextFallback) return tips;
    return Array.isArray(tips)
      ? tips.map((tip) => ensureEnglish(tip, "")).filter(Boolean)
      : tips;
  }, [isEn, tips, useSourceTextFallback]);

  const displayTroubleshooting = useMemo(() => {
    if (!isEn || useSourceTextFallback) return troubleshooting;
    return Array.isArray(troubleshooting)
      ? troubleshooting
          .map((item) => {
            const problem = ensureEnglish(item.problem, "");
            const cause = ensureEnglish(item.cause, "");
            const fix = ensureEnglish(item.fix, "");
            if (!problem && !cause && !fix) return null;
            return { ...item, problem, cause, fix };
          })
          .filter(Boolean)
      : troubleshooting;
  }, [isEn, troubleshooting, useSourceTextFallback]);

  const displayPairing = useMemo(() => {
    if (!isEn || useSourceTextFallback || !pairing) return pairing;
    return {
      ...pairing,
      suggestions: Array.isArray(pairing.suggestions)
        ? pairing.suggestions
            .map((item) => ensureEnglish(item, ""))
            .filter(Boolean)
        : pairing.suggestions,
      sauceOrSide: Array.isArray(pairing.sauceOrSide)
        ? pairing.sauceOrSide
            .map((item) => ensureEnglish(item, ""))
            .filter(Boolean)
        : pairing.sauceOrSide,
    };
  }, [isEn, pairing, useSourceTextFallback]);

  const displayNotes = useMemo(() => {
    if (!isEn || useSourceTextFallback) return notes;
    return Array.isArray(notes)
      ? notes.map((note) => ensureEnglish(note, "")).filter(Boolean)
      : notes;
  }, [isEn, notes, useSourceTextFallback]);

  const explorerName = explorer
    ? isEn && !useSourceTextFallback
      ? ensureEnglish(explorer.nameEn || explorer.nameZh, "Contributor")
      : explorer.nameEn || explorer.nameZh
    : "";
  const reviewerName = reviewer
    ? isEn && !useSourceTextFallback
      ? ensureEnglish(reviewer.nameEn || reviewer.nameZh, "Reviewer")
      : reviewer.nameEn || reviewer.nameZh
    : "";
  const explorerMotto = explorer
    ? isEn && !useSourceTextFallback
      ? ensureEnglish(explorer.mottoEn || "", "")
      : explorer.mottoEn || explorer.mottoZh
    : null;
  const reviewerMotto = reviewer
    ? isEn && !useSourceTextFallback
      ? ensureEnglish(reviewer.mottoEn || "", "")
      : reviewer.mottoEn || reviewer.mottoZh
    : null;

  // Helper to safely get story content from string | RecipeStory union
  const getStoryContent = () => {
    if (!displayStory) return "";
    if (typeof displayStory === "string") return displayStory;
    return displayStory.content || "";
  };
  const formatMinutes = (mins: number) => `${mins} ${t("recipe.min", locale)}`;
  const formatDifficulty = (value?: string) => {
    if (!value) return t("recipe.easy", locale);
    if (value === "easy") return t("recipe.easy", locale);
    if (value === "medium") return t("recipe.medium", locale);
    if (value === "hard") return t("recipe.hard", locale);
    return value;
  };

  const nutritionSource = displayNutrition?.perServing || displayNutrition || {};
  const nutritionItems = [
    { key: "calories", label: t("recipeDetail.calories", locale), unit: "kcal" },
    { key: "protein", label: t("recipeDetail.protein", locale), unit: "g" },
    { key: "fat", label: t("recipeDetail.fat", locale), unit: "g" },
    { key: "carbs", label: t("recipeDetail.carbs", locale), unit: "g" },
    { key: "fiber", label: t("recipeDetail.fiber", locale), unit: "g" },
    { key: "sodium", label: t("recipeDetail.sodium", locale), unit: "mg" },
  ];
  const hasNutrition = nutritionItems.some(
    (item) => typeof (nutritionSource as any)[item.key] === "number"
  );

  // 浠介噺閫夋嫨鍣?
  const baseServings = displaySummary.servings || 4;
  const servingOptions = [2, 4, 8];
  const [servings, setServings] = useState(
    servingOptions.includes(baseServings) ? baseServings : 4
  );

  // 鐑归オ妯″紡
  const [cookModeOpen, setCookModeOpen] = useState(false);

  // 涓嬭浇/鎵撳嵃鐘舵€?
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // 椋熸潗鍥炬爣
  const { icons } = useIngredientIcons();

  const navItems = useMemo(
    () => [
      {
        id: "ingredients",
        label: t("recipeDetail.ingredientsList", locale),
        icon: ClipboardList,
        show: displayIngredients.length > 0,
      },
      {
        id: "steps",
        label: t("recipeDetail.stepsTitle", locale),
        icon: ListChecks,
        show: displaySteps.length > 0,
      },
      {
        id: "tips",
        label: t("recipeDetail.cookingTips", locale),
        icon: Sparkles,
        show:
          (displayTips?.length || 0) > 0 ||
          (displayTroubleshooting?.length || 0) > 0,
      },
      {
        id: "nutrition",
        label: t("recipeDetail.nutritionTitle", locale),
        icon: Leaf,
        show: hasNutrition,
      },
      {
        id: "faq",
        label: t("recipeDetail.faqTitle", locale),
        icon: HelpCircle,
        show: (displayFaq?.length || 0) > 0,
      },
      {
        id: "pairing",
        label: t("recipeDetail.pairingTitle", locale),
        icon: Utensils,
        show:
          (displayPairing?.suggestions?.length || 0) > 0 ||
          (displayPairing?.sauceOrSide?.length || 0) > 0,
      },
    ],
    [
      locale,
      displayIngredients.length,
      displaySteps.length,
      displayTips,
      displayTroubleshooting,
      hasNutrition,
      displayFaq,
      displayPairing,
    ]
  );

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => item.show),
    [navItems]
  );
  const [activeSection, setActiveSection] = useState(
    visibleNavItems[0]?.id || "ingredients"
  );

  // 灏嗗浘鐗囪浆涓?base64锛堥€氳繃浠ｇ悊瑙ｅ喅璺ㄥ煙锛?
  const imageToBase64 = async (imgSrc: string): Promise<string> => {
    try {
      // 浣跨敤 fetch 閫氳繃浠ｇ悊鑾峰彇鍥剧墖
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

  // 涓嬭浇椋熻氨闀垮浘
  const handleDownloadRecipe = async () => {
    if (!contentRef.current || isDownloading) return;

    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;

      const element = contentRef.current;

      // 淇濆瓨鍘熷鏍峰紡
      const originalStyles = {
        width: element.style.width,
        minWidth: element.style.minWidth,
        maxWidth: element.style.maxWidth,
      };

      // 璁剧疆鍥哄畾瀹藉害锛屾ā鎷熸闈㈢甯冨眬锛堥渶瑕?>= 1024px 鎵嶈兘瑙﹀彂 lg 鏂偣锛?
      element.style.width = "1100px";
      element.style.minWidth = "1100px";
      element.style.maxWidth = "1100px";

      // 绛夊緟甯冨眬閲嶆帓
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 鐢熸垚 canvas锛屼娇鐢?proxy 澶勭悊璺ㄥ煙鍥剧墖
      const canvas = await html2canvas(element, {
        backgroundColor: "#FDF8F3",
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 30000,
        proxy: "/api/proxy-image",
        onclone: (clonedDoc, clonedElement) => {
          const exportIgnore = clonedDoc.querySelectorAll("[data-export-ignore='true']");
          exportIgnore.forEach((el) => {
            (el as HTMLElement).style.display = "none";
          });

          const stepsContainer = clonedElement.querySelector(
            "[data-export-steps='true']"
          ) as HTMLElement | null;
          if (stepsContainer) {
            stepsContainer.style.overflow = "visible";
            stepsContainer.style.maxHeight = "none";
          }

          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            const styles = window.getComputedStyle(el);
            const htmlEl = el as HTMLElement;

            [
              "color",
              "backgroundColor",
              "borderColor",
              "borderTopColor",
              "borderRightColor",
              "borderBottomColor",
              "borderLeftColor",
            ].forEach((prop) => {
              const value = styles.getPropertyValue(
                prop.replace(/([A-Z])/g, "-$1").toLowerCase()
              );
              if (value && value.includes("oklch")) {
                if (prop === "backgroundColor") {
                  htmlEl.style.backgroundColor = "#FDF8F3";
                } else if (prop === "color") {
                  htmlEl.style.color = "#1c1917";
                } else {
                  htmlEl.style.setProperty(
                    prop.replace(/([A-Z])/g, "-$1").toLowerCase(),
                    "#d6d3d1"
                  );
                }
              }
            });
          });
        },
      });

      // 鎭㈠鍘熷鏍峰紡
      element.style.width = originalStyles.width;
      element.style.minWidth = originalStyles.minWidth;
      element.style.maxWidth = originalStyles.maxWidth;

      // 杞负鍥剧墖骞朵笅杞?
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${displayTitle}-${t("recipe.recipeLabel", locale)}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("涓嬭浇澶辫触:", error);
      alert(t("recipe.downloadFailed", locale));
    } finally {
      setIsDownloading(false);
    }
  };

  // 鎵撳嵃椋熻氨
  const handlePrintRecipe = () => {
    if (!contentRef.current || isPrinting) return;

    setIsPrinting(true);

    // 鍒涘缓鎵撳嵃绐楀彛
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert(t("recipe.allowPopups", locale));
      setIsPrinting(false);
      return;
    }

    // 鑾峰彇姝ラ鍥剧墖
  const getStepImage = (step: typeof displaySteps[0]): string | undefined => {
      return step.imageUrl;
    };

    // 鏋勫缓鎵撳嵃鍐呭
    const difficultyLabel = formatDifficulty(displaySummary.difficulty);
    const servingsLabel = t("recipe.servingsUnit", locale);
    const prepLabel = t("recipe.prepTime", locale);
    const cookLabel = t("recipe.cookTime", locale);
    const difficultyText = t("recipe.difficulty", locale);
    const servingsText = t("recipe.servings", locale);
    const aboutTitle = t("recipe.aboutDish", locale);
    const ingredientsTitle = t("recipe.ingredients", locale);
    const mainLabel = t("recipe.mainIngredients", locale);
    const extraLabel = t("recipe.extras", locale);
    const stepsTitle = t("recipe.steps", locale);
    const stepLabel = t("recipe.step", locale);
    const checkLabel = t("recipe.check", locale);
    const pitfallLabel = t("recipe.pitfall", locale);
    const printedAtLabel = t("recipe.printedAt", locale);
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${displayTitle} - ${t("recipe.ingredients", locale)}</title>
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
            <div class="info-value">${formatMinutes(displaySummary.timeActiveMin || 15)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">${cookLabel}</div>
            <div class="info-value">${formatMinutes((displaySummary.timeTotalMin || 30) - (displaySummary.timeActiveMin || 15))}</div>
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
          <strong>${t("recipe.summary", locale)}</strong>
          ${displaySummary.oneLine || ""}
          ${displaySummary.healingTone ? `<div>${displaySummary.healingTone}</div>` : ""}
        </div>

        <div class="story">
          <strong>${aboutTitle}</strong>
          ${getStoryContent() || displaySummary.oneLine}
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
        ${displaySteps.map((step, index) => {
          const stepImage = getStepImage(step);
          return `
            <div class="step">
              <div class="step-header">
                <span class="step-number">${stepLabel.toUpperCase()} ${String(index + 1).padStart(2, "0")}</span>
                <span class="step-title">${step.title}</span>
                ${(step.timerSec ?? 0) > 0 ? `<span style="color: #78716c; font-size: 12px;">鈴?${formatMinutes(Math.floor((step.timerSec ?? 0) / 60))}</span>` : ""}
              </div>
              ${stepImage ? `<img src="${stepImage}" alt="${stepLabel} ${index + 1}" class="step-image" />` : ""}
              <div class="step-action">${step.action}</div>
              ${step.visualCue ? `<div class="step-tip success">鉁?${checkLabel}${step.visualCue}</div>` : ""}
              ${step.failPoint ? `<div class="step-tip warning">鈿?${pitfallLabel}${step.failPoint}</div>` : ""}
            </div>
          `;
        }).join("")}

        ${hasNutrition ? `
          <h2>${t("recipe.nutrition", locale)}</h2>
          <div class="section-card">
            ${nutritionItems.map((item) => {
              const value = (nutritionSource as any)[item.key];
              if (typeof value !== "number") return "";
              return `<span class="pill">${item.label}: ${value}${item.unit}</span>`;
            }).join("")}
            ${displayNutrition?.dietaryLabels?.length ? `<div style="margin-top:8px;">${displayNutrition.dietaryLabels.map((label) => `<span class="pill">${label}</span>`).join("")}</div>` : ""}
            ${displayNutrition?.disclaimer ? `<div style="margin-top:8px; color:#78716c; font-size:12px;">${displayNutrition.disclaimer}</div>` : ""}
          </div>
        ` : ""}

        ${Array.isArray(displayTips) && displayTips.length > 0 ? `
          <h2>${t("recipe.tips", locale)}</h2>
          <div class="section-card">
            <ul class="list">
              ${displayTips.map((tip) => `<li>鈥?${tip}</li>`).join("")}
            </ul>
          </div>
        ` : ""}

        ${Array.isArray(displayTroubleshooting) && displayTroubleshooting.length > 0 ? `
          <h2>${t("recipe.troubleshooting", locale)}</h2>
          <div class="section-card">
            <ul class="list">
              ${displayTroubleshooting
                .map(
                  (item) =>
                    `<li>鈥?${item.problem}: ${item.fix || item.solution || ""}</li>`
                )
                .join("")}
            </ul>
          </div>
        ` : ""}

        ${Array.isArray(displayFaq) && displayFaq.length > 0 ? `
          <h2>${t("recipe.faq", locale)}</h2>
          <div class="section-card">
            <ul class="list">
              ${displayFaq
                .map(
                  (item) =>
                    `<li><strong>Q:</strong> ${item.question}<br/><strong>A:</strong> ${item.answer}</li>`
                )
                .join("")}
            </ul>
          </div>
        ` : ""}

        ${Array.isArray(displayNotes) && displayNotes.length > 0 ? `
          <h2>${t("recipe.notes", locale)}</h2>
          <div class="section-card">
            <ul class="list">
              ${displayNotes.map((note) => `<li>鈥?${note}</li>`).join("")}
            </ul>
          </div>
        ` : ""}

        <div class="footer">
          Recipe Zen - ${displayTitle} | ${printedAtLabel}: ${new Date().toLocaleDateString(getDateLocale(locale))}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // 绛夊緟鍐呭鍜屽浘鐗囧姞杞藉畬鎴愬悗鎵撳嵃
    printWindow.onload = () => {
      // 缁欏浘鐗囬澶栧姞杞芥椂闂?
      setTimeout(() => {
        printWindow.print();
        setIsPrinting(false);
      }, 500);
    };

    // 澶囩敤锛氬鏋?onload 涓嶈Е鍙?
    setTimeout(() => {
      if (isPrinting) {
        printWindow.print();
        setIsPrinting(false);
      }
    }, 2000);
  };

  // 璁＄畻椋熸潗鏁伴噺
  const calculateAmount = (baseAmount: number): number => {
    const ratio = servings / baseServings;
    return Math.round(baseAmount * ratio * 10) / 10;
  };

  // 鍒嗙涓绘枡鍜岃緟鏂?
  const isMainSection = (section: string) =>
    section.includes("涓绘枡") || section.toLowerCase().includes("main");
  const mainSection =
    displayIngredients.find((section) => isMainSection(section.section)) ||
    displayIngredients[0];
  const mainIngredients = mainSection?.items || [];
  const subIngredients = displayIngredients
    .filter((section) => section !== mainSection)
    .flatMap((section) => section.items || []);
  const hasExtras = subIngredients.length > 0;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (visibleNavItems.length === 0) return;

    if (!visibleNavItems.some((item) => item.id === activeSection)) {
      setActiveSection(visibleNavItems[0].id);
    }

    const targets = visibleNavItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0.1 }
    );

    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, [activeSection, visibleNavItems]);

  const handleSave = () => {
    setSaved((prev) => {
      const next = !prev;
      setToast(next ? t("recipe.savedToast", locale) : t("recipe.removedToast", locale));
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
        setToast(t("recipe.shareOpened", locale));
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast(t("recipe.linkCopied", locale));
    } catch {
      setToast(t("recipe.shareFailed", locale));
    }
  };

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid lg:grid-cols-[220px_1fr] gap-8">
          <aside className="hidden lg:block" data-export-ignore="true">
            <div className="sticky top-28">
              <div className="bg-white rounded-2xl border border-cream shadow-subtle p-3 space-y-1">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                        isActive
                          ? "bg-brownWarm text-white shadow-subtle"
                          : "text-textGray hover:text-textDark hover:bg-cream/70"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="space-y-8">
            <div className="lg:hidden" data-export-ignore="true">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors",
                        isActive
                          ? "bg-brownWarm text-white border-brownWarm"
                          : "bg-white text-textGray border-cream hover:text-textDark"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            <div ref={contentRef} className="space-y-8">
              <section className="bg-white rounded-3xl border border-cream shadow-card p-6 md:p-8">
                <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-6 items-start">
                  <div className="relative overflow-hidden rounded-2xl bg-cream aspect-[16/9]">
                    {coverImage ? (
                      <CoverImage src={coverImage} alt={displayTitle} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cream via-orangeAccent/20 to-cream" />
                    )}
                  </div>
                  {(explorer || reviewer) && (
                    <div className="bg-cream/80 rounded-2xl border border-cream p-4">
                      <div className="text-xs text-textGray mb-3">
                        {t("recipeDetail.presentedBy", locale)}
                      </div>
                      <div className="space-y-4">
                        {explorer && (
                          <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-cream shadow-subtle">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-lightGray flex-shrink-0">
                              {explorer.avatarUrl ? (
                                <Image
                                  src={explorer.avatarUrl}
                                  alt={explorerName}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="w-6 h-6 text-textGray/60" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-textDark">
                                {explorerName}
                              </div>
                              <div className="text-xs text-brownWarm">
                                {t("recipeDetail.explorerLabel", locale)}
                              </div>
                              {explorerMotto && (
                                <div className="text-xs text-textGray mt-1 truncate">
                                  {explorerMotto}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {reviewer && (
                          <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-cream shadow-subtle">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-lightGray flex-shrink-0">
                              {reviewer.avatarUrl ? (
                                <Image
                                  src={reviewer.avatarUrl}
                                  alt={reviewerName}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="w-6 h-6 text-textGray/60" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-textDark">
                                {reviewerName}
                              </div>
                              <div className="text-xs text-green-600">
                                {t("recipeDetail.reviewerLabel", locale)}
                              </div>
                              {reviewerMotto && (
                                <div className="text-xs text-textGray mt-1 truncate">
                                  {reviewerMotto}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <h1 className="text-3xl md:text-4xl font-serif font-medium text-textDark">
                    {displayTitle}
                  </h1>
                  {useSourceTextFallback && (
                    <p className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs text-amber-700">
                      English translation is pending. Showing original recipe content.
                    </p>
                  )}
                  <p className="text-base text-textGray">{displaySummary.oneLine}</p>
                  {displaySummary.healingTone && (
                    <p className="text-sm text-textGray italic">
                      {displaySummary.healingTone}
                    </p>
                  )}
                  {getStoryContent() && (
                    <p className="text-sm text-textGray leading-relaxed">
                      {getStoryContent()}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-textGray">
                    <span className="inline-flex items-center gap-2">
                      <Users className="w-4 h-4 text-brownWarm" />
                      {servings} {t("recipe.servingsUnit", locale)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brownWarm" />
                      {displaySummary.timeTotalMin} {t("recipe.min", locale)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-brownWarm" />
                      {formatDifficulty(displaySummary.difficulty)}
                    </span>
                  </div>

                  <div
                    className="flex flex-wrap items-center gap-3 pt-2"
                    data-export-ignore="true"
                  >
                    <button
                      onClick={() => setCookModeOpen(true)}
                      className="group flex items-center gap-2 bg-brownWarm hover:bg-brownDark transition-colors rounded-full px-5 py-2.5 text-white font-medium text-sm shadow-subtle"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      {t("recipe.startCooking", locale)}
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-cream rounded-full text-sm text-textGray hover:text-textDark hover:bg-cream/50 transition-colors"
                    >
                      <Heart className={`w-4 h-4 ${saved ? "fill-brownWarm text-brownWarm" : ""}`} />
                      {saved ? t("recipe.saved", locale) : t("recipe.save", locale)}
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-cream rounded-full text-sm text-textGray hover:text-textDark hover:bg-cream/50 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      {t("recipe.share", locale)}
                    </button>
                    <button
                      onClick={handleDownloadRecipe}
                      disabled={isDownloading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-cream rounded-full text-sm text-textGray hover:text-textDark hover:bg-cream/50 transition-colors disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {t("recipe.downloadImage", locale)}
                    </button>
                    <button
                      onClick={handlePrintRecipe}
                      disabled={isPrinting}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-cream rounded-full text-sm text-textGray hover:text-textDark hover:bg-cream/50 transition-colors disabled:opacity-50"
                    >
                      {isPrinting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Printer className="w-4 h-4" />
                      )}
                      {t("recipe.print", locale)}
                    </button>
                  </div>
                </div>
              </section>

              <section id="ingredients" className="scroll-mt-24">
                <div className="bg-white rounded-2xl border border-cream shadow-subtle p-6 md:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-brownWarm" />
                      <h2 className="text-xl font-medium text-textDark">
                        {t("recipeDetail.ingredientsList", locale)}
                      </h2>
                      <span className="text-sm text-textGray">
                        ({servings} {t("recipe.servingsUnit", locale)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-cream rounded-full p-1">
                      {servingOptions.map((size) => (
                        <button
                          key={size}
                          onClick={() => setServings(size)}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                            servings === size
                              ? "bg-brownWarm text-white shadow-subtle"
                              : "text-textGray hover:text-textDark"
                          )}
                        >
                          {size} {t("recipe.servingsUnit", locale)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`grid gap-6 ${hasExtras ? "md:grid-cols-2" : "grid-cols-1"}`}>
                    <div>
                      <h3 className="text-sm font-medium text-textDark mb-3">
                        {t("recipe.mainIngredients", locale)}
                      </h3>
                      <ul className="space-y-3">
                        {mainIngredients.map((item, idx) => {
                          const iconUrl = matchIngredientIcon(item.name, icons);
                          return (
                            <li key={idx} className="flex items-center gap-3">
                              {iconUrl ? (
                                <img
                                  src={iconUrl}
                                  alt={item.name}
                                  className="w-8 h-8 rounded-full object-cover border border-cream"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-cream border border-cream" />
                              )}
                              <div className="flex-1 min-w-0 text-sm text-textDark">
                                {item.name}
                                {item.notes && (
                                  <span className="text-textGray ml-1">
                                    ({item.notes})
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-medium text-brownWarm">
                                {calculateAmount(item.amount)}
                                {item.unit}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    {hasExtras && (
                      <div>
                        <h3 className="text-sm font-medium text-textDark mb-3">
                          {t("recipe.extras", locale)}
                        </h3>
                        <ul className="space-y-3">
                          {subIngredients.map((item, idx) => {
                            const iconUrl = matchIngredientIcon(item.name, icons);
                            return (
                              <li key={idx} className="flex items-center gap-3">
                                {iconUrl ? (
                                  <img
                                    src={iconUrl}
                                    alt={item.name}
                                    className="w-8 h-8 rounded-full object-cover border border-cream"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-cream border border-cream" />
                                )}
                                <div className="flex-1 min-w-0 text-sm text-textDark">
                                  {item.name}
                                  {item.notes && (
                                    <span className="text-textGray ml-1">
                                      ({item.notes})
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-brownWarm">
                                  {calculateAmount(item.amount)}
                                  {item.unit}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section id="steps" className="scroll-mt-24">
                <div className="bg-white rounded-2xl border border-cream shadow-subtle p-6 md:p-8">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <ListChecks className="w-5 h-5 text-brownWarm" />
                    <h2 className="text-xl font-medium text-textDark">
                      {t("recipeDetail.stepsTitle", locale)}
                    </h2>
                    <span className="text-xs px-2 py-1 rounded-full bg-cream text-brownDark font-semibold">
                      {t("recipe.stepsCount", locale).replace(
                        "{count}",
                        String(displaySteps.length)
                      )}
                    </span>
                  </div>

                  <div className="space-y-6" data-export-steps="true">
                    {displaySteps.map((step, index) => (
                      <StepCardNew
                        key={step.id}
                        step={step}
                        stepNumber={index + 1}
                        imageUrl={step.imageUrl}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {(Array.isArray(displayTips) && displayTips.length > 0) ||
              (Array.isArray(displayTroubleshooting) &&
                displayTroubleshooting.length > 0) ||
              (Array.isArray(displayNotes) && displayNotes.length > 0) ? (
                <section id="tips" className="scroll-mt-24">
                  <div className="bg-white rounded-2xl border border-cream shadow-subtle p-6 md:p-8 space-y-6">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-brownWarm" />
                      <h2 className="text-xl font-medium text-textDark">
                        {t("recipeDetail.cookingTips", locale)}
                      </h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      {Array.isArray(displayTips) && displayTips.length > 0 && (
                        <div className="bg-cream/60 rounded-xl p-4 border border-cream">
                          <h3 className="text-sm font-semibold text-textDark mb-3">
                            {t("recipe.tips", locale)}
                          </h3>
                          <ul className="space-y-2 text-sm text-textGray">
                            {displayTips.map((tip, idx) => (
                              <li key={`${tip}-${idx}`} className="flex gap-2">
                                <span className="text-brownWarm">?</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {Array.isArray(displayTroubleshooting) &&
                        displayTroubleshooting.length > 0 && (
                        <div className="bg-cream/60 rounded-xl p-4 border border-cream">
                          <h3 className="text-sm font-semibold text-textDark mb-3">
                            {t("recipe.troubleshooting", locale)}
                          </h3>
                          <ul className="space-y-3 text-sm text-textGray">
                            {displayTroubleshooting.map((item, idx) => (
                              <li key={`${item.problem}-${idx}`}>
                                <div className="font-medium text-textDark">
                                  {item.problem}
                                </div>
                                <div className="mt-1">
                                  {t("recipe.fix", locale)} {item.fix}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {Array.isArray(displayNotes) && displayNotes.length > 0 && (
                      <div className="bg-cream/60 rounded-xl p-4 border border-cream">
                        <h3 className="text-sm font-semibold text-textDark mb-3">
                          {t("recipe.notes", locale)}
                        </h3>
                        <ul className="space-y-2 text-sm text-textGray">
                          {displayNotes.map((note, idx) => (
                            <li key={`${note}-${idx}`} className="flex gap-2">
                              <span className="text-brownWarm">?</span>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              ) : null}

              {hasNutrition && (
                <section id="nutrition" className="scroll-mt-24">
                  <div className="bg-white rounded-2xl border border-cream shadow-subtle p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-6">
                      <Leaf className="w-5 h-5 text-brownWarm" />
                      <h2 className="text-xl font-medium text-textDark">
                        {t("recipeDetail.nutritionTitle", locale)}
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {nutritionItems.map((item) => {
                        const value = (nutritionSource as any)[item.key];
                        if (typeof value !== "number") return null;
                        return (
                          <div
                            key={item.key}
                            className="rounded-xl bg-cream/60 px-4 py-3 border border-cream"
                          >
                            <div className="text-xs text-textGray">
                              {item.label}
                            </div>
                            <div className="text-base font-semibold text-textDark mt-1">
                              {value}
                              <span className="text-xs font-normal text-textGray ml-1">
                                {item.unit}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {(displayNutrition?.dietaryLabels?.length ||
                      displayNutrition?.disclaimer) && (
                      <div className="mt-4 space-y-2 text-sm text-textGray">
                        {displayNutrition?.dietaryLabels?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {displayNutrition.dietaryLabels.map((label) => (
                              <span
                                key={label}
                                className="px-2 py-1 rounded-full bg-cream text-textGray text-xs border border-cream"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {displayNutrition?.disclaimer ? (
                          <div>{displayNutrition.disclaimer}</div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {Array.isArray(displayFaq) && displayFaq.length > 0 && (
                <section id="faq" className="scroll-mt-24">
                  <div className="bg-white rounded-2xl border border-cream shadow-subtle p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-6">
                      <HelpCircle className="w-5 h-5 text-brownWarm" />
                      <h2 className="text-xl font-medium text-textDark">
                        {t("recipeDetail.faqTitle", locale)}
                      </h2>
                    </div>
                    <div className="space-y-4 text-sm text-textGray">
                      {displayFaq.map((item, idx) => (
                        <div
                          key={`${item.question}-${idx}`}
                          className="bg-cream/60 rounded-xl p-4 border border-cream"
                        >
                          <div className="font-medium text-textDark">
                            {item.question}
                          </div>
                          <div className="mt-2">{item.answer}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {(displayPairing?.suggestions?.length ||
                displayPairing?.sauceOrSide?.length) && (
                <section id="pairing" className="scroll-mt-24">
                  <div className="bg-white rounded-2xl border border-cream shadow-subtle p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-6">
                      <Utensils className="w-5 h-5 text-brownWarm" />
                      <h2 className="text-xl font-medium text-textDark">
                        {t("recipeDetail.pairingTitle", locale)}
                      </h2>
                    </div>
                    <div className="space-y-4 text-sm text-textGray">
                      {displayPairing?.suggestions?.length ? (
                        <div>
                          <div className="text-textGray mb-2">
                            {t("recipe.suggestions", locale)}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {displayPairing.suggestions.map((item) => (
                              <span
                                key={item}
                                className="px-2 py-1 rounded-full bg-cream text-textGray text-xs border border-cream"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {displayPairing?.sauceOrSide?.length ? (
                        <div>
                          <div className="text-textGray mb-2">
                            {t("recipe.sauceOrSide", locale)}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {displayPairing.sauceOrSide.map((item) => (
                              <span
                                key={item}
                                className="px-2 py-1 rounded-full bg-cream text-textGray text-xs border border-cream"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cook mode modal */}
      <CookModeModal
        open={cookModeOpen}
        onClose={() => setCookModeOpen(false)}
        steps={displaySteps}
        recipeTitle={displayTitle}
        stepImages={stepImages}
      />
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brownDark text-white text-sm px-4 py-2 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
    </>
  );
}
