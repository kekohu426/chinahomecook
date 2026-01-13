export type RecipeScene = {
  id: string;
  slug: string;
  tag: string;
  nameZh: string;
  nameEn: string;
  descriptionZh: string;
  descriptionEn: string;
};

export const RECIPE_SCENES: RecipeScene[] = [
  {
    id: "scene-quick",
    slug: "quick",
    tag: "快手菜",
    nameZh: "快手菜",
    nameEn: "Quick Meals",
    descriptionZh: "10-20分钟轻松上桌",
    descriptionEn: "Ready in 10–20 minutes",
  },
  {
    id: "scene-rice",
    slug: "rice",
    tag: "下饭菜",
    nameZh: "下饭菜",
    nameEn: "Rice-Friendly",
    descriptionZh: "一口就能多吃两碗饭",
    descriptionEn: "So good you'll want a second bowl",
  },
  {
    id: "scene-lean",
    slug: "low-fat",
    tag: "减脂餐",
    nameZh: "减脂餐",
    nameEn: "Light & Lean",
    descriptionZh: "低油低脂，轻盈饱腹",
    descriptionEn: "Low oil, low fat, satisfying",
  },
  {
    id: "scene-breakfast",
    slug: "breakfast",
    tag: "早餐",
    nameZh: "早餐",
    nameEn: "Breakfast",
    descriptionZh: "简单营养，开启好心情",
    descriptionEn: "Simple, nourishing, uplifting",
  },
  {
    id: "scene-soup",
    slug: "soup",
    tag: "汤羹",
    nameZh: "汤羹",
    nameEn: "Soups",
    descriptionZh: "暖胃又治愈的家常汤",
    descriptionEn: "Warm, comforting, and soothing",
  },
  {
    id: "scene-veg",
    slug: "vegetarian",
    tag: "素食",
    nameZh: "素食",
    nameEn: "Vegetarian",
    descriptionZh: "清爽不腻，蔬食新选择",
    descriptionEn: "Fresh, light, and veggie-forward",
  },
  {
    id: "scene-family",
    slug: "family",
    tag: "家宴",
    nameZh: "家宴",
    nameEn: "Family Feast",
    descriptionZh: "上桌体面，聚会不出错",
    descriptionEn: "Great for gatherings and sharing",
  },
  {
    id: "scene-night",
    slug: "late-night",
    tag: "宵夜",
    nameZh: "宵夜",
    nameEn: "Late-Night",
    descriptionZh: "深夜也想来点热乎的",
    descriptionEn: "A warm bite after dark",
  },
];

export const SCENE_TAGS = RECIPE_SCENES.map((scene) => scene.tag);

export function getScenesByLocale(locale: "en" | "zh") {
  return RECIPE_SCENES.map((scene) => ({
    id: scene.id,
    slug: scene.slug,
    tag: scene.tag,
    name: locale === "en" ? scene.nameEn : scene.nameZh,
    description: locale === "en" ? scene.descriptionEn : scene.descriptionZh,
  }));
}

export function getSceneBySlug(slug: string) {
  return RECIPE_SCENES.find((scene) => scene.slug === slug) || null;
}
