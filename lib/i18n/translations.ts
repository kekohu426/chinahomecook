/**
 * 集中翻译管理
 *
 * 存储所有 UI 文本的翻译，避免在组件中硬编码
 *
 * 使用方式：
 * import { t, useTranslations } from "@/lib/i18n/translations";
 *
 * // 服务端组件
 * const text = t("common.loading", locale);
 *
 * // 客户端组件
 * const { t } = useTranslations();
 * const text = t("common.loading");
 */

import type { Locale } from "./config";

// 翻译字典类型
type TranslationDict = {
  [key: string]: string | TranslationDict;
};

// 所有语言的翻译
const translations: Record<Locale, TranslationDict> = {
  zh: {
    common: {
      loading: "加载中...",
      error: "出错了",
      retry: "重试",
      save: "保存",
      cancel: "取消",
      confirm: "确认",
      delete: "删除",
      edit: "编辑",
      search: "搜索",
      filter: "筛选",
      sort: "排序",
      viewAll: "查看全部",
      learnMore: "了解更多",
      backToHome: "返回首页",
      noResults: "暂无结果",
      seeMore: "查看更多",
    },
    nav: {
      home: "首页",
      recipes: "食谱",
      gallery: "图库",
      about: "关于",
      blog: "博客",
      search: "搜索",
    },
    recipe: {
      ingredients: "食材",
      steps: "步骤",
      servings: "份量",
      prepTime: "准备时间",
      cookTime: "烹饪时间",
      totalTime: "总时间",
      difficulty: "难度",
      easy: "简单",
      medium: "中等",
      hard: "困难",
      nutrition: "营养信息",
      tips: "小贴士",
      story: "文化故事",
      startCooking: "开始烹饪",
      exitCookMode: "退出",
      nextStep: "下一步",
      prevStep: "上一步",
      timer: "计时器",
      persons: "人",
      minutes: "分钟",
      calories: "卡路里",
    },
    home: {
      heroTitle: "探索中国美食的无限魅力",
      heroSubtitle: "极致治愈 × 极致实用的中国美食指南",
      featuredRecipes: "精选食谱",
      browseByCategory: "按分类浏览",
      popularCuisines: "热门菜系",
      seasonalPicks: "时令推荐",
      latestRecipes: "最新食谱",
      testimonials: "用户评价",
    },
    search: {
      placeholder: "搜索食谱、食材...",
      results: "搜索结果",
      noResultsFor: "未找到相关结果",
      tryDifferent: "试试其他关键词",
      filters: {
        cuisine: "菜系",
        difficulty: "难度",
        time: "时间",
        ingredients: "食材",
      },
    },
    footer: {
      about: "关于我们",
      contact: "联系我们",
      privacy: "隐私政策",
      terms: "使用条款",
      copyright: "版权所有",
      allRightsReserved: "保留所有权利",
    },
    error: {
      pageNotFound: "页面未找到",
      pageNotFoundDesc: "抱歉，您访问的页面不存在",
      serverError: "服务器错误",
      serverErrorDesc: "抱歉，服务器出现问题，请稍后重试",
    },
  },
  en: {
    common: {
      loading: "Loading...",
      error: "Something went wrong",
      retry: "Retry",
      save: "Save",
      cancel: "Cancel",
      confirm: "Confirm",
      delete: "Delete",
      edit: "Edit",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      viewAll: "View All",
      learnMore: "Learn More",
      backToHome: "Back to Home",
      noResults: "No results",
      seeMore: "See More",
    },
    nav: {
      home: "Home",
      recipes: "Recipes",
      gallery: "Gallery",
      about: "About",
      blog: "Blog",
      search: "Search",
    },
    recipe: {
      ingredients: "Ingredients",
      steps: "Steps",
      servings: "Servings",
      prepTime: "Prep Time",
      cookTime: "Cook Time",
      totalTime: "Total Time",
      difficulty: "Difficulty",
      easy: "Easy",
      medium: "Medium",
      hard: "Hard",
      nutrition: "Nutrition",
      tips: "Tips",
      story: "Story",
      startCooking: "Start Cooking",
      exitCookMode: "Exit",
      nextStep: "Next",
      prevStep: "Previous",
      timer: "Timer",
      persons: "persons",
      minutes: "min",
      calories: "kcal",
    },
    home: {
      heroTitle: "Discover the Magic of Chinese Cuisine",
      heroSubtitle: "Your ultimate guide to authentic Chinese recipes",
      featuredRecipes: "Featured Recipes",
      browseByCategory: "Browse by Category",
      popularCuisines: "Popular Cuisines",
      seasonalPicks: "Seasonal Picks",
      latestRecipes: "Latest Recipes",
      testimonials: "Testimonials",
    },
    search: {
      placeholder: "Search recipes, ingredients...",
      results: "Search Results",
      noResultsFor: "No results found",
      tryDifferent: "Try different keywords",
      filters: {
        cuisine: "Cuisine",
        difficulty: "Difficulty",
        time: "Time",
        ingredients: "Ingredients",
      },
    },
    footer: {
      about: "About Us",
      contact: "Contact",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      copyright: "Copyright",
      allRightsReserved: "All rights reserved",
    },
    error: {
      pageNotFound: "Page Not Found",
      pageNotFoundDesc: "Sorry, the page you're looking for doesn't exist",
      serverError: "Server Error",
      serverErrorDesc: "Sorry, something went wrong. Please try again later",
    },
  },
};

/**
 * 获取嵌套对象的值
 *
 * @param obj 对象
 * @param path 路径，如 "common.loading"
 */
function getNestedValue(obj: TranslationDict, path: string): string | undefined {
  const keys = path.split(".");
  let current: TranslationDict | string = obj;

  for (const key of keys) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    current = current[key];
  }

  return typeof current === "string" ? current : undefined;
}

/**
 * 服务端翻译函数
 *
 * @param key 翻译键，如 "common.loading"
 * @param locale 语言
 * @param fallback 找不到时的回退值
 */
export function t(key: string, locale: Locale, fallback?: string): string {
  const dict = translations[locale] || translations.zh;
  const value = getNestedValue(dict, key);

  if (value) return value;

  // 尝试从默认语言获取
  const defaultValue = getNestedValue(translations.zh, key);
  if (defaultValue) return defaultValue;

  // 返回 fallback 或 key 本身
  return fallback ?? key;
}

/**
 * 获取特定命名空间的所有翻译
 *
 * @param namespace 命名空间，如 "common" 或 "recipe"
 * @param locale 语言
 */
export function getTranslations(
  namespace: string,
  locale: Locale
): Record<string, string> {
  const dict = translations[locale] || translations.zh;
  const nsDict = dict[namespace];

  if (typeof nsDict === "object") {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(nsDict)) {
      if (typeof value === "string") {
        result[key] = value;
      }
    }
    return result;
  }

  return {};
}

/**
 * 客户端翻译 Hook 的类型
 */
export type TranslationFunction = (key: string, fallback?: string) => string;

/**
 * 创建客户端翻译函数
 *
 * 用于客户端组件，需要配合 LocaleProvider 使用
 */
export function createTranslator(locale: Locale): TranslationFunction {
  return (key: string, fallback?: string) => t(key, locale, fallback);
}

// 导出翻译字典（用于调试或扩展）
export { translations };
