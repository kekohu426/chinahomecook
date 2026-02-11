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
      avatarAlt: "{name}头像",
      sentencePunct: "。",
      englishComingSoon: "英文版即将上线。",
      // 列表页
      recipesCount: "共 {count} 道菜谱",
      recipesFound: "共找到 {count} 道菜谱",
      noRecipesYet: "暂无该菜系食谱",
      noRecipesFound: "暂无相关食谱",
      latestRecipes: "最新食谱",
      tryAiCustom: "试试 AI 定制",
      browseAll: "浏览全部食谱",
      allRecipes: "全部食谱",
      signaturePicks: "本菜系精选",
      popularDishes: "最受欢迎的代表菜",
      exploreMore: "探索更多",
      otherCuisines: "其他菜系",
      previous: "上一页",
      nextPage: "下一页",
      pageOf: "第 {current} / {total} 页",
    },
    nav: {
      home: "首页",
      recipes: "食谱",
      gallery: "图库",
      about: "关于",
      blog: "博客",
      search: "搜索",
      aiCustom: "AI 定制",
    },
    auth: {
      signIn: "登录",
      loginTagline: "你的家常菜灵感库",
      signInContinue: "登录以继续",
      signInWithGoogle: "使用 Google 账号登录",
      signInNote: "登录即表示你同意我们的服务条款与隐私政策。",
      signOut: "退出登录",
      admin: "后台管理",
      user: "用户",
    },
    favorites: {
      myFavorites: "我的收藏",
      addToFavorites: "添加收藏",
      removeFromFavorites: "取消收藏",
    },
    filter: {
      all: "全部",
      region: "地点",
      cuisine: "菜系",
      scene: "场景",
      method: "做法",
      taste: "口味",
      crowd: "人群",
      occasion: "场合",
      moreFilters: "更多筛选",
      lessFilters: "收起筛选",
      clearAll: "清除所有筛选",
      searchPlaceholder: "搜索菜谱...比如：宫保鸡丁、红烧肉",
    },
    share: {
      copyLink: "复制链接",
      linkCopied: "链接已复制",
      shareToX: "分享到 Twitter",
      shareToWeibo: "分享到微博",
      moreOptions: "更多分享",
    },
    status: {
      loading: "加载中...",
      saving: "保存中...",
      saved: "已保存",
      success: "成功",
      failed: "失败",
      copied: "已复制",
      generating: "生成中...",
      copyFailed: "复制失败，请重试",
      downloadFailed: "下载失败，请重试",
    },
    ai: {
      generateNow: "立即生成食谱",
      generateFailed: "生成失败，请重试",
      notFound: "找不到菜谱？我们会为您智能生成！",
      customRecipes: "看看别人都定制了什么",
      wantCustomize: "我也要定制 →",
      aiChefTip: "不过，我们的 AI 主厨可以为您即时创作！",
      // AI Chef
      chefTitle: "AI 智能主厨",
      chefDescription: "我是你的数字主厨。关于这道《{title}》，有任何问题，比如没放啤酒可以用什么代替，我都会守在灶台边为你解答。",
      chefPlaceholder: "例如：没放啤酒可以用白酒代替吗？",
      chefAsk: "咨询主厨",
      chefThinking: "思考中...",
      chefAdvice: "主厨的建议：",
      chefUnavailable: "AI 服务暂时不可用",
      chefError: "抱歉，AI 主厨暂时无法回答，请稍后再试。",
    },
    gallery: {
      loadingImage: "图片加载中...",
      stepImage: "步骤配图",
      title: "高清美食图片库",
      viewRelated: "查看相关菜谱",
      downloadFailed: "下载失败",
      downloadFailedRetry: "下载失败，请稍后重试",
      view: "查看大图",
      download: "下载图片",
      loading: "加载中...",
      loadedAll: "已加载全部",
      images: "张图片",
      viewRecipe: "查看食谱",
      recipeOf: "的做法",
      hdPhoto: "高清图片",
      imageNotFound: "图片未找到",
      photoTitle: "美食照片",
      photoDescription: "查看 {title} 的高清美食照片。",
      backToGallery: "返回图库",
      downloadImage: "下载图片",
      imageLicense: "图片仅供个人与非商业用途使用",
      viewFullRecipe: "查看完整食谱",
      relatedImages: "相关图片",
    },
    recipeDetail: {
      minutes: "分钟",
      easy: "简单",
      medium: "中等",
      hard: "困难",
      calories: "热量",
      protein: "蛋白质",
      fat: "脂肪",
      carbs: "碳水",
      fiber: "膳食纤维",
      sodium: "钠",
      timerFinished: "计时器结束",
      copy: "复制",
      copied: "已复制",
      recipeNotFound: "食谱不存在",
      teamReviewed: "专业审核的可靠食谱。",
      ingredientsList: "食材清单",
      stepsTitle: "制作步骤",
      cookingTips: "烹饪技巧",
      nutritionTitle: "营养信息",
      faqTitle: "常见问题",
      pairingTitle: "搭配推荐",
      presentedBy: "本食谱由以下成员呈现",
      explorerLabel: "探索者",
      reviewerLabel: "审核者",
    },
    recipe: {
      ingredients: "食材",
      steps: "步骤",
      stepsCount: "共 {count} 步",
      servings: "份量",
      servingsUnit: "人份",
      prepTime: "准备时间",
      cookTime: "烹饪时间",
      totalTime: "总时间",
      activeTime: "操作时间",
      difficulty: "难度",
      difficultyLabel: "难度系数",
      estimated: "参考能量",
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
      min: "分钟",
      modeEveryday: "日常模式",
      timeMinutes: "{count}分钟",
      calories: "卡路里",
      // 下载/打印
      downloadImage: "下载长图",
      printImage: "打印长图",
      preparing: "生成中...",
      preparingPrint: "准备中...",
      downloadImageFailed: "下载长图失败，请重试",
      printImageFailed: "打印长图失败，请重试",
      recipeLabel: "食谱",
      recipeTitle: "食谱",
      allowPopups: "请允许弹出窗口以打印食谱",
      // 计时器
      timerRunning: "计时运行中",
      startTimer: "开启计时器",
      // 烹饪模式
      pause: "暂停",
      resume: "继续",
      start: "开始",
      reset: "重置",
      readStep: "朗读步骤",
      pressR: "(按 R 键)",
      doneWhen: "完成标志",
      clickToStart: "点击开始计时",
      // 烹饪模式弹窗
      exitConfirm: "退出烹饪模式将丢失进度，确定退出？",
      stepOf: "步骤",
      exit: "退出",
      doneWhenLabel: "完成标准：",
      pitfallLabel: "失败点：",
      readStepKey: "朗读步骤（按R键）",
      previous: "上一步",
      next: "下一步",
      finishCooking: "完成烹饪",
      jumpToStep: "跳转到步骤 {step}",
      timerRunningStatus: "计时进行中...",
      paused: "已暂停",
      shortcutSwitch: "← → 切换步骤",
      shortcutTimer: "空格 暂停/继续计时",
      shortcutRead: "R 朗读",
      shortcutExit: "ESC 退出",
      checkLabel: "状态检查：",
      // 食谱详情
      mainIngredients: "主料",
      extras: "辅料",
      save: "收藏",
      saved: "已收藏",
      savedToast: "已加入收藏",
      removedToast: "已取消收藏",
      share: "分享",
      download: "下载食谱",
      print: "打印食谱",
      downloadFailed: "下载失败，请稍后重试",
      aiGenerated: "AI生成",
      relatedRecipes: "相关食谱推荐",
      moreRecipes: "查看更多 {name} →",
      // 搜索相关
      byRegion: "按地点",
      byCuisine: "按菜系",
      byIngredient: "按食材",
      searchHint: "找不到菜谱？我们会为您智能生成！",
      metaSearchTitle: "搜索“{query}”",
      metaCuisineTitle: "{name}菜谱",
      metaLocationTitle: "{name}地区菜谱",
      metaIngredientTitle: "{name}做法",
      searchPrefix: "搜索：{query}",
      ingredientPrefix: "食材：{ingredient}",
      resultsTitle: "搜索结果",
      foundCount: "找到 {count} 个相关食谱",
      // 详情页额外标签
      aboutDish: "关于这道菜：",
      step: "步骤",
      check: "状态检查：",
      pitfall: "失败点：",
      printedAt: "打印时间",
      summary: "摘要：",
      faq: "常见问题",
      troubleshooting: "失败排查",
      cause: "原因：",
      fix: "解决：",
      pairingSuggestions: "搭配建议",
      suggestions: "推荐搭配",
      sauceOrSide: "酱料/配菜",
      notes: "备注",
      perServing: "（每份）",
      shareOpened: "已打开分享",
      linkCopied: "链接已复制",
      shareFailed: "分享失败",
      cuisine: {
        filterTitle: "{name}菜谱",
        metaTitle: "{name}菜谱大全 - Recipe Zen",
        metaDescription: "精选{name}做法大全，新手友好，步骤详解。",
        headerTitle: "{name}菜谱",
        headerSubtitle: "精选{name}家常做法，步骤详解，新手友好。",
      },
      ingredient: {
        metaTitle: "{name}做法 - Recipe Zen",
        metaDescription: "精选{name}相关做法，家常易做。",
        headerSubtitle: "围绕{name}的家常做法合集。",
      },
      method: {
        metaTitle: "{name}做法 - Recipe Zen",
        metaDescription: "精选{name}做法食谱，详细步骤指导，轻松掌握烹饪技巧。",
        headerTitle: "{name}食谱",
        headerSubtitle: "精选{name}做法食谱，详细步骤指导，让你轻松掌握烹饪技巧。",
      },
      scene: {
        metaTitle: "{name}食谱 - Recipe Zen",
        metaDescription: "精选{name}相关食谱，步骤详细，适合各种烹饪场景。",
        headerTitle: "{name}食谱",
        headerSubtitle: "精选{name}相关食谱，步骤详细，让每个烹饪时刻都充满美味。",
      },
      taste: {
        metaTitle: "{name}口味菜谱 - Recipe Zen",
        metaDescription: "精选{name}口味食谱，满足你的味蕾，发现更多美味。",
        headerTitle: "{name}口味菜谱",
        headerSubtitle: "精选{name}口味食谱，满足你的味蕾，发现更多美味。",
      },
      crowd: {
        metaTitle: "{name}食谱 - Recipe Zen",
        metaDescription: "精选适合{name}的健康食谱，营养均衡，美味可口。",
        headerTitle: "{name}食谱",
        headerSubtitle: "精选适合{name}的健康食谱，营养均衡，美味可口。",
      },
      occasion: {
        metaTitle: "{name}食谱 - Recipe Zen",
        metaDescription: "精选{name}相关食谱，让每个特别时刻都充满美味。",
        headerTitle: "{name}食谱",
        headerSubtitle: "精选{name}相关食谱，让每个特别时刻都充满美味。",
      },
      region: {
        metaTitle: "{name}风味家常菜谱 - Recipe Zen",
        metaDescription: "精选{name}风味家常菜谱。",
        headerSubtitle: "{name}风味家常菜谱合集。",
      },
      theme: {
        metaTitle: "{name}食谱 - Recipe Zen",
        metaDescription: "精选{name}相关食谱，家常易做。",
      },
    },
    home: {
      heroTitle: "探索中国美食的无限魅力",
      heroSubtitle: "极致治愈 × 极致实用的中国美食指南",
      featuredRecipes: "精选食谱",
      browseByCategory: "按分类浏览",
      popularCuisines: "热门菜系",
      seasonalPicks: "时令推荐",
      latestRecipes: "最新食谱",
      testimonials: "用户证言",
      weeklyFavorites: "本周精选家常菜",
      viewMore: "查看更多",
      whyChooseUs: "为什么选择 Recipe Zen",
      ourMission: "我们的初心",
      learnOurStory: "了解我们的故事 →",
      cookingTips: "美食知识与烹饪技巧",
      statsGenerated: "已生成",
      statsCollected: "已收藏",
      statsRecipes: "菜谱",
      statsTimes: "次",
      teamVerified: "专业团队审核 · 步骤可复现",
      startJourney: "开始你的简单厨房之旅",
      noRegistration: "无需注册，无需付费，立即浏览 1000+ 精选家常菜。",
      startExploring: "开始探索食谱 →",
      tryAiCustom: "或尝试AI定制 →",
      browseAllRecipes: "浏览全部食谱 →",
      aiCustomSubtitle: "或试试 AI定制你的专属菜谱 →",
      noCustomRecipes: "暂无定制食谱，欢迎创建你的第一道专属菜谱。",
      realUserFeedback: "来自真实用户的反馈，温度与专业并存。",
      notJustRecipes: "不只是菜谱，还有实用的烹饪知识与美食文化。",
      readMore: "查看更多",
      teamPlaceholder: "团队与厨房场景",
      // 核心优势区块
      featureExpertReview: "专业审核",
      featureExpertReviewDesc: "每道菜谱都经过人工审核，保证质量。",
      featureClearSteps: "步骤清晰",
      featureClearStepsDesc: "语音+计时辅助，不怕出错，操作更顺畅。",
      featureSaveTime: "节省时间",
      featureSaveTimeDesc: "3分钟找到今天要做的菜，简化决策流程。",
      featureFamilyFriendly: "家庭友好",
      featureFamilyFriendlyDesc: "家常口味，适合孩子和长辈的需求。",
      // 工具展示区块
      toolsTitle: "让做饭更轻松的智能工具",
      toolsSubtitle: "从烹饪模式到语音提醒，让每一步都更从容。",
      cookModePreview: "烹饪模式预览",
      cookModeTitle: "烹饪模式",
      cookModeFeature1: "大字体步骤显示，远距离也能看清",
      cookModeFeature2: "单步骤智能计时，声音提醒不忘记",
      cookModeFeature3: "语音朗读步骤，解放双手边听边做",
      cookModeFeature4: "支持中英文语音朗读",
      cookModeCta: "立即体验 →",
      toolkitTitle: "实用工具集",
      toolkitPreview: "工具箱预览",
      toolkitFeature1: "图文打印：完整步骤+配图，贴在厨房也方便",
      toolkitFeature2: "语音朗读：手上有面粉也能跟着做",
      toolkitFeature3: "智能计时：精准提醒，不怕错过火候",
      toolkitFeature4: "背景音乐：内置轻音乐，烹饪氛围更轻松",
      toolkitFeature5: "一键分享：和家人朋友一起学做菜",
      toolkitCta: "查看所有功能 →",
      // 品牌故事区块
      valueFree: "免费",
      valueFreeDesc: "让每个人都能轻松学做菜，不因价格而犹豫。",
      valueHealing: "治愈",
      valueHealingDesc: "用一道道家常菜，温暖每个平凡的日子。",
      valueCare: "用心",
      valueCareDesc: "AI 提供效率，团队保证质量，细节更安心。",
      // 主题卡片区块
      themeCardsTitle: "热门主题",
      themeCardsSubtitle: "精选食谱主题，找到你想要的",
      // 定制食谱区块
      customRecipesTitle: "看看别人都定制了什么",
      customRecipesSubtitle: "从减脂餐到快手菜，AI 已帮助 10,000+ 人找到答案。",
      // 图库预览区块
      galleryPreviewSubtitle: "AI生成的精美图片，可免费下载使用。",
      // 快速浏览区块
      quickBrowseTitle: "按菜系 / 地点浏览",
      quickBrowseSubtitle: "从四川到广东，从家常菜到宴客菜，一键直达你想要的风味。",
      // 价值循环区块
      valueLoopTitle: "从想法到成品，只需4步",
      valueLoopSubtitle: "清晰的步骤让烹饪不再复杂，每个人都能轻松上手。",
    },
    meta: {
      titleTemplate: "%s - Recipe Zen",
      defaultTitle: "Recipe Zen",
      defaultDescription: "温暖可靠的中式美食伙伴，专家审核的家常食谱。",
      homeTitle: "Recipe Zen - 中式家常菜谱",
      homeDescription: "精选家常中餐食谱，步骤清晰，轻松下厨。",
    },
    about: {
      metaTitle: "关于我们 - Recipe Zen",
      metaDescription: "了解 Recipe Zen 的团队与使命。",
      heroTitle: "关于我们",
      heroDescription: "我们相信家常味道的力量，用专业与热爱打造可靠的中式食谱。",
      breadcrumb: "关于",
      teamIntro: "我们共有 {count} 位成员，用专业与热爱打造可靠的食谱。",
    },
    blog: {
      metaTitle: "美食博客 - Recipe Zen",
      metaDescription: "家常烹饪技巧、故事与灵感。",
      heroTitle: "美食博客",
      heroTitleEn: "Blog",
      heroSubtitle: "分享家常烹饪技巧与美食故事。",
      breadcrumb: "博客",
      filterLabel: "筛选",
      filterClear: "清除筛选",
      emptyTitle: "暂无文章",
      emptySubtitle: "敬请期待更多内容。",
      readMore: "阅读更多",
      postNotFound: "文章未找到",
      readingTime: "{count} 分钟阅读",
      otherLanguages: "其他语言",
      shareLabel: "分享",
      authorLabel: "作者",
      backToList: "返回博客",
    },
    customRecipes: {
      metaTitle: "AI 定制食谱 - Recipe Zen",
      metaDescription: "告诉我们你的需求，AI 为你定制专属食谱。",
    },
    legal: {
      lastUpdatedLabel: "最后更新",
      lastUpdatedDate: "2024-06-01",
      links: {
        privacy: "隐私政策",
        terms: "使用条款",
        copyright: "版权声明",
        about: "关于我们",
      },
      terms: {
        title: "使用条款",
        metaTitle: "使用条款 - Recipe Zen",
        metaDescription: "Recipe Zen 使用条款。",
      },
      privacy: {
        title: "隐私政策",
        metaTitle: "隐私政策 - Recipe Zen",
        metaDescription: "Recipe Zen 隐私政策。",
      },
      copyright: {
        title: "版权声明",
        metaTitle: "版权声明 - Recipe Zen",
        metaDescription: "Recipe Zen 版权声明。",
      },
    },
    search: {
      metaTitle: "搜索食谱 - Recipe Zen",
      metaTitleQuery: "搜索“{query}” - Recipe Zen",
      metaDescription: "搜索食谱、食材与烹饪灵感。",
      promptTypeDish: "请输入菜名或食材开始搜索",
      failed: "搜索失败",
      failedDescription: "请稍后再试或更换关键词",
      aiGeneratedTitle: "AI 为你生成了食谱",
      aiGeneratedDescription: "我们没有找到与“{query}”完全匹配的内容，已为你生成新的食谱。",
      foundCount: "找到 {count} 条结果",
      breadcrumb: "搜索",
      breadcrumbQuery: "搜索“{query}”",
      searching: "正在搜索...",
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
      quickLinks: "快速链接",
      aiCustom: "AI 定制",
      ourStory: "品牌故事",
      team: "团队介绍",
      legal: "法律声明",
    },
    language: {
      selectLanguage: "选择语言",
      english: "英文",
      chinese: "中文",
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
      avatarAlt: "{name} avatar",
      sentencePunct: ".",
      englishComingSoon: "English version coming soon.",
      // Listing pages
      recipesCount: "{count} recipes",
      recipesFound: "{count} dishes found",
      noRecipesYet: "No recipes found for this cuisine yet",
      noRecipesFound: "No recipes found",
      latestRecipes: "Latest Recipes",
      tryAiCustom: "Try AI Custom",
      browseAll: "Browse All",
      allRecipes: "All Recipes",
      signaturePicks: "Signature Picks",
      popularDishes: "Most popular dishes to start with",
      exploreMore: "Explore More",
      otherCuisines: "Other Cuisines",
      previous: "Previous",
      nextPage: "Next",
      pageOf: "Page {current} / {total}",
    },
    nav: {
      home: "Home",
      recipes: "Recipes",
      gallery: "Gallery",
      about: "About",
      blog: "Blog",
      search: "Search",
      aiCustom: "AI Custom",
    },
    auth: {
      signIn: "Sign in",
      loginTagline: "Your home-cooking inspiration",
      signInContinue: "Sign in to continue",
      signInWithGoogle: "Sign in with Google",
      signInNote: "By signing in you agree to our Terms and Privacy Policy.",
      signOut: "Sign out",
      admin: "Admin",
      user: "User",
    },
    favorites: {
      myFavorites: "My Favorites",
      addToFavorites: "Add to favorites",
      removeFromFavorites: "Remove from favorites",
    },
    filter: {
      all: "All",
      region: "Region",
      cuisine: "Cuisine",
      scene: "Scene",
      method: "Method",
      taste: "Taste",
      crowd: "For",
      occasion: "Occasion",
      moreFilters: "More filters",
      lessFilters: "Less filters",
      clearAll: "Clear all filters",
      searchPlaceholder: "Search recipes... e.g. Kung Pao Chicken",
    },
    share: {
      copyLink: "Copy link",
      linkCopied: "Link copied",
      shareToX: "Share to X",
      shareToWeibo: "Share to Weibo",
      moreOptions: "More share options",
    },
    status: {
      loading: "Loading...",
      saving: "Saving...",
      saved: "Saved",
      success: "Success",
      failed: "Failed",
      copied: "Copied",
      generating: "Generating...",
      copyFailed: "Copy failed. Please try again.",
      downloadFailed: "Download failed. Please try again.",
    },
    ai: {
      generateNow: "Generate now",
      generateFailed: "Generation failed. Please try again.",
      notFound: "Can't find it? We'll generate a recipe for you!",
      customRecipes: "See what others customized",
      wantCustomize: "I Want to Customize Too →",
      aiChefTip: "But our AI chef can create one for you instantly!",
      // AI Chef
      chefTitle: "AI Chef",
      chefDescription: "I'm your digital chef. Ask anything about \"{title}\"—for example, what to substitute if you don't have beer—and I'll guide you step by step.",
      chefPlaceholder: "Example: Can I use white wine instead of beer?",
      chefAsk: "Ask Chef",
      chefThinking: "Thinking...",
      chefAdvice: "Chef's advice:",
      chefUnavailable: "AI service is temporarily unavailable",
      chefError: "Sorry, the AI chef can't respond right now. Please try again later.",
    },
    gallery: {
      loadingImage: "Loading image...",
      stepImage: "Step image",
      title: "Food Image Library",
      viewRelated: "View related recipes",
      downloadFailed: "Download failed",
      downloadFailedRetry: "Download failed. Please try again.",
      view: "View",
      download: "Download",
      loading: "Loading...",
      loadedAll: "Loaded all",
      images: "images",
      viewRecipe: "View Recipe",
      recipeOf: " recipe",
      hdPhoto: "HD photo",
      imageNotFound: "Image not found",
      photoTitle: "Food Photo",
      photoDescription: "View the high-resolution photo of {title}.",
      backToGallery: "Back to Gallery",
      downloadImage: "Download Image",
      imageLicense: "Images are free for personal and non-commercial use.",
      viewFullRecipe: "View Full Recipe",
      relatedImages: "Related Images",
    },
    recipeDetail: {
      minutes: "min",
      easy: "Easy",
      medium: "Medium",
      hard: "Hard",
      calories: "Calories",
      protein: "Protein",
      fat: "Fat",
      carbs: "Carbs",
      fiber: "Fiber",
      sodium: "Sodium",
      timerFinished: "Timer finished",
      copy: "Copy",
      copied: "Copied",
      recipeNotFound: "Recipe not found",
      teamReviewed: "A trusted recipe reviewed by our team.",
      ingredientsList: "Ingredients",
      stepsTitle: "Steps",
      cookingTips: "Cooking Tips",
      nutritionTitle: "Nutrition",
      faqTitle: "FAQ",
      pairingTitle: "Pairings",
      presentedBy: "Presented by",
      explorerLabel: "Explorer",
      reviewerLabel: "Reviewer",
    },
    recipe: {
      ingredients: "Ingredients",
      steps: "Steps",
      stepsCount: "{count} steps",
      servings: "Servings",
      servingsUnit: "servings",
      prepTime: "Prep Time",
      cookTime: "Cook Time",
      totalTime: "Total time",
      activeTime: "Active time",
      difficulty: "Difficulty",
      difficultyLabel: "Difficulty",
      estimated: "Estimated",
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
      min: "min",
      modeEveryday: "Everyday Mode",
      timeMinutes: "{count} min",
      calories: "Calories",
      // Download/Print
      downloadImage: "Download Image",
      printImage: "Print Image",
      preparing: "Preparing...",
      preparingPrint: "Preparing...",
      downloadImageFailed: "Download failed. Please try again.",
      printImageFailed: "Print failed. Please try again.",
      recipeLabel: "recipe",
      recipeTitle: "Recipe",
      allowPopups: "Please allow pop-ups to print the recipe.",
      // Timer
      timerRunning: "Timer running",
      startTimer: "Start timer",
      // Cook mode
      pause: "Pause",
      resume: "Resume",
      start: "Start",
      reset: "Reset",
      readStep: "Read step",
      pressR: "(press R)",
      doneWhen: "Done when",
      clickToStart: "Click to start timer",
      // Cook mode modal
      exitConfirm: "Exit cook mode? Your progress will be lost.",
      stepOf: "Step",
      exit: "Exit",
      doneWhenLabel: "Done when:",
      pitfallLabel: "Pitfall:",
      readStepKey: "Read step (press R)",
      previous: "Previous",
      next: "Next",
      finishCooking: "Finish cooking",
      jumpToStep: "Jump to step {step}",
      timerRunningStatus: "Timer running...",
      paused: "Paused",
      shortcutSwitch: "← → Switch steps",
      shortcutTimer: "Space Pause/Resume timer",
      shortcutRead: "R Read",
      shortcutExit: "ESC Exit",
      checkLabel: "Check:",
      // Recipe detail
      mainIngredients: "MAIN",
      extras: "EXTRAS",
      save: "Save",
      saved: "Saved",
      savedToast: "Saved to favorites",
      removedToast: "Removed from favorites",
      share: "Share",
      download: "Download",
      print: "Print",
      downloadFailed: "Download failed. Please try again.",
      aiGenerated: "AI",
      relatedRecipes: "Related Recipes",
      moreRecipes: "More {name} →",
      // Search related
      byRegion: "By Region",
      byCuisine: "By Cuisine",
      byIngredient: "By Ingredient",
      searchHint: "Can't find it? We'll generate one for you!",
      metaSearchTitle: "Search \"{query}\"",
      metaCuisineTitle: "{name} Recipes",
      metaLocationTitle: "{name} Recipes",
      metaIngredientTitle: "{name} Recipes",
      searchPrefix: "Search: {query}",
      ingredientPrefix: "Ingredient: {ingredient}",
      resultsTitle: "Results",
      foundCount: "Found {count} recipes",
      // Detail page extra labels
      aboutDish: "About this dish:",
      step: "Step",
      check: "Check:",
      pitfall: "Pitfall:",
      printedAt: "Printed at",
      summary: "Summary:",
      faq: "FAQ",
      troubleshooting: "Troubleshooting",
      cause: "Cause:",
      fix: "Fix:",
      pairingSuggestions: "Pairing Suggestions",
      suggestions: "Suggestions",
      sauceOrSide: "Sauce or Side",
      notes: "Notes",
      perServing: "(per serving)",
      shareOpened: "Share opened.",
      linkCopied: "Link copied.",
      shareFailed: "Share failed.",
      cuisine: {
        filterTitle: "{name} Recipes",
        metaTitle: "{name} Recipes - Recipe Zen",
        metaDescription: "Explore authentic {name} recipes with step-by-step instructions.",
        headerTitle: "{name} Recipes",
        headerSubtitle: "Explore authentic {name} recipes with step-by-step instructions.",
      },
      ingredient: {
        metaTitle: "{name} Recipes - Recipe Zen",
        metaDescription: "Explore recipes featuring {name}.",
        headerSubtitle: "Recipes featuring {name}, curated for home cooking.",
      },
      method: {
        metaTitle: "{name} Recipes - Recipe Zen",
        metaDescription: "Master {name} cooking techniques with step-by-step recipes.",
        headerTitle: "{name} Recipes",
        headerSubtitle: "Master the art of {name} with our curated recipe collection. Step-by-step guides for perfect results.",
      },
      scene: {
        metaTitle: "{name} Recipes - Recipe Zen",
        metaDescription: "Discover perfect {name} recipes with step-by-step instructions.",
        headerTitle: "{name} Recipes",
        headerSubtitle: "Discover perfect recipes for {name}. Curated collection with step-by-step instructions.",
      },
      taste: {
        metaTitle: "{name} Recipes - Recipe Zen",
        metaDescription: "Explore delicious {name} recipes to satisfy your cravings.",
        headerTitle: "{name} Recipes",
        headerSubtitle: "Explore delicious {name} recipes to satisfy your cravings.",
      },
      crowd: {
        metaTitle: "{name} Recipes - Recipe Zen",
        metaDescription: "Curated recipes specially designed for {name}.",
        headerTitle: "{name} Recipes",
        headerSubtitle: "Curated recipes specially designed for {name}.",
      },
      occasion: {
        metaTitle: "{name} Recipes - Recipe Zen",
        metaDescription: "Perfect recipes for {name} celebrations and gatherings.",
        headerTitle: "{name} Recipes",
        headerSubtitle: "Perfect recipes for {name} celebrations and gatherings.",
      },
      region: {
        metaTitle: "Regional {name} Recipes - Recipe Zen",
        metaDescription: "Explore recipes inspired by {name} flavors.",
        headerSubtitle: "Regional recipes inspired by {name}.",
      },
      theme: {
        metaTitle: "{name} Recipes - Recipe Zen",
        metaDescription: "Explore {name} recipes, curated for home cooking.",
      },
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
      weeklyFavorites: "Weekly Favorites",
      viewMore: "View more",
      whyChooseUs: "Why Choose Recipe Zen",
      ourMission: "Our Mission",
      learnOurStory: "Learn our story →",
      cookingTips: "Cooking Tips & Food Stories",
      statsGenerated: "Generated",
      statsCollected: "Collected",
      statsRecipes: "recipes",
      statsTimes: "times",
      teamVerified: "Team verified · Reproducible steps",
      startJourney: "Start Your Simple Kitchen Journey",
      noRegistration: "No registration, no fees. Browse 1000+ curated home recipes now.",
      startExploring: "Start Exploring Recipes →",
      tryAiCustom: "Or Try AI Custom →",
      browseAllRecipes: "Browse All Recipes →",
      aiCustomSubtitle: "Or try AI custom for your own recipe →",
      noCustomRecipes: "No custom recipes yet. Create your first personalized dish!",
      realUserFeedback: "Real feedback from our community, warm and professional.",
      notJustRecipes: "Not just recipes, but cooking tips and food culture.",
      readMore: "Read more",
      teamPlaceholder: "Team + kitchen scene",
      // Core features section
      featureExpertReview: "Expert Reviewed",
      featureExpertReviewDesc: "Every recipe is manually reviewed to ensure quality.",
      featureClearSteps: "Clear Steps",
      featureClearStepsDesc: "Voice + timer assistance, no mistakes, smoother cooking.",
      featureSaveTime: "Save Time",
      featureSaveTimeDesc: "Find today's dish in 3 minutes, simplify decision-making.",
      featureFamilyFriendly: "Family Friendly",
      featureFamilyFriendlyDesc: "Home-style flavors suitable for kids and elders.",
      // Tools showcase section
      toolsTitle: "Smart Tools for Easier Cooking",
      toolsSubtitle: "From cook mode to voice reminders, every step made easier.",
      cookModePreview: "Cook mode preview",
      cookModeTitle: "Cook Mode",
      cookModeFeature1: "Large font steps, visible from a distance",
      cookModeFeature2: "Smart step timer with sound reminders",
      cookModeFeature3: "Voice readout, hands-free cooking",
      cookModeFeature4: "Supports Chinese and English voice",
      cookModeCta: "Try Now →",
      toolkitTitle: "Useful Toolkit",
      toolkitPreview: "Toolkit preview",
      toolkitFeature1: "Print with images: Full steps + photos, kitchen-friendly",
      toolkitFeature2: "Voice readout: Cook even with flour on your hands",
      toolkitFeature3: "Smart timer: Precise reminders, never miss the timing",
      toolkitFeature4: "Background music: Built-in relaxing tunes",
      toolkitFeature5: "One-click share: Cook together with family and friends",
      toolkitCta: "View All Features →",
      // Brand story section
      valueFree: "Free",
      valueFreeDesc: "Everyone can learn to cook, without hesitating over price.",
      valueHealing: "Healing",
      valueHealingDesc: "Warm up ordinary days with homemade dishes.",
      valueCare: "Caring",
      valueCareDesc: "AI for efficiency, team for quality, details for peace of mind.",
      // Theme cards section
      themeCardsTitle: "Popular Themes",
      themeCardsSubtitle: "Curated recipe themes, find what you want",
      // Custom recipes section
      customRecipesTitle: "See What Others Have Customized",
      customRecipesSubtitle: "From diet meals to quick dishes, AI has helped 10,000+ people find answers.",
      // Gallery preview section
      galleryPreviewSubtitle: "AI-generated images, free to download and use.",
      // Quick browse section
      quickBrowseTitle: "Browse by Cuisine / Region",
      quickBrowseSubtitle: "From Sichuan to Cantonese, from home-style to feast, one click to your flavor.",
      // Value loop section
      valueLoopTitle: "From idea to plate in 4 steps",
      valueLoopSubtitle: "Clear steps that make cooking simple, everyone can master it.",
    },
    meta: {
      titleTemplate: "%s - Recipe Zen",
      defaultTitle: "Recipe Zen",
      defaultDescription: "A warm, reliable Chinese food companion with expert-reviewed recipes.",
      homeTitle: "Recipe Zen - Chinese Home Cooking Recipes",
      homeDescription: "Curated Chinese home recipes with clear steps and trusted results.",
    },
    about: {
      metaTitle: "About Us - Recipe Zen",
      metaDescription: "Meet the Recipe Zen team and our mission.",
      heroTitle: "About Us",
      heroDescription: "We believe in the power of home cooking and build reliable Chinese recipes with care.",
      breadcrumb: "About",
      teamIntro: "Meet our {count} team members who craft reliable recipes with care.",
    },
    blog: {
      metaTitle: "Recipe Zen Blog",
      metaDescription: "Stories and tips for everyday Chinese cooking.",
      heroTitle: "Blog",
      heroTitleEn: "Blog",
      heroSubtitle: "Stories, tips, and recipes for everyday cooking.",
      breadcrumb: "Blog",
      filterLabel: "Filter",
      filterClear: "Clear",
      emptyTitle: "No posts yet",
      emptySubtitle: "Check back soon for new stories.",
      readMore: "Read more",
      postNotFound: "Post not found",
      readingTime: "{count} min read",
      otherLanguages: "Other languages",
      shareLabel: "Share",
      authorLabel: "Author",
      backToList: "Back to blog",
    },
    customRecipes: {
      metaTitle: "AI Custom Recipes - Recipe Zen",
      metaDescription: "Tell us your needs and get personalized recipes.",
    },
    legal: {
      lastUpdatedLabel: "Last updated",
      lastUpdatedDate: "June 1, 2024",
      links: {
        privacy: "Privacy Policy",
        terms: "Terms of Service",
        copyright: "Copyright",
        about: "About",
      },
      terms: {
        title: "Terms of Service",
        metaTitle: "Terms of Service - Recipe Zen",
        metaDescription: "Recipe Zen terms of service.",
      },
      privacy: {
        title: "Privacy Policy",
        metaTitle: "Privacy Policy - Recipe Zen",
        metaDescription: "Recipe Zen privacy policy.",
      },
      copyright: {
        title: "Copyright",
        metaTitle: "Copyright - Recipe Zen",
        metaDescription: "Recipe Zen copyright notice.",
      },
    },
    search: {
      metaTitle: "Search Recipes - Recipe Zen",
      metaTitleQuery: "Search \"{query}\" - Recipe Zen",
      metaDescription: "Search recipes, ingredients, and cooking ideas.",
      promptTypeDish: "Type a dish or ingredient to start searching",
      failed: "Search failed",
      failedDescription: "Please try again later or use different keywords.",
      aiGeneratedTitle: "AI generated a recipe for you",
      aiGeneratedDescription: "We couldn't find a perfect match for “{query}”, so we created a new recipe.",
      foundCount: "Found {count} results",
      breadcrumb: "Search",
      breadcrumbQuery: "Search \"{query}\"",
      searching: "Searching...",
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
      quickLinks: "Quick Links",
      aiCustom: "AI Custom",
      ourStory: "Our Story",
      team: "Team",
      legal: "Legal",
    },
    language: {
      selectLanguage: "Language",
      english: "English",
      chinese: "Chinese",
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
  const baseLocale = locale === "zh" ? "zh" : "en";
  const dict =
    translations[locale] ||
    translations[baseLocale] ||
    translations.en ||
    translations.zh;
  const value = getNestedValue(dict, key);

  if (value) return value;

  // 尝试从基础语言获取（避免英文环境回退到中文）
  const baseDict =
    translations[baseLocale] || translations.en || translations.zh;
  const baseValue = getNestedValue(baseDict, key);
  if (baseValue) return baseValue;

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

/**
 * 客户端翻译 Hook
 *
 * 在客户端组件中使用，自动获取当前语言环境
 *
 * @example
 * const { t } = useTranslations();
 * return <p>{t("common.loading")}</p>;
 */
export function useTranslations() {
  // 动态导入以避免循环依赖
  const { useLocale } = require("@/components/i18n/LocaleProvider");
  const locale = useLocale() as Locale;
  const translator = createTranslator(locale);

  return {
    t: translator,
    locale,
  };
}
