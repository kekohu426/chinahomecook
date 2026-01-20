"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Edit2,
  Trash2,
  Plus,
  Loader2,
  Save,
  Layout,
  Grid,
  X,
  BarChart3,
  List,
  Users,
  Sparkles,
  FileText,
  Search,
  GripVertical,
  ArrowUpDown,
  Flame,
  Images,
} from "lucide-react";
import { DEFAULT_LOCALE, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";

interface ThemeCard {
  id: string;
  title: string;
  imageUrl: string;
  tag: string;
  href?: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface HeroConfig {
  title: string;
  displayTitle?: string;
  seoTitle?: string;
  subtitle: string;
  placeholder: string;
  chips: string[];
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  imageUrl?: string;
  imageFloatingText?: string;
  statsLabels?: {
    generated?: string;
    recipes?: string;
    collected?: string;
    times?: string;
  };
}

interface StatsConfig {
  recipesGenerated: number;
  recipesCollected: number;
  totalDownloads: number;
}

interface BrowseItem {
  id: string;
  type: "REGION" | "CUISINE" | "INGREDIENT" | "SCENE";
  name: string;
  description?: string | null;
  href: string;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  city: string;
  content: string;
  meta: string;
  avatarUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface CoreFeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface ToolConfig {
  title: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
}

interface BrandStoryConfig {
  values: { title: string; description: string }[];
  ctaLabel: string;
  ctaHref: string;
}

interface ConversionCtaConfig {
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

interface SectionTitles {
  quickBrowse?: { title?: string; subtitle?: string };
  hotRecipes?: { title?: string; subtitle?: string; ctaLabel?: string; ctaHref?: string };
  customRecipes?: { title?: string; subtitle?: string; ctaLabel?: string; ctaHref?: string };
  themes?: { title?: string; subtitle?: string; ctaLabel?: string; ctaHref?: string };
  coreFeatures?: { title?: string };
  tools?: { title?: string; subtitle?: string };
  testimonials?: { title?: string; subtitle?: string };
  brandStory?: { title?: string };
  conversionCta?: { title?: string; subtitle?: string };
}

// 推荐食谱相关接口
interface FeaturedRecipe {
  id: string;
  titleZh: string;
  coverImage: string | null;
  cuisine: string | null;
  location: string | null;
  viewCount: number;
}

interface FeaturedConfig {
  recipeIds?: string[];
  autoFill?: boolean;
}

type RecipeFilter = "hot" | "latest" | "custom";

export default function HomeConfigPage() {
  const [activeTab, setActiveTab] = useState<
    "hero" | "stats" | "browse" | "testimonials" | "themes" | "sections" | "featured"
  >("hero");
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Hero 配置
  const [heroConfig, setHeroConfig] = useState<HeroConfig>({
    title: "",
    displayTitle: "",
    seoTitle: "",
    subtitle: "",
    placeholder: "",
    chips: [],
    primaryCta: { label: "", href: "" },
    secondaryCta: { label: "", href: "" },
    imageUrl: "",
    imageFloatingText: "",
    statsLabels: {
      generated: "",
      recipes: "",
      collected: "",
      times: "",
    },
  });
  const [chipsInput, setChipsInput] = useState("");

  // 统计数据
  const [statsConfig, setStatsConfig] = useState<StatsConfig>({
    recipesGenerated: 12580,
    recipesCollected: 3200,
    totalDownloads: 8900,
  });

  // 主题卡片
  const [themes, setThemes] = useState<ThemeCard[]>([]);
  const [editingTheme, setEditingTheme] = useState<ThemeCard | null>(null);
  const [themeForm, setThemeForm] = useState({
    title: "",
    imageUrl: "",
    tag: "",
    href: "",
    sortOrder: "0",
    isActive: true,
  });
  const [showThemeModal, setShowThemeModal] = useState(false);

  // 快捷浏览
  const [browseItems, setBrowseItems] = useState<BrowseItem[]>([]);
  const [browseType, setBrowseType] = useState<BrowseItem["type"]>("REGION");
  const [editingBrowse, setEditingBrowse] = useState<BrowseItem | null>(null);
  const [browseForm, setBrowseForm] = useState({
    type: "REGION" as BrowseItem["type"],
    name: "",
    description: "",
    href: "",
    imageUrl: "",
    sortOrder: "0",
    isActive: true,
  });
  const [showBrowseModal, setShowBrowseModal] = useState(false);

  // 用户证言
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [editingTestimonial, setEditingTestimonial] =
    useState<TestimonialItem | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    name: "",
    role: "",
    city: "",
    content: "",
    meta: "",
    avatarUrl: "",
    sortOrder: "0",
    isActive: true,
  });
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);

  // 模块文案配置
  const [sectionTitles, setSectionTitles] = useState<SectionTitles>({});
  const [coreFeatures, setCoreFeatures] = useState<CoreFeatureItem[]>([]);
  const [toolsConfig, setToolsConfig] = useState<{ cookMode: ToolConfig; toolkit: ToolConfig }>({
    cookMode: { title: "", features: [], ctaLabel: "", ctaHref: "" },
    toolkit: { title: "", features: [], ctaLabel: "", ctaHref: "" },
  });
  const [brandStory, setBrandStory] = useState<BrandStoryConfig>({
    values: [],
    ctaLabel: "",
    ctaHref: "",
  });
  const [conversionCta, setConversionCta] = useState<ConversionCtaConfig>({
    title: "",
    subtitle: "",
    primaryCta: { label: "", href: "" },
    secondaryCta: { label: "", href: "" },
  });
  const [sectionsSubTab, setSectionsSubTab] = useState<
    "titles" | "features" | "tools" | "brand" | "cta"
  >("titles");

  // 推荐食谱配置
  const [featuredConfigs, setFeaturedConfigs] = useState<Record<string, FeaturedConfig>>();
  const [featuredRecipesMap, setFeaturedRecipesMap] = useState<Record<string, FeaturedRecipe>>({});
  const [availableRecipes, setAvailableRecipes] = useState<FeaturedRecipe[]>([]);
  const [recipeFilter, setRecipeFilter] = useState<RecipeFilter>("hot");
  const [recipeSearchQuery, setRecipeSearchQuery] = useState("");
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [featuredSubTab, setFeaturedSubTab] = useState<"hot" | "custom" | "gallery">("hot");
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    loadData();
  }, [locale]);

  async function loadData() {
    setLoading(true);
    try {
      const [homeRes, themesRes, browseRes, testimonialRes] = await Promise.all([
        fetch(`/api/config/home?locale=${locale}`, { cache: "no-store" }),
        fetch(`/api/config/themes?locale=${locale}`, { cache: "no-store" }),
        fetch(`/api/config/home/browse?locale=${locale}`, { cache: "no-store" }),
        fetch(`/api/config/home/testimonials?locale=${locale}`, { cache: "no-store" }),
      ]);

      if (!homeRes.ok || !themesRes.ok || !browseRes.ok || !testimonialRes.ok) {
        throw new Error("加载配置失败");
      }

      const [homeData, themesData, browseData, testimonialData] =
        await Promise.all([
          homeRes.json(),
          themesRes.json(),
          browseRes.json(),
          testimonialRes.json(),
        ]);

      if (homeData.success && homeData.data.hero) {
        setHeroConfig(homeData.data.hero);
        setChipsInput(homeData.data.hero.chips?.join(", ") || "");
      }

      if (homeData.success && homeData.data.stats) {
        setStatsConfig(homeData.data.stats);
      }

      // 加载模块文案配置
      if (homeData.success && homeData.data.sectionTitles) {
        setSectionTitles(homeData.data.sectionTitles);
      }
      if (homeData.success && homeData.data.coreFeatures) {
        setCoreFeatures(homeData.data.coreFeatures);
      }
      if (homeData.success && homeData.data.tools) {
        setToolsConfig(homeData.data.tools);
      }
      if (homeData.success && homeData.data.brandStory) {
        setBrandStory(homeData.data.brandStory);
      }
      if (homeData.success && homeData.data.conversionCta) {
        setConversionCta(homeData.data.conversionCta);
      }

      if (themesData.success) {
        setThemes(themesData.data);
      }

      if (browseData.success) {
        setBrowseItems(browseData.data);
      }

      if (testimonialData.success) {
        setTestimonials(testimonialData.data);
      }

      // 加载推荐食谱配置
      try {
        const featuredRes = await fetch("/api/admin/featured");
        const featuredData = await featuredRes.json();
        if (featuredData.success) {
          setFeaturedConfigs(featuredData.data);
          setFeaturedRecipesMap(featuredData.recipesMap || {});
        }
      } catch (e) {
        console.error("加载推荐食谱配置失败:", e);
      }

      const needsSeed =
        !seeded &&
        locale === DEFAULT_LOCALE &&
        themesData.success &&
        browseData.success &&
        testimonialData.success &&
        themesData.data.length === 0 &&
        browseData.data.length === 0 &&
        testimonialData.data.length === 0;

      if (needsSeed) {
        setSeeded(true);
        await fetch("/api/admin/config/home/seed", { method: "POST" });
        await loadData();
        return;
      }
    } catch (error) {
      console.error("加载配置失败:", error);
      alert("加载配置失败");
    } finally {
      setLoading(false);
    }
  }

  async function syncHomeData() {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/config/home/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error("同步失败");
      await loadData();
      alert("同步成功");
    } catch (error) {
      console.error("同步失败:", error);
      alert("同步失败");
    } finally {
      setSeeding(false);
    }
  }

  // 保存 Hero 配置
  async function saveHeroConfig() {
    setSaving(true);
    try {
      const chips = chipsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/config/home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "hero",
          value: { ...heroConfig, chips },
          locale,
        }),
      });

      if (!res.ok) throw new Error("保存失败");
      alert("保存成功");
      loadData();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function saveStatsConfig() {
    setSaving(true);
    try {
      const res = await fetch("/api/config/home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "stats",
          value: statsConfig,
        }),
      });

      if (!res.ok) throw new Error("保存失败");
      alert("保存成功");
      loadData();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  }

  // 保存模块标题配置
  async function saveSectionTitles() {
    setSaving(true);
    try {
      const res = await fetch("/api/config/home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "sectionTitles",
          value: sectionTitles,
          locale,
        }),
      });
      if (!res.ok) throw new Error("保存失败");
      alert("保存成功");
      loadData();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  }

  // 保存核心优势配置
  async function saveCoreFeatures() {
    setSaving(true);
    try {
      const res = await fetch("/api/config/home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "coreFeatures",
          value: coreFeatures,
          locale,
        }),
      });
      if (!res.ok) throw new Error("保存失败");
      alert("保存成功");
      loadData();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  }

  // 保存智能工具配置
  async function saveToolsConfig() {
    setSaving(true);
    try {
      const res = await fetch("/api/config/home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "tools",
          value: toolsConfig,
          locale,
        }),
      });
      if (!res.ok) throw new Error("保存失败");
      alert("保存成功");
      loadData();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  }

  // 保存品牌故事配置
  async function saveBrandStory() {
    setSaving(true);
    try {
      const res = await fetch("/api/config/home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "brandStory",
          value: brandStory,
          locale,
        }),
      });
      if (!res.ok) throw new Error("保存失败");
      alert("保存成功");
      loadData();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  }

  // 保存转化收口区配置
  async function saveConversionCta() {
    setSaving(true);
    try {
      const res = await fetch("/api/config/home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "conversionCta",
          value: conversionCta,
          locale,
        }),
      });
      if (!res.ok) throw new Error("保存失败");
      alert("保存成功");
      loadData();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  }

  // 推荐食谱相关函数
  const FEATURED_KEYS = {
    HOME_HOT: "featured_hot",
    HOME_CUSTOM: "featured_custom",
    HOME_GALLERY: "featured_gallery",
  };

  async function loadAvailableRecipes(filter: RecipeFilter, query?: string) {
    setLoadingRecipes(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (query) params.set("q", query);
      if (filter === "latest") params.set("sort", "latest");
      if (filter === "custom") params.set("custom", "true");

      const response = await fetch(`/api/admin/featured/search?${params}`);
      const data = await response.json();
      if (data.success) {
        setAvailableRecipes(data.data);
      }
    } catch (error) {
      console.error("加载食谱失败:", error);
    } finally {
      setLoadingRecipes(false);
    }
  }

  useEffect(() => {
    if (activeTab === "featured") {
      loadAvailableRecipes(recipeFilter, recipeSearchQuery);
    }
  }, [activeTab, recipeFilter, recipeSearchQuery]);

  async function saveFeaturedConfig(key: string, value: FeaturedConfig) {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await response.json();
      if (data.success) {
        await loadData();
        alert("保存成功");
      } else {
        alert(data.error || "保存失败");
      }
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  }

  function addFeaturedRecipe(key: string, recipe: FeaturedRecipe) {
    const config = featuredConfigs?.[key] || {};
    const ids = config.recipeIds || [];
    if (!ids.includes(recipe.id)) {
      setFeaturedConfigs({
        ...featuredConfigs,
        [key]: { ...config, recipeIds: [...ids, recipe.id] },
      });
      setFeaturedRecipesMap({ ...featuredRecipesMap, [recipe.id]: recipe });
    }
  }

  function removeFeaturedRecipe(key: string, recipeId: string) {
    const config = featuredConfigs?.[key] || {};
    const ids = config.recipeIds || [];
    setFeaturedConfigs({
      ...featuredConfigs,
      [key]: { ...config, recipeIds: ids.filter((id) => id !== recipeId) },
    });
  }

  function moveFeaturedRecipe(key: string, index: number, direction: "up" | "down") {
    const config = featuredConfigs?.[key] || {};
    const ids = [...(config.recipeIds || [])];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= ids.length) return;
    [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];
    setFeaturedConfigs({
      ...featuredConfigs,
      [key]: { ...config, recipeIds: ids },
    });
  }

  function isFeaturedRecipeAdded(recipeId: string, key: string) {
    const config = featuredConfigs?.[key] || {};
    const ids = config.recipeIds || [];
    return ids.includes(recipeId);
  }

  // 主题卡片操作
  function openThemeModal(theme?: ThemeCard) {
    if (theme) {
      setEditingTheme(theme);
      setThemeForm({
        title: theme.title,
        imageUrl: theme.imageUrl,
        tag: theme.tag,
        href: theme.href || "",
        sortOrder: String(theme.sortOrder),
        isActive: theme.isActive,
      });
    } else {
      setEditingTheme(null);
      setThemeForm({
        title: "",
        imageUrl: "",
        tag: "",
        href: "",
        sortOrder: "0",
        isActive: true,
      });
    }
    setShowThemeModal(true);
  }

  async function saveTheme() {
    if (!themeForm.title || !themeForm.imageUrl || !themeForm.tag) {
      alert("标题、图片和标签都是必填项");
      return;
    }

    setSaving(true);
    try {
      const endpoint = editingTheme
        ? `/api/config/themes/${editingTheme.id}`
        : "/api/config/themes";
      const method = editingTheme ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...themeForm,
          href: themeForm.href || null,
          sortOrder: Number(themeForm.sortOrder) || 0,
          locale,
        }),
      });

      if (!res.ok) throw new Error("保存失败");
      alert(editingTheme ? "更新成功" : "创建成功");
      setShowThemeModal(false);
      loadData();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTheme(id: string) {
    if (!confirm("确定要删除这个主题卡片吗？")) return;

    try {
      const res = await fetch(`/api/config/themes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("删除失败");
      alert("删除成功");
      loadData();
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败");
    }
  }

  async function toggleThemeActive(theme: ThemeCard) {
    try {
      const res = await fetch(`/api/config/themes/${theme.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !theme.isActive, locale: DEFAULT_LOCALE }),
      });

      if (!res.ok) throw new Error("更新失败");
      loadData();
    } catch (error) {
      console.error("更新失败:", error);
      alert("更新失败");
    }
  }

  async function translateHeroConfig() {
    if (locale === DEFAULT_LOCALE) {
      alert("默认语言无需翻译");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config/home/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "hero",
          sourceLocale: DEFAULT_LOCALE,
          targetLocale: locale,
        }),
      });
      if (!res.ok) throw new Error("翻译失败");
      alert("翻译完成");
      loadData();
    } catch (error) {
      console.error("翻译失败:", error);
      alert("翻译失败");
    } finally {
      setSaving(false);
    }
  }

  // 快捷浏览操作
  function openBrowseModal(item?: BrowseItem) {
    if (item) {
      setEditingBrowse(item);
      setBrowseForm({
        type: item.type,
        name: item.name,
        description: item.description || "",
        href: item.href,
        imageUrl: item.imageUrl || "",
        sortOrder: String(item.sortOrder),
        isActive: item.isActive,
      });
    } else {
      setEditingBrowse(null);
      setBrowseForm({
        type: browseType,
        name: "",
        description: "",
        href: "",
        imageUrl: "",
        sortOrder: "0",
        isActive: true,
      });
    }
    setShowBrowseModal(true);
  }

  async function saveBrowseItem() {
    if (!browseForm.name || !browseForm.href) {
      alert("名称和跳转链接为必填项");
      return;
    }
    setSaving(true);
    try {
      const endpoint = editingBrowse
        ? `/api/config/home/browse/${editingBrowse.id}`
        : "/api/config/home/browse";
      const method = editingBrowse ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: browseForm.type,
          name: browseForm.name,
          description: browseForm.description,
          href: browseForm.href,
          imageUrl: browseForm.imageUrl || null,
          sortOrder: Number(browseForm.sortOrder) || 0,
          isActive: browseForm.isActive,
          locale,
        }),
      });
      if (!res.ok) throw new Error("保存失败");
      alert(editingBrowse ? "更新成功" : "创建成功");
      setShowBrowseModal(false);
      loadData();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBrowseItem(id: string) {
    if (!confirm("确定要删除这个快捷入口吗？")) return;
    try {
      const res = await fetch(`/api/config/home/browse/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("删除失败");
      alert("删除成功");
      loadData();
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败");
    }
  }

  async function toggleBrowseActive(item: BrowseItem) {
    try {
      const res = await fetch(`/api/config/home/browse/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive, locale: DEFAULT_LOCALE }),
      });
      if (!res.ok) throw new Error("更新失败");
      loadData();
    } catch (error) {
      console.error("更新失败:", error);
      alert("更新失败");
    }
  }

  async function translateBrowseItem(item: BrowseItem) {
    if (locale === DEFAULT_LOCALE) {
      alert("默认语言无需翻译");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/config/home/browse/${item.id}/translate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceLocale: DEFAULT_LOCALE,
            targetLocale: locale,
          }),
        }
      );
      if (!res.ok) throw new Error("翻译失败");
      alert("翻译完成");
      loadData();
    } catch (error) {
      console.error("翻译失败:", error);
      alert("翻译失败");
    } finally {
      setSaving(false);
    }
  }

  // 用户证言操作
  function openTestimonialModal(item?: TestimonialItem) {
    if (item) {
      setEditingTestimonial(item);
      setTestimonialForm({
        name: item.name,
        role: item.role,
        city: item.city,
        content: item.content,
        meta: item.meta,
        avatarUrl: item.avatarUrl || "",
        sortOrder: String(item.sortOrder),
        isActive: item.isActive,
      });
    } else {
      setEditingTestimonial(null);
      setTestimonialForm({
        name: "",
        role: "",
        city: "",
        content: "",
        meta: "",
        avatarUrl: "",
        sortOrder: "0",
        isActive: true,
      });
    }
    setShowTestimonialModal(true);
  }

  async function saveTestimonial() {
    if (!testimonialForm.name || !testimonialForm.content) {
      alert("姓名和内容为必填项");
      return;
    }
    setSaving(true);
    try {
      const endpoint = editingTestimonial
        ? `/api/config/home/testimonials/${editingTestimonial.id}`
        : "/api/config/home/testimonials";
      const method = editingTestimonial ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...testimonialForm,
          avatarUrl: testimonialForm.avatarUrl || null,
          sortOrder: Number(testimonialForm.sortOrder) || 0,
          locale,
        }),
      });
      if (!res.ok) throw new Error("保存失败");
      alert(editingTestimonial ? "更新成功" : "创建成功");
      setShowTestimonialModal(false);
      loadData();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTestimonial(id: string) {
    if (!confirm("确定要删除这个证言吗？")) return;
    try {
      const res = await fetch(`/api/config/home/testimonials/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("删除失败");
      alert("删除成功");
      loadData();
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败");
    }
  }

  async function toggleTestimonialActive(item: TestimonialItem) {
    try {
      const res = await fetch(`/api/config/home/testimonials/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive, locale: DEFAULT_LOCALE }),
      });
      if (!res.ok) throw new Error("更新失败");
      loadData();
    } catch (error) {
      console.error("更新失败:", error);
      alert("更新失败");
    }
  }

  async function translateTestimonial(item: TestimonialItem) {
    if (locale === DEFAULT_LOCALE) {
      alert("默认语言无需翻译");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/config/home/testimonials/${item.id}/translate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceLocale: DEFAULT_LOCALE,
            targetLocale: locale,
          }),
        }
      );
      if (!res.ok) throw new Error("翻译失败");
      alert("翻译完成");
      loadData();
    } catch (error) {
      console.error("翻译失败:", error);
      alert("翻译失败");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brownWarm" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 头部 */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-serif font-medium text-textDark mb-2">
            首页配置
          </h1>
          <p className="text-textGray">配置首页文案、数据与快捷入口</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-textGray">当前语言：</span>
          {Object.entries(LOCALE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setLocale(key as Locale)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                locale === key
                  ? "bg-brownWarm text-white"
                  : "bg-cream text-textGray hover:text-textDark"
              }`}
            >
              {label}
            </button>
          ))}
          {locale !== DEFAULT_LOCALE && (
            <span className="text-xs text-textGray">
              当前为翻译内容编辑
            </span>
          )}
          <button
            onClick={syncHomeData}
            className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-cream text-textDark hover:text-brownWarm border border-lightGray transition-colors"
            disabled={seeding}
          >
            {seeding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            同步首页数据
          </button>
        </div>
      </div>

      {/* 标签页 */}
      <div className="flex flex-wrap gap-2 border-b border-lightGray">
        <button
          onClick={() => setActiveTab("hero")}
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === "hero"
              ? "text-brownWarm border-b-2 border-brownWarm"
              : "text-textGray hover:text-textDark"
          }`}
        >
          <Layout className="w-4 h-4" />
          Hero 配置
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === "stats"
              ? "text-brownWarm border-b-2 border-brownWarm"
              : "text-textGray hover:text-textDark"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          数据指标
        </button>
        <button
          onClick={() => setActiveTab("browse")}
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === "browse"
              ? "text-brownWarm border-b-2 border-brownWarm"
              : "text-textGray hover:text-textDark"
          }`}
        >
          <List className="w-4 h-4" />
          快捷入口 ({browseItems.length})
        </button>
        <button
          onClick={() => setActiveTab("testimonials")}
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === "testimonials"
              ? "text-brownWarm border-b-2 border-brownWarm"
              : "text-textGray hover:text-textDark"
          }`}
        >
          <Users className="w-4 h-4" />
          用户证言 ({testimonials.length})
        </button>
        <button
          onClick={() => setActiveTab("themes")}
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === "themes"
              ? "text-brownWarm border-b-2 border-brownWarm"
              : "text-textGray hover:text-textDark"
          }`}
        >
          <Grid className="w-4 h-4" />
          主题卡片 ({themes.length})
        </button>
        <button
          onClick={() => setActiveTab("sections")}
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === "sections"
              ? "text-brownWarm border-b-2 border-brownWarm"
              : "text-textGray hover:text-textDark"
          }`}
        >
          <FileText className="w-4 h-4" />
          模块文案
        </button>
        <button
          onClick={() => setActiveTab("featured")}
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === "featured"
              ? "text-brownWarm border-b-2 border-brownWarm"
              : "text-textGray hover:text-textDark"
          }`}
        >
          <Flame className="w-4 h-4" />
          推荐食谱
        </button>
      </div>

      {/* Hero 配置 */}
      {activeTab === "hero" && (
        <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              主标题
            </label>
            <input
              value={heroConfig.title}
              onChange={(e) =>
                setHeroConfig({ ...heroConfig, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
              placeholder="做饭，可以更简单"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                展示标题
              </label>
              <input
                value={heroConfig.displayTitle || ""}
                onChange={(e) =>
                  setHeroConfig({ ...heroConfig, displayTitle: e.target.value })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="用于页面展示（可不填）"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                SEO 标题
              </label>
              <input
                value={heroConfig.seoTitle || ""}
                onChange={(e) =>
                  setHeroConfig({ ...heroConfig, seoTitle: e.target.value })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="用于 SEO（可不填）"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              副标题
            </label>
            <input
              value={heroConfig.subtitle}
              onChange={(e) =>
                setHeroConfig({ ...heroConfig, subtitle: e.target.value })
              }
              className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
              placeholder="专业团队审核 · 语音+计时辅助 · 让每一步更安心"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              说明文字
            </label>
            <input
              value={heroConfig.placeholder}
              onChange={(e) =>
                setHeroConfig({ ...heroConfig, placeholder: e.target.value })
              }
              className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
              placeholder="从查找食谱到完成烹饪，我们把步骤与工具都准备好"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              主视觉图片 URL
            </label>
            <input
              value={heroConfig.imageUrl || ""}
              onChange={(e) =>
                setHeroConfig({ ...heroConfig, imageUrl: e.target.value })
              }
              className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
              placeholder="留空则使用推荐图片"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                主 CTA 文案
              </label>
              <input
                value={heroConfig.primaryCta?.label || ""}
                onChange={(e) =>
                  setHeroConfig({
                    ...heroConfig,
                    primaryCta: {
                      label: e.target.value,
                      href: heroConfig.primaryCta?.href || "",
                    },
                  })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="浏览全部食谱 →"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                主 CTA 跳转
              </label>
              <input
                value={heroConfig.primaryCta?.href || ""}
                onChange={(e) =>
                  setHeroConfig({
                    ...heroConfig,
                    primaryCta: {
                      label: heroConfig.primaryCta?.label || "",
                      href: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="/recipe"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                次 CTA 文案
              </label>
              <input
                value={heroConfig.secondaryCta?.label || ""}
                onChange={(e) =>
                  setHeroConfig({
                    ...heroConfig,
                    secondaryCta: {
                      label: e.target.value,
                      href: heroConfig.secondaryCta?.href || "",
                    },
                  })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="或试试 AI定制 →"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                次 CTA 跳转
              </label>
              <input
                value={heroConfig.secondaryCta?.href || ""}
                onChange={(e) =>
                  setHeroConfig({
                    ...heroConfig,
                    secondaryCta: {
                      label: heroConfig.secondaryCta?.label || "",
                      href: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="/ai-custom"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              图片浮层文案
            </label>
            <input
              value={heroConfig.imageFloatingText || ""}
              onChange={(e) =>
                setHeroConfig({ ...heroConfig, imageFloatingText: e.target.value })
              }
              className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
              placeholder="专业团队审核 · 步骤可复现"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                统计-已生成
              </label>
              <input
                value={heroConfig.statsLabels?.generated || ""}
                onChange={(e) =>
                  setHeroConfig({
                    ...heroConfig,
                    statsLabels: {
                      ...(heroConfig.statsLabels || {}),
                      generated: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="已生成"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                统计-菜谱
              </label>
              <input
                value={heroConfig.statsLabels?.recipes || ""}
                onChange={(e) =>
                  setHeroConfig({
                    ...heroConfig,
                    statsLabels: {
                      ...(heroConfig.statsLabels || {}),
                      recipes: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="菜谱"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                统计-已收藏
              </label>
              <input
                value={heroConfig.statsLabels?.collected || ""}
                onChange={(e) =>
                  setHeroConfig({
                    ...heroConfig,
                    statsLabels: {
                      ...(heroConfig.statsLabels || {}),
                      collected: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="已收藏"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                统计-次数
              </label>
              <input
                value={heroConfig.statsLabels?.times || ""}
                onChange={(e) =>
                  setHeroConfig({
                    ...heroConfig,
                    statsLabels: {
                      ...(heroConfig.statsLabels || {}),
                      times: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="次"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              价值标签（用逗号分隔）
            </label>
            <input
              value={chipsInput}
              onChange={(e) => setChipsInput(e.target.value)}
              className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
              placeholder="团队审核把关, 智能推荐菜谱, 免费好用"
            />
            <p className="text-sm text-textGray mt-1">
              最多显示 3 个标签，会作为首页价值点展示
            </p>
          </div>

          <div className="flex justify-end gap-3">
            {locale !== DEFAULT_LOCALE && (
              <button
                onClick={translateHeroConfig}
                disabled={saving}
                className="px-6 py-2 border border-brownWarm text-brownWarm rounded-lg hover:border-brownDark hover:text-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                AI 翻译
              </button>
            )}
            <button
              onClick={saveHeroConfig}
              disabled={saving}
              className="px-6 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              保存配置
            </button>
          </div>
        </div>
      )}

      {/* 数据配置 */}
      {activeTab === "stats" && (
        <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                已生成食谱
              </label>
              <input
                type="number"
                value={statsConfig.recipesGenerated}
                onChange={(e) =>
                  setStatsConfig({
                    ...statsConfig,
                    recipesGenerated: Number(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                收录菜品
              </label>
              <input
                type="number"
                value={statsConfig.recipesCollected}
                onChange={(e) =>
                  setStatsConfig({
                    ...statsConfig,
                    recipesCollected: Number(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                累计下载
              </label>
              <input
                type="number"
                value={statsConfig.totalDownloads}
                onChange={(e) =>
                  setStatsConfig({
                    ...statsConfig,
                    totalDownloads: Number(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveStatsConfig}
              disabled={saving}
              className="px-6 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              保存配置
            </button>
          </div>
        </div>
      )}

      {/* 快捷入口 */}
      {activeTab === "browse" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                { key: "REGION", label: "按地域" },
                { key: "CUISINE", label: "按菜系" },
                { key: "INGREDIENT", label: "按食材" },
                { key: "SCENE", label: "按场景" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setBrowseType(tab.key as BrowseItem["type"])}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    browseType === tab.key
                      ? "bg-brownWarm text-white"
                      : "bg-cream text-textGray hover:text-textDark"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => openBrowseModal()}
              className="px-4 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              添加入口
            </button>
          </div>

          {browseItems.filter((item) => item.type === browseType).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-lightGray">
              <p className="text-textGray">暂无入口</p>
              <button
                onClick={() => openBrowseModal()}
                className="mt-4 text-brownWarm hover:underline"
              >
                添加第一个入口
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {browseItems
                .filter((item) => item.type === browseType)
                .map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-lg border overflow-hidden ${
                      item.isActive
                        ? "border-lightGray"
                        : "border-red-200 opacity-60"
                    }`}
                  >
                    <div className="relative aspect-video bg-lightGray">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-textGray">
                          无图片
                        </div>
                      )}
                      {!item.isActive && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-medium">
                            已禁用
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-medium text-textDark">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-textGray line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <p className="text-xs text-textGray">
                        跳转: {item.href}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() => toggleBrowseActive(item)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.isActive ? "启用中" : "已禁用"}
                        </button>
                        <div className="flex gap-2">
                          {locale !== DEFAULT_LOCALE && (
                            <button
                              onClick={() => translateBrowseItem(item)}
                              className="p-2 text-textGray hover:text-brownWarm transition-colors"
                              title="AI 翻译"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openBrowseModal(item)}
                            className="p-2 text-textGray hover:text-brownWarm transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteBrowseItem(item.id)}
                            className="p-2 text-textGray hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 用户证言 */}
      {activeTab === "testimonials" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => openTestimonialModal()}
              className="px-4 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              添加证言
            </button>
          </div>

          {testimonials.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-lightGray">
              <p className="text-textGray">暂无证言</p>
              <button
                onClick={() => openTestimonialModal()}
                className="mt-4 text-brownWarm hover:underline"
              >
                添加第一条证言
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg border p-5 space-y-3 ${
                    item.isActive
                      ? "border-lightGray"
                      : "border-red-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-textGray">
                      {item.avatarUrl ? (
                        <Image
                          src={item.avatarUrl}
                          alt={item.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        item.name.slice(0, 1)
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-textDark">
                        {item.name}
                      </div>
                      <div className="text-xs text-textGray">
                        {item.role} · {item.city}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-textDark line-clamp-3">
                    {item.content}
                  </p>
                  {item.meta && (
                    <div className="text-xs text-textGray">{item.meta}</div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => toggleTestimonialActive(item)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.isActive ? "启用中" : "已禁用"}
                    </button>
                    <div className="flex gap-2">
                      {locale !== DEFAULT_LOCALE && (
                        <button
                          onClick={() => translateTestimonial(item)}
                          className="p-2 text-textGray hover:text-brownWarm transition-colors"
                          title="AI 翻译"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openTestimonialModal(item)}
                        className="p-2 text-textGray hover:text-brownWarm transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTestimonial(item.id)}
                        className="p-2 text-textGray hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 主题卡片 */}
      {activeTab === "themes" && (
        <div className="space-y-6">
          {/* 添加按钮 */}
          <div className="flex justify-end">
            <button
              onClick={() => openThemeModal()}
              className="px-4 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              添加主题卡片
            </button>
          </div>

          {/* 卡片列表 */}
          {themes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-lightGray">
              <p className="text-textGray">暂无主题卡片</p>
              <button
                onClick={() => openThemeModal()}
                className="mt-4 text-brownWarm hover:underline"
              >
                添加第一个主题卡片
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`bg-white rounded-lg border overflow-hidden ${
                    theme.isActive ? "border-lightGray" : "border-red-200 opacity-60"
                  }`}
                >
                  <div className="relative aspect-video bg-lightGray">
                    {theme.imageUrl ? (
                      <Image
                        src={theme.imageUrl}
                        alt={theme.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-textGray">
                        无图片
                      </div>
                    )}
                    {!theme.isActive && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-medium">已禁用</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-textDark mb-1">
                      {theme.title}
                    </h3>
                    <p className="text-sm text-textGray mb-1">
                      标签: {theme.tag} · 排序: {theme.sortOrder}
                    </p>
                    {theme.href && (
                      <p className="text-xs text-textGray mb-2">
                        跳转: {theme.href}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleThemeActive(theme)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          theme.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {theme.isActive ? "启用中" : "已禁用"}
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openThemeModal(theme)}
                          className="p-2 text-textGray hover:text-brownWarm transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTheme(theme.id)}
                          className="p-2 text-textGray hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 模块文案配置 */}
      {activeTab === "sections" && (
        <div className="space-y-6">
          {/* 子标签页 */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "titles", label: "模块标题" },
              { key: "features", label: "核心优势" },
              { key: "tools", label: "智能工具" },
              { key: "brand", label: "品牌故事" },
              { key: "cta", label: "转化收口" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSectionsSubTab(tab.key as typeof sectionsSubTab)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  sectionsSubTab === tab.key
                    ? "bg-brownWarm text-white"
                    : "bg-cream text-textGray hover:text-textDark"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 模块标题配置 */}
          {sectionsSubTab === "titles" && (
            <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
              <p className="text-sm text-textGray">配置首页各模块的标题和副标题</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-textDark">快速找菜</h4>
                  <input
                    value={sectionTitles.quickBrowse?.title || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      quickBrowse: { ...sectionTitles.quickBrowse, title: e.target.value, subtitle: sectionTitles.quickBrowse?.subtitle || "" }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="标题"
                  />
                  <input
                    value={sectionTitles.quickBrowse?.subtitle || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      quickBrowse: { ...sectionTitles.quickBrowse, title: sectionTitles.quickBrowse?.title || "", subtitle: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="副标题"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-textDark">本周精选</h4>
                  <input
                    value={sectionTitles.hotRecipes?.title || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      hotRecipes: { ...sectionTitles.hotRecipes, title: e.target.value, subtitle: sectionTitles.hotRecipes?.subtitle || "" }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="标题"
                  />
                  <input
                    value={sectionTitles.hotRecipes?.subtitle || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      hotRecipes: { ...sectionTitles.hotRecipes, title: sectionTitles.hotRecipes?.title || "", subtitle: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="副标题"
                  />
                  <input
                    value={sectionTitles.hotRecipes?.ctaLabel || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      hotRecipes: { ...sectionTitles.hotRecipes, ctaLabel: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="CTA 文案"
                  />
                  <input
                    value={sectionTitles.hotRecipes?.ctaHref || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      hotRecipes: { ...sectionTitles.hotRecipes, ctaHref: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="CTA 跳转链接"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-textDark">AI定制精选</h4>
                  <input
                    value={sectionTitles.customRecipes?.title || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      customRecipes: { ...sectionTitles.customRecipes, title: e.target.value, subtitle: sectionTitles.customRecipes?.subtitle || "" }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="标题"
                  />
                  <input
                    value={sectionTitles.customRecipes?.subtitle || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      customRecipes: { ...sectionTitles.customRecipes, title: sectionTitles.customRecipes?.title || "", subtitle: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="副标题"
                  />
                  <input
                    value={sectionTitles.customRecipes?.ctaLabel || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      customRecipes: { ...sectionTitles.customRecipes, ctaLabel: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="CTA 文案"
                  />
                  <input
                    value={sectionTitles.customRecipes?.ctaHref || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      customRecipes: { ...sectionTitles.customRecipes, ctaHref: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="CTA 跳转链接"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-textDark">主题卡片</h4>
                  <input
                    value={sectionTitles.themes?.title || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      themes: { ...sectionTitles.themes, title: e.target.value, subtitle: sectionTitles.themes?.subtitle || "" }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="标题"
                  />
                  <input
                    value={sectionTitles.themes?.subtitle || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      themes: { ...sectionTitles.themes, title: sectionTitles.themes?.title || "", subtitle: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="副标题"
                  />
                  <input
                    value={sectionTitles.themes?.ctaLabel || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      themes: { ...sectionTitles.themes, ctaLabel: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="CTA 文案"
                  />
                  <input
                    value={sectionTitles.themes?.ctaHref || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      themes: { ...sectionTitles.themes, ctaHref: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="CTA 跳转链接"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-textDark">核心优势</h4>
                  <input
                    value={sectionTitles.coreFeatures?.title || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      coreFeatures: { title: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="标题"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-textDark">智能工具</h4>
                  <input
                    value={sectionTitles.tools?.title || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      tools: { ...sectionTitles.tools, title: e.target.value, subtitle: sectionTitles.tools?.subtitle || "" }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="标题"
                  />
                  <input
                    value={sectionTitles.tools?.subtitle || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      tools: { ...sectionTitles.tools, title: sectionTitles.tools?.title || "", subtitle: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="副标题"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-textDark">用户证言</h4>
                  <input
                    value={sectionTitles.testimonials?.title || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      testimonials: { ...sectionTitles.testimonials, title: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="标题"
                  />
                  <input
                    value={sectionTitles.testimonials?.subtitle || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      testimonials: { ...sectionTitles.testimonials, subtitle: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="副标题"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-textDark">品牌故事</h4>
                  <input
                    value={sectionTitles.brandStory?.title || ""}
                    onChange={(e) => setSectionTitles({
                      ...sectionTitles,
                      brandStory: { title: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="标题"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveSectionTitles}
                  disabled={saving}
                  className="px-6 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  保存配置
                </button>
              </div>
            </div>
          )}

          {/* 核心优势配置 */}
          {sectionsSubTab === "features" && (
            <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
              <p className="text-sm text-textGray">配置「为什么选择 Recipe Zen」模块的四大优势</p>

              <div className="space-y-6">
                {(coreFeatures.length > 0 ? coreFeatures : [
                  { icon: "check", title: "", description: "" },
                  { icon: "target", title: "", description: "" },
                  { icon: "clock", title: "", description: "" },
                  { icon: "users", title: "", description: "" },
                ]).map((feature, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-cream/50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-textDark mb-2">图标</label>
                      <select
                        value={feature.icon}
                        onChange={(e) => {
                          const newFeatures = [...coreFeatures];
                          if (newFeatures.length === 0) {
                            newFeatures.push(
                              { icon: "check", title: "", description: "" },
                              { icon: "target", title: "", description: "" },
                              { icon: "clock", title: "", description: "" },
                              { icon: "users", title: "", description: "" }
                            );
                          }
                          newFeatures[index] = { ...newFeatures[index], icon: e.target.value };
                          setCoreFeatures(newFeatures);
                        }}
                        className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                      >
                        <option value="check">✓ check</option>
                        <option value="target">⊙ target</option>
                        <option value="clock">⏱ clock</option>
                        <option value="users">👥 users</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-textDark mb-2">标题</label>
                      <input
                        value={feature.title}
                        onChange={(e) => {
                          const newFeatures = [...coreFeatures];
                          if (newFeatures.length === 0) {
                            newFeatures.push(
                              { icon: "check", title: "", description: "" },
                              { icon: "target", title: "", description: "" },
                              { icon: "clock", title: "", description: "" },
                              { icon: "users", title: "", description: "" }
                            );
                          }
                          newFeatures[index] = { ...newFeatures[index], title: e.target.value };
                          setCoreFeatures(newFeatures);
                        }}
                        className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                        placeholder="如：专业审核"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-textDark mb-2">描述</label>
                      <input
                        value={feature.description}
                        onChange={(e) => {
                          const newFeatures = [...coreFeatures];
                          if (newFeatures.length === 0) {
                            newFeatures.push(
                              { icon: "check", title: "", description: "" },
                              { icon: "target", title: "", description: "" },
                              { icon: "clock", title: "", description: "" },
                              { icon: "users", title: "", description: "" }
                            );
                          }
                          newFeatures[index] = { ...newFeatures[index], description: e.target.value };
                          setCoreFeatures(newFeatures);
                        }}
                        className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                        placeholder="如：每道菜谱都经过人工审核，保证质量。"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveCoreFeatures}
                  disabled={saving}
                  className="px-6 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  保存配置
                </button>
              </div>
            </div>
          )}

          {/* 智能工具配置 */}
          {sectionsSubTab === "tools" && (
            <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
              <p className="text-sm text-textGray">配置「让做饭更轻松的智能工具」模块内容</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 烹饪模式 */}
                <div className="p-4 bg-cream/50 rounded-lg space-y-4">
                  <h4 className="font-medium text-textDark">烹饪模式</h4>
                  <div>
                    <label className="block text-sm text-textGray mb-1">标题</label>
                    <input
                      value={toolsConfig.cookMode?.title || ""}
                      onChange={(e) => setToolsConfig({
                        ...toolsConfig,
                        cookMode: { ...toolsConfig.cookMode, title: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                      placeholder="烹饪模式"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-textGray mb-1">功能列表（每行一个）</label>
                    <textarea
                      value={toolsConfig.cookMode?.features?.join("\n") || ""}
                      onChange={(e) => setToolsConfig({
                        ...toolsConfig,
                        cookMode: { ...toolsConfig.cookMode, features: e.target.value.split("\n").filter(Boolean) }
                      })}
                      className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50 min-h-[120px]"
                      placeholder="大字体步骤显示&#10;单步骤智能计时&#10;语音朗读步骤"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-textGray mb-1">按钮文案</label>
                      <input
                        value={toolsConfig.cookMode?.ctaLabel || ""}
                        onChange={(e) => setToolsConfig({
                          ...toolsConfig,
                          cookMode: { ...toolsConfig.cookMode, ctaLabel: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                        placeholder="立即体验 →"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-textGray mb-1">按钮链接</label>
                      <input
                        value={toolsConfig.cookMode?.ctaHref || ""}
                        onChange={(e) => setToolsConfig({
                          ...toolsConfig,
                          cookMode: { ...toolsConfig.cookMode, ctaHref: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                        placeholder="/recipe"
                      />
                    </div>
                  </div>
                </div>

                {/* 实用工具集 */}
                <div className="p-4 bg-cream/50 rounded-lg space-y-4">
                  <h4 className="font-medium text-textDark">实用工具集</h4>
                  <div>
                    <label className="block text-sm text-textGray mb-1">标题</label>
                    <input
                      value={toolsConfig.toolkit?.title || ""}
                      onChange={(e) => setToolsConfig({
                        ...toolsConfig,
                        toolkit: { ...toolsConfig.toolkit, title: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                      placeholder="实用工具集"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-textGray mb-1">功能列表（每行一个）</label>
                    <textarea
                      value={toolsConfig.toolkit?.features?.join("\n") || ""}
                      onChange={(e) => setToolsConfig({
                        ...toolsConfig,
                        toolkit: { ...toolsConfig.toolkit, features: e.target.value.split("\n").filter(Boolean) }
                      })}
                      className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50 min-h-[120px]"
                      placeholder="图文打印&#10;语音朗读&#10;智能计时"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-textGray mb-1">按钮文案</label>
                      <input
                        value={toolsConfig.toolkit?.ctaLabel || ""}
                        onChange={(e) => setToolsConfig({
                          ...toolsConfig,
                          toolkit: { ...toolsConfig.toolkit, ctaLabel: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                        placeholder="查看所有功能 →"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-textGray mb-1">按钮链接</label>
                      <input
                        value={toolsConfig.toolkit?.ctaHref || ""}
                        onChange={(e) => setToolsConfig({
                          ...toolsConfig,
                          toolkit: { ...toolsConfig.toolkit, ctaHref: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                        placeholder="/recipe"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveToolsConfig}
                  disabled={saving}
                  className="px-6 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  保存配置
                </button>
              </div>
            </div>
          )}

          {/* 品牌故事配置 */}
          {sectionsSubTab === "brand" && (
            <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
              <p className="text-sm text-textGray">配置「我们的初心」模块内容</p>

              <div className="space-y-4">
                <h4 className="font-medium text-textDark">价值观列表</h4>
                {(brandStory.values?.length > 0 ? brandStory.values : [
                  { title: "", description: "" },
                  { title: "", description: "" },
                  { title: "", description: "" },
                ]).map((value, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-cream/50 rounded-lg">
                    <div>
                      <label className="block text-sm text-textGray mb-1">标题</label>
                      <input
                        value={value.title}
                        onChange={(e) => {
                          const newValues = [...(brandStory.values || [])];
                          if (newValues.length === 0) {
                            newValues.push(
                              { title: "", description: "" },
                              { title: "", description: "" },
                              { title: "", description: "" }
                            );
                          }
                          newValues[index] = { ...newValues[index], title: e.target.value };
                          setBrandStory({ ...brandStory, values: newValues });
                        }}
                        className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                        placeholder="如：免费"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-textGray mb-1">描述</label>
                      <input
                        value={value.description}
                        onChange={(e) => {
                          const newValues = [...(brandStory.values || [])];
                          if (newValues.length === 0) {
                            newValues.push(
                              { title: "", description: "" },
                              { title: "", description: "" },
                              { title: "", description: "" }
                            );
                          }
                          newValues[index] = { ...newValues[index], description: e.target.value };
                          setBrandStory({ ...brandStory, values: newValues });
                        }}
                        className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                        placeholder="如：让每个人都能轻松学做菜，不因价格而犹豫。"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">按钮文案</label>
                  <input
                    value={brandStory.ctaLabel || ""}
                    onChange={(e) => setBrandStory({ ...brandStory, ctaLabel: e.target.value })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="了解我们的故事 →"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">按钮链接</label>
                  <input
                    value={brandStory.ctaHref || ""}
                    onChange={(e) => setBrandStory({ ...brandStory, ctaHref: e.target.value })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="/about"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveBrandStory}
                  disabled={saving}
                  className="px-6 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  保存配置
                </button>
              </div>
            </div>
          )}

          {/* 转化收口区配置 */}
          {sectionsSubTab === "cta" && (
            <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
              <p className="text-sm text-textGray">配置页面底部「开始你的简单厨房之旅」模块</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">主标题</label>
                  <input
                    value={conversionCta.title || ""}
                    onChange={(e) => setConversionCta({ ...conversionCta, title: e.target.value })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="开始你的简单厨房之旅"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">副标题</label>
                  <input
                    value={conversionCta.subtitle || ""}
                    onChange={(e) => setConversionCta({ ...conversionCta, subtitle: e.target.value })}
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="无需注册，无需付费，立即浏览 1000+ 精选家常菜。"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-cream/50 rounded-lg space-y-4">
                  <h4 className="font-medium text-textDark">主按钮</h4>
                  <div>
                    <label className="block text-sm text-textGray mb-1">文案</label>
                    <input
                      value={conversionCta.primaryCta?.label || ""}
                      onChange={(e) => setConversionCta({
                        ...conversionCta,
                        primaryCta: { ...conversionCta.primaryCta, label: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                      placeholder="开始探索食谱 →"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-textGray mb-1">链接</label>
                    <input
                      value={conversionCta.primaryCta?.href || ""}
                      onChange={(e) => setConversionCta({
                        ...conversionCta,
                        primaryCta: { ...conversionCta.primaryCta, href: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                      placeholder="/recipe"
                    />
                  </div>
                </div>

                <div className="p-4 bg-cream/50 rounded-lg space-y-4">
                  <h4 className="font-medium text-textDark">次按钮</h4>
                  <div>
                    <label className="block text-sm text-textGray mb-1">文案</label>
                    <input
                      value={conversionCta.secondaryCta?.label || ""}
                      onChange={(e) => setConversionCta({
                        ...conversionCta,
                        secondaryCta: { ...conversionCta.secondaryCta, label: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                      placeholder="或尝试AI定制 →"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-textGray mb-1">链接</label>
                    <input
                      value={conversionCta.secondaryCta?.href || ""}
                      onChange={(e) => setConversionCta({
                        ...conversionCta,
                        secondaryCta: { ...conversionCta.secondaryCta, href: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                      placeholder="/ai-custom"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveConversionCta}
                  disabled={saving}
                  className="px-6 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  保存配置
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 快捷入口编辑弹窗 */}
      {showBrowseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-medium text-textDark">
                  {editingBrowse ? "编辑快捷入口" : "添加快捷入口"}
                </h2>
                <p className="text-xs text-textGray mt-1">
                  当前语言：{LOCALE_LABELS[locale]}
                </p>
              </div>
              <button
                onClick={() => setShowBrowseModal(false)}
                className="p-2 text-textGray hover:text-textDark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  分类类型 *
                </label>
                <select
                  value={browseForm.type}
                  onChange={(e) =>
                    setBrowseForm({
                      ...browseForm,
                      type: e.target.value as BrowseItem["type"],
                    })
                  }
                  className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                >
                  <option value="REGION">按地域</option>
                  <option value="CUISINE">按菜系</option>
                  <option value="INGREDIENT">按食材</option>
                  <option value="SCENE">按场景</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  展示名称 *
                </label>
                <input
                  value={browseForm.name}
                  onChange={(e) =>
                    setBrowseForm({ ...browseForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  placeholder="如：川菜"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  描述文案
                </label>
                <input
                  value={browseForm.description}
                  onChange={(e) =>
                    setBrowseForm({
                      ...browseForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  placeholder="如：麻辣鲜香，经典川味"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  跳转链接 *
                </label>
                <input
                  value={browseForm.href}
                  onChange={(e) =>
                    setBrowseForm({ ...browseForm, href: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  placeholder="/recipe?cuisine=川菜"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  封面图 URL
                </label>
                <input
                  value={browseForm.imageUrl}
                  onChange={(e) =>
                    setBrowseForm({ ...browseForm, imageUrl: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  placeholder="https://..."
                />
                {browseForm.imageUrl && (
                  <div className="mt-2 relative aspect-video bg-lightGray rounded-lg overflow-hidden">
                    <Image
                      src={browseForm.imageUrl}
                      alt="预览"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    排序
                  </label>
                  <input
                    type="number"
                    value={browseForm.sortOrder}
                    onChange={(e) =>
                      setBrowseForm({
                        ...browseForm,
                        sortOrder: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  />
                </div>
                <div className="flex items-center gap-3 mt-7">
                  <input
                    type="checkbox"
                    id="browse-active"
                    checked={browseForm.isActive}
                    onChange={(e) =>
                      setBrowseForm({
                        ...browseForm,
                        isActive: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="browse-active" className="text-sm text-textDark">
                    启用
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBrowseModal(false)}
                className="px-4 py-2 text-textGray hover:text-textDark transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveBrowseItem}
                disabled={saving}
                className="px-6 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingBrowse ? "保存更新" : "创建"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 用户证言编辑弹窗 */}
      {showTestimonialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-medium text-textDark">
                  {editingTestimonial ? "编辑用户证言" : "添加用户证言"}
                </h2>
                <p className="text-xs text-textGray mt-1">
                  当前语言：{LOCALE_LABELS[locale]}
                </p>
              </div>
              <button
                onClick={() => setShowTestimonialModal(false)}
                className="p-2 text-textGray hover:text-textDark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    姓名 *
                  </label>
                  <input
                    value={testimonialForm.name}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    角色/身份
                  </label>
                  <input
                    value={testimonialForm.role}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        role: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    城市
                  </label>
                  <input
                    value={testimonialForm.city}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        city: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    头像 URL
                  </label>
                  <input
                    value={testimonialForm.avatarUrl}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        avatarUrl: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  证言内容 *
                </label>
                <textarea
                  value={testimonialForm.content}
                  onChange={(e) =>
                    setTestimonialForm({
                      ...testimonialForm,
                      content: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50 min-h-[120px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  辅助信息
                </label>
                <input
                  value={testimonialForm.meta}
                  onChange={(e) =>
                    setTestimonialForm({
                      ...testimonialForm,
                      meta: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  placeholder="⭐⭐⭐⭐⭐ | 使用 3 个月 | 已做成 28 道菜"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    排序
                  </label>
                  <input
                    type="number"
                    value={testimonialForm.sortOrder}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        sortOrder: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  />
                </div>
                <div className="flex items-center gap-3 mt-7">
                  <input
                    type="checkbox"
                    id="testimonial-active"
                    checked={testimonialForm.isActive}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        isActive: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <label
                    htmlFor="testimonial-active"
                    className="text-sm text-textDark"
                  >
                    启用
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowTestimonialModal(false)}
                className="px-4 py-2 text-textGray hover:text-textDark transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveTestimonial}
                disabled={saving}
                className="px-6 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingTestimonial ? "保存更新" : "创建"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主题卡片编辑弹窗 */}
      {showThemeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-textDark">
                {editingTheme ? "编辑主题卡片" : "添加主题卡片"}
              </h2>
              <button
                onClick={() => setShowThemeModal(false)}
                className="p-2 text-textGray hover:text-textDark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  主题名称 *
                </label>
                <input
                  value={themeForm.title}
                  onChange={(e) =>
                    setThemeForm({ ...themeForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  placeholder="如：减肥食谱"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  封面图 URL *
                </label>
                <input
                  value={themeForm.imageUrl}
                  onChange={(e) =>
                    setThemeForm({ ...themeForm, imageUrl: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  placeholder="https://..."
                />
                {themeForm.imageUrl && (
                  <div className="mt-2 relative aspect-video bg-lightGray rounded-lg overflow-hidden">
                    <Image
                      src={themeForm.imageUrl}
                      alt="预览"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  关联标签 *
                </label>
                <input
                  value={themeForm.tag}
                  onChange={(e) =>
                    setThemeForm({ ...themeForm, tag: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  placeholder="如：减脂"
                />
                <p className="text-sm text-textGray mt-1">
                  点击卡片后会跳转到 /recipe?tag=标签
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-textDark mb-2">
                  跳转链接
                </label>
                <input
                  value={themeForm.href}
                  onChange={(e) =>
                    setThemeForm({ ...themeForm, href: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  placeholder="留空则使用标签跳转"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    排序
                  </label>
                  <input
                    type="number"
                    value={themeForm.sortOrder}
                    onChange={(e) =>
                      setThemeForm({ ...themeForm, sortOrder: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  />
                </div>
                <div className="flex items-center gap-3 mt-7">
                  <input
                    type="checkbox"
                    id="theme-active"
                    checked={themeForm.isActive}
                    onChange={(e) =>
                      setThemeForm({ ...themeForm, isActive: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="theme-active" className="text-sm text-textDark">
                    启用
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowThemeModal(false)}
                className="px-4 py-2 text-textGray hover:text-textDark transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveTheme}
                disabled={saving}
                className="px-6 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingTheme ? "保存更新" : "创建"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 推荐食谱配置 */}
      {activeTab === "featured" && (
        <div className="space-y-6">
          {/* 子标签页 */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "hot" as const, label: "热门精选", icon: <Flame className="w-4 h-4" /> },
              { key: "custom" as const, label: "定制精选", icon: <Sparkles className="w-4 h-4" /> },
              { key: "gallery" as const, label: "图库精选", icon: <Images className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFeaturedSubTab(tab.key)}
                className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-2 ${
                  featuredSubTab === tab.key
                    ? "bg-brownWarm text-white"
                    : "bg-cream text-textGray hover:text-textDark"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* 食谱选择器 */}
          {(() => {
            const keyMap = {
              hot: FEATURED_KEYS.HOME_HOT,
              custom: FEATURED_KEYS.HOME_CUSTOM,
              gallery: FEATURED_KEYS.HOME_GALLERY,
            };
            const titleMap = {
              hot: "首页「本周精选家常菜」区块",
              custom: "首页「AI定制精选」区块",
              gallery: "首页「美食图库」区块",
            };
            const descMap = {
              hot: "手动选择展示的食谱，不足时自动用热门补充",
              custom: "展示用户定制的精选食谱",
              gallery: "展示精美的食谱封面图",
            };
            const currentKey = keyMap[featuredSubTab];
            const config = featuredConfigs?.[currentKey] || {};
            const ids = config.recipeIds || [];

            return (
              <div className="bg-white rounded-lg border border-lightGray p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-textDark">{titleMap[featuredSubTab]}</h3>
                    <p className="text-sm text-textGray">{descMap[featuredSubTab]}</p>
                  </div>
                  <span className="text-sm text-textGray">已选 {ids.length} 个</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 左侧：已选食谱 */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-textDark">已选食谱（用上下按钮排序）</div>
                    {ids.length === 0 ? (
                      <div className="text-sm text-textGray py-8 text-center border-2 border-dashed border-lightGray rounded-lg">
                        从右侧点击卡片或「添加」按钮加入
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {ids.map((id, index) => {
                          const recipe = featuredRecipesMap[id];
                          if (!recipe) return null;
                          return (
                            <div
                              key={id}
                              className="flex items-center gap-3 p-3 bg-cream/50 rounded-lg group"
                            >
                              <GripVertical className="w-4 h-4 text-gray-400 cursor-move flex-shrink-0" />
                              <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                                {recipe.coverImage && (
                                  <Image
                                    src={recipe.coverImage}
                                    alt={recipe.titleZh}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-textDark truncate">
                                  {recipe.titleZh}
                                </div>
                                <div className="text-xs text-textGray">
                                  {recipe.cuisine || recipe.location || "未分类"}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => moveFeaturedRecipe(currentKey, index, "up")}
                                  disabled={index === 0}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                  title="上移"
                                >
                                  <ArrowUpDown className="w-4 h-4 rotate-180" />
                                </button>
                                <button
                                  onClick={() => moveFeaturedRecipe(currentKey, index, "down")}
                                  disabled={index === ids.length - 1}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                  title="下移"
                                >
                                  <ArrowUpDown className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => removeFeaturedRecipe(currentKey, id)}
                                  className="p-1 text-gray-400 hover:text-red-500"
                                  title="移除"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 右侧：可选食谱 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-textDark">候选食谱库</div>
                      <div className="flex gap-1">
                        {[
                          { key: "hot" as const, label: "热门" },
                          { key: "latest" as const, label: "最新" },
                          { key: "custom" as const, label: "AI定制" },
                        ].map((filter) => (
                          <button
                            key={filter.key}
                            onClick={() => setRecipeFilter(filter.key)}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                              recipeFilter === filter.key
                                ? "bg-brownWarm text-white"
                                : "bg-cream text-textGray hover:bg-brownWarm/10"
                            }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 搜索框 */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="搜索食谱..."
                        value={recipeSearchQuery}
                        onChange={(e) => setRecipeSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-lightGray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                      />
                      {recipeSearchQuery && (
                        <button
                          onClick={() => setRecipeSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>

                    {/* 食谱网格 */}
                    {loadingRecipes ? (
                      <div className="py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-brownWarm" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto">
                        {availableRecipes.map((recipe) => {
                          const added = isFeaturedRecipeAdded(recipe.id, currentKey);
                          return (
                            <button
                              key={recipe.id}
                              onClick={() => {
                                if (!added) {
                                  addFeaturedRecipe(currentKey, recipe);
                                }
                              }}
                              disabled={added}
                              className={`group relative p-2 rounded-lg text-left transition-all ${
                                added
                                  ? "bg-green-50 border-2 border-green-200 opacity-60"
                                  : "bg-cream/50 hover:bg-brownWarm/10 border-2 border-transparent"
                              }`}
                            >
                              <div className="aspect-[4/3] rounded bg-gray-200 overflow-hidden mb-2">
                                {recipe.coverImage && (
                                  <Image
                                    src={recipe.coverImage}
                                    alt={recipe.titleZh}
                                    width={160}
                                    height={120}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                  />
                                )}
                              </div>
                              <div className="text-xs font-medium text-textDark line-clamp-2">
                                {recipe.titleZh}
                              </div>
                              <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-textGray">{recipe.viewCount} 浏览</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full ${
                                    added
                                      ? "bg-green-100 text-green-700"
                                      : "bg-brownWarm text-white"
                                  }`}
                                >
                                  {added ? "已添加" : "添加"}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 热门精选特有的自动补充选项 */}
                {featuredSubTab === "hot" && (
                  <div className="flex items-center gap-4 pt-4 border-t border-lightGray">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={config.autoFill ?? true}
                        onChange={(e) =>
                          setFeaturedConfigs({
                            ...featuredConfigs,
                            [currentKey]: {
                              ...config,
                              autoFill: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-textGray">不足时自动用热门食谱补充</span>
                    </label>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => saveFeaturedConfig(currentKey, config)}
                    disabled={saving}
                    className="px-4 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    保存
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
