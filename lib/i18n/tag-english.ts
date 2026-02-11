import { containsCjk, ensureEnglish, titleFromSlug } from "./english";

export type TagType = "scene" | "method" | "taste" | "crowd" | "occasion";

const TAG_LABELS: Record<TagType, string> = {
  scene: "Scene",
  method: "Method",
  taste: "Taste",
  crowd: "Crowd",
  occasion: "Occasion",
};

const PREFIXES_BY_TYPE: Record<TagType, string[]> = {
  scene: ["Scene"],
  method: ["Method", "Cooking Method"],
  taste: ["Taste", "Flavor"],
  crowd: ["Crowd", "For"],
  occasion: ["Occasion"],
};

const METHOD_TAGS_EN: Record<string, string> = {
  炒: "Stir-Fry",
  快炒: "Quick-Fry",
  爆炒: "Quick-Fry",
  炒糖色: "Caramelize",
  炸香: "Fry Until Fragrant",
  焯: "Blanch",
  焯炒: "Blanch & Stir-Fry",
  蒸: "Steam",
  煮: "Boil",
  炖: "Stew",
  煲: "Soup Pot",
  焖: "Braise",
  焖烧: "Stew",
  烧: "Braise",
  烤: "Bake/Roast",
  煎: "Pan-Fry",
  炸: "Deep-Fry",
  拌: "Toss/Mix",
  凉拌: "Cold Dish",
  卤: "Braise in Soy Sauce",
  挂汁: "Glaze",
  收汁: "Reduce",
  乳化: "Emulsify",
  风干: "Air-Dry",
  烫皮: "Blanch Skin",
  鼓风分皮: "Air-Dry Skin",
  烙: "Griddle",
  熬: "Simmer",
  扒: "Sauté",
  爆: "Quick-Blast",
  醉: "Wine-Soaked",
  烟熏: "Smoke",
  熏: "Smoke",
  腌: "Pickle/Marinate",
  腌制: "Pickle/Marinate",
  泡: "Pickle/Marinate",
};

const TASTE_TAGS_EN: Record<string, string> = {
  微辣: "Mild Spicy",
  清润: "Light",
  辣: "Spicy",
  麻: "Numbing",
  甜辣: "Sweet & Spicy",
  浓郁: "Rich",
  清甜: "Light Sweet",
  酥香: "Crispy & Fragrant",
  果木香: "Fruitwood Aroma",
  咸甜适口: "Sweet & Salty",
  鲜辣: "Hot & Spicy",
  酸甜: "Sweet & Sour",
  糖醋: "Sweet & Sour",
  甜: "Sweet",
  甜味: "Sweet",
  咸香: "Savory",
  鲜香: "Umami",
  咸鲜: "Salty & Fresh",
  清淡: "Light",
  麻辣: "Numbing & Spicy",
  香辣: "Hot & Spicy",
  酸辣: "Sour & Spicy",
  咸: "Salty",
  鲜: "Umami",
  酱香: "Sauce Flavor",
  蒜香: "Garlic Flavor",
  椒盐: "Salt & Pepper",
  孜然: "Cumin",
  五香: "Five-Spice",
  葱香: "Scallion Flavor",
  姜味: "Ginger Flavor",
  酒香: "Wine Aroma",
  茶香: "Tea Flavor",
  烟熏: "Smoky",
  清爽: "Refreshing",
};

const CROWD_TAGS_EN: Record<string, string> = {
  家庭: "Family",
  所有人: "Everyone",
  孕妇: "Pregnant Women",
  产妇: "Postpartum Women",
  儿童: "Children",
  老人: "Seniors",
  糖尿病: "Diabetes",
  高血压: "Hypertension",
  贫血: "Anemia",
  痛风: "Gout",
  肠胃不好: "Digestive Issues",
  便秘: "Constipation",
  减肥人群: "Weight Loss",
  健身人群: "Fitness",
  上班族: "Office Workers",
  学生: "Students",
  素食者: "Vegetarians",
  过敏体质: "Allergies",
  肾病: "Kidney Disease",
  脂肪肝: "Fatty Liver",
  感冒咳嗽: "Cold & Cough",
  熬夜人群: "Night Owls",
};

const OCCASION_TAGS_EN: Record<string, string> = {
  正餐: "Main Meal",
  聚会: "Gathering",
  家庭聚餐: "Family Feast",
  夜宵: "Late Night",
  简餐: "Simple Meal",
  日常: "Everyday",
  家常菜: "Home Cooking",
  宴客菜: "Banquet Dish",
  春节: "Chinese New Year",
  中秋节: "Mid-Autumn Festival",
  端午节: "Dragon Boat Festival",
  元宵节: "Lantern Festival",
  清明节: "Qingming Festival",
  重阳节: "Double Ninth Festival",
  生日宴: "Birthday Party",
  婚宴: "Wedding Banquet",
  满月酒: "Full Month Celebration",
  野餐: "Picnic",
  烧烤: "BBQ",
  火锅: "Hot Pot",
  下午茶: "Afternoon Tea",
  看球赛: "Watch Sports",
  追剧: "Binge-Watching",
  周末: "Weekend",
  纪念日: "Anniversary",
};

const TAG_MAP: Record<TagType, Record<string, string>> = {
  scene: {},
  method: METHOD_TAGS_EN,
  taste: TASTE_TAGS_EN,
  crowd: CROWD_TAGS_EN,
  occasion: OCCASION_TAGS_EN,
};

function stripTagPrefix(value: string, type?: TagType): string {
  const trimmed = value.trim();
  if (!type || !trimmed) return trimmed;
  const prefixes = PREFIXES_BY_TYPE[type] || [];
  for (const prefix of prefixes) {
    const regex = new RegExp(`^${prefix}\\s*[:：]?\\s*`, "i");
    const next = trimmed.replace(regex, "").trim();
    if (next !== trimmed) return next;
  }
  return trimmed;
}

export function translateTagName({
  name,
  originalName,
  slug,
  type,
  locale,
}: {
  name?: string | null;
  originalName?: string | null;
  slug?: string | null;
  type?: TagType;
  locale?: string | null;
}): string {
  const raw = (name ?? "").trim();
  if (locale && locale !== "en") return raw;

  const cleanedName = stripTagPrefix(raw, type);
  const cleanedOriginal = stripTagPrefix((originalName ?? "").trim(), type);
  const map = type ? TAG_MAP[type] : undefined;

  const mapped =
    (cleanedName && map?.[cleanedName]) ||
    (cleanedOriginal && map?.[cleanedOriginal]);
  if (mapped) return mapped;

  const candidate = cleanedName || cleanedOriginal || raw;
  if (!candidate) return type ? TAG_LABELS[type] : "";

  if (containsCjk(candidate)) {
    const slugLabel = ensureEnglish(titleFromSlug(slug ?? "", ""), "");
    if (slugLabel) return slugLabel;
    const cleaned = ensureEnglish(candidate, "");
    if (cleaned) return cleaned;
    return type ? TAG_LABELS[type] : candidate;
  }

  return candidate;
}
