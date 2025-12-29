/**
 * 美食专家数据库
 *
 * 完整的地点、菜系、菜谱名称映射系统
 * 基于真实中国美食文化体系
 */

// ============ 1. 地点数据 ============
export interface LocationData {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  cuisines: string[]; // 该地点的主要菜系
  iconEmoji: string;
}

export const LOCATIONS: LocationData[] = [
  {
    id: "loc_chuanyu",
    name: "川渝",
    slug: "chuanyu",
    description: "麻辣鲜香，火锅之乡",
    sortOrder: 1,
    isActive: true,
    cuisines: ["川菜", "渝菜"],
    iconEmoji: "🌶️"
  },
  {
    id: "loc_jiangzhe",
    name: "江浙",
    slug: "jiangzhe",
    description: "鲜甜清淡，江南风味",
    sortOrder: 2,
    isActive: true,
    cuisines: ["苏菜", "浙菜", "本帮菜"],
    iconEmoji: "🦐"
  },
  {
    id: "loc_guangdong",
    name: "粤港澳",
    slug: "yuegangao",
    description: "原汁原味，海鲜之都",
    sortOrder: 3,
    isActive: true,
    cuisines: ["粤菜", "潮汕菜"],
    iconEmoji: "🦞"
  },
  {
    id: "loc_dongbei",
    name: "东北",
    slug: "dongbei",
    description: "量大实惠，家常炖菜",
    sortOrder: 4,
    isActive: true,
    cuisines: ["东北菜"],
    iconEmoji: "🥘"
  },
  {
    id: "loc_xibei",
    name: "西北",
    slug: "xibei",
    description: "面食羊肉，丝路风情",
    sortOrder: 5,
    isActive: true,
    cuisines: ["西北菜", "新疆菜"],
    iconEmoji: "🍜"
  },
  {
    id: "loc_hunan",
    name: "湖南",
    slug: "hunan",
    description: "酸辣浓郁，湘江美味",
    sortOrder: 6,
    isActive: true,
    cuisines: ["湘菜"],
    iconEmoji: "🌶️"
  },
  {
    id: "loc_hubei",
    name: "湖北",
    slug: "hubei",
    description: "江汉平原，鱼米之乡",
    sortOrder: 7,
    isActive: true,
    cuisines: ["鄂菜"],
    iconEmoji: "🐟"
  },
  {
    id: "loc_fujian",
    name: "福建",
    slug: "fujian",
    description: "山珍海味，清淡鲜美",
    sortOrder: 8,
    isActive: true,
    cuisines: ["闽菜"],
    iconEmoji: "🦀"
  },
  {
    id: "loc_shandong",
    name: "山东",
    slug: "shandong",
    description: "齐鲁大地，海陆珍馐",
    sortOrder: 9,
    isActive: true,
    cuisines: ["鲁菜"],
    iconEmoji: "🦑"
  },
  {
    id: "loc_anhui",
    name: "安徽",
    slug: "anhui",
    description: "徽州古韵，山野美食",
    sortOrder: 10,
    isActive: true,
    cuisines: ["徽菜"],
    iconEmoji: "🏔️"
  }
];

// ============ 2. 菜系数据 ============
export interface CuisineData {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  features: string[]; // 特点标签
  iconEmoji: string;
}

export const CUISINES: CuisineData[] = [
  {
    id: "cui_chuan",
    name: "川菜",
    slug: "chuan",
    description: "麻辣鲜香，百菜百味",
    sortOrder: 1,
    isActive: true,
    features: ["麻辣", "鲜香", "浓郁"],
    iconEmoji: "🌶️"
  },
  {
    id: "cui_yue",
    name: "粤菜",
    slug: "yue",
    description: "清淡鲜美，原汁原味",
    sortOrder: 2,
    isActive: true,
    features: ["清淡", "鲜美", "海鲜"],
    iconEmoji: "🦐"
  },
  {
    id: "cui_xiang",
    name: "湘菜",
    slug: "xiang",
    description: "酸辣咸香，浓油赤酱",
    sortOrder: 3,
    isActive: true,
    features: ["酸辣", "重口", "下饭"],
    iconEmoji: "🌶️"
  },
  {
    id: "cui_su",
    name: "苏菜",
    slug: "su",
    description: "鲜甜清淡，刀工精细",
    sortOrder: 4,
    isActive: true,
    features: ["鲜甜", "清淡", "精致"],
    iconEmoji: "🦀"
  },
  {
    id: "cui_zhe",
    name: "浙菜",
    slug: "zhe",
    description: "鲜嫩爽滑，清鲜脆嫩",
    sortOrder: 5,
    isActive: true,
    features: ["清鲜", "嫩滑", "江南"],
    iconEmoji: "🐟"
  },
  {
    id: "cui_min",
    name: "闽菜",
    slug: "min",
    description: "山海合璧，清鲜醇厚",
    sortOrder: 6,
    isActive: true,
    features: ["海鲜", "汤鲜", "养生"],
    iconEmoji: "🦞"
  },
  {
    id: "cui_hui",
    name: "徽菜",
    slug: "hui",
    description: "重油重色，咸鲜适中",
    sortOrder: 7,
    isActive: true,
    features: ["重油", "重色", "山野"],
    iconEmoji: "🏔️"
  },
  {
    id: "cui_lu",
    name: "鲁菜",
    slug: "lu",
    description: "鲜咸适口，注重原味",
    sortOrder: 8,
    isActive: true,
    features: ["鲜咸", "海鲜", "爆炒"],
    iconEmoji: "🦑"
  },
  {
    id: "cui_dongbei",
    name: "东北菜",
    slug: "dongbei",
    description: "量大实惠，炖菜为主",
    sortOrder: 9,
    isActive: true,
    features: ["量大", "实惠", "炖菜"],
    iconEmoji: "🥘"
  },
  {
    id: "cui_jiachang",
    name: "家常菜",
    slug: "jiachang",
    description: "简单易做，家的味道",
    sortOrder: 10,
    isActive: true,
    features: ["简单", "家常", "下饭"],
    iconEmoji: "🏠"
  }
];

// ============ 3. 菜谱名称库 ============
export interface RecipeNameData {
  name: string;
  cuisines: string[]; // 所属菜系
  locations: string[]; // 主要地点
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  popular: boolean; // 是否热门
}

export const RECIPE_NAMES: RecipeNameData[] = [
  // === 川菜 ===
  { name: "麻婆豆腐", cuisines: ["川菜"], locations: ["川渝"], difficulty: "easy", tags: ["麻辣", "下饭", "经典"], popular: true },
  { name: "宫保鸡丁", cuisines: ["川菜"], locations: ["川渝"], difficulty: "medium", tags: ["麻辣", "鸡肉", "经典"], popular: true },
  { name: "水煮鱼", cuisines: ["川菜"], locations: ["川渝"], difficulty: "medium", tags: ["麻辣", "鱼", "重口"], popular: true },
  { name: "回锅肉", cuisines: ["川菜"], locations: ["川渝"], difficulty: "easy", tags: ["麻辣", "猪肉", "下饭"], popular: true },
  { name: "鱼香肉丝", cuisines: ["川菜"], locations: ["川渝"], difficulty: "medium", tags: ["酸甜", "猪肉", "下饭"], popular: true },
  { name: "夫妻肺片", cuisines: ["川菜"], locations: ["川渝"], difficulty: "hard", tags: ["麻辣", "凉菜", "经典"], popular: false },
  { name: "口水鸡", cuisines: ["川菜"], locations: ["川渝"], difficulty: "medium", tags: ["麻辣", "鸡肉", "凉菜"], popular: false },
  { name: "辣子鸡", cuisines: ["川菜"], locations: ["川渝"], difficulty: "medium", tags: ["麻辣", "鸡肉", "重口"], popular: true },
  { name: "毛血旺", cuisines: ["川菜", "渝菜"], locations: ["川渝"], difficulty: "hard", tags: ["麻辣", "重口", "火锅"], popular: true },
  { name: "酸菜鱼", cuisines: ["川菜", "渝菜"], locations: ["川渝"], difficulty: "medium", tags: ["酸辣", "鱼", "开胃"], popular: true },

  // === 湘菜 ===
  { name: "剁椒鱼头", cuisines: ["湘菜"], locations: ["湖南"], difficulty: "medium", tags: ["酸辣", "鱼", "蒸菜"], popular: true },
  { name: "辣椒炒肉", cuisines: ["湘菜"], locations: ["湖南"], difficulty: "easy", tags: ["酸辣", "猪肉", "下饭"], popular: true },
  { name: "农家小炒肉", cuisines: ["湘菜"], locations: ["湖南"], difficulty: "easy", tags: ["酸辣", "猪肉", "家常"], popular: true },
  { name: "红烧肉", cuisines: ["湘菜", "家常菜"], locations: ["湖南"], difficulty: "medium", tags: ["甜", "猪肉", "经典"], popular: true },
  { name: "啤酒鸭", cuisines: ["湘菜"], locations: ["湖南"], difficulty: "medium", tags: ["酸辣", "鸭肉", "下饭"], popular: true },

  // === 粤菜 ===
  { name: "白切鸡", cuisines: ["粤菜"], locations: ["粤港澳"], difficulty: "easy", tags: ["清淡", "鸡肉", "经典"], popular: true },
  { name: "清蒸鲈鱼", cuisines: ["粤菜"], locations: ["粤港澳"], difficulty: "easy", tags: ["清淡", "鱼", "蒸菜"], popular: true },
  { name: "蚝油生菜", cuisines: ["粤菜"], locations: ["粤港澳"], difficulty: "easy", tags: ["清淡", "素菜", "快手"], popular: false },
  { name: "菠萝咕咾肉", cuisines: ["粤菜"], locations: ["粤港澳"], difficulty: "medium", tags: ["酸甜", "猪肉", "经典"], popular: true },
  { name: "盐焗鸡", cuisines: ["粤菜"], locations: ["粤港澳"], difficulty: "hard", tags: ["咸香", "鸡肉", "传统"], popular: false },
  { name: "虾饺", cuisines: ["粤菜"], locations: ["粤港澳"], difficulty: "hard", tags: ["清淡", "海鲜", "点心"], popular: true },
  { name: "干炒牛河", cuisines: ["粤菜"], locations: ["粤港澳"], difficulty: "medium", tags: ["咸香", "牛肉", "快手"], popular: true },

  // === 苏菜 ===
  { name: "红烧狮子头", cuisines: ["苏菜"], locations: ["江浙"], difficulty: "hard", tags: ["甜", "猪肉", "经典"], popular: true },
  { name: "松鼠桂鱼", cuisines: ["苏菜"], locations: ["江浙"], difficulty: "hard", tags: ["酸甜", "鱼", "宴客"], popular: true },
  { name: "大煮干丝", cuisines: ["苏菜"], locations: ["江浙"], difficulty: "medium", tags: ["清淡", "豆制品", "经典"], popular: false },
  { name: "糖醋小排", cuisines: ["苏菜"], locations: ["江浙"], difficulty: "medium", tags: ["酸甜", "猪肉", "下饭"], popular: true },

  // === 浙菜 ===
  { name: "西湖醋鱼", cuisines: ["浙菜"], locations: ["江浙"], difficulty: "hard", tags: ["酸甜", "鱼", "经典"], popular: true },
  { name: "东坡肉", cuisines: ["浙菜"], locations: ["江浙"], difficulty: "hard", tags: ["甜", "猪肉", "传统"], popular: true },
  { name: "龙井虾仁", cuisines: ["浙菜"], locations: ["江浙"], difficulty: "medium", tags: ["清淡", "海鲜", "精致"], popular: true },
  { name: "叫化鸡", cuisines: ["浙菜"], locations: ["江浙"], difficulty: "hard", tags: ["咸香", "鸡肉", "传统"], popular: false },

  // === 鲁菜 ===
  { name: "葱爆海参", cuisines: ["鲁菜"], locations: ["山东"], difficulty: "hard", tags: ["咸鲜", "海鲜", "高级"], popular: false },
  { name: "德州扒鸡", cuisines: ["鲁菜"], locations: ["山东"], difficulty: "hard", tags: ["咸香", "鸡肉", "传统"], popular: false },
  { name: "九转大肠", cuisines: ["鲁菜"], locations: ["山东"], difficulty: "hard", tags: ["重口", "内脏", "经典"], popular: false },
  { name: "油焖大虾", cuisines: ["鲁菜"], locations: ["山东"], difficulty: "medium", tags: ["咸鲜", "海鲜", "下饭"], popular: true },

  // === 东北菜 ===
  { name: "锅包肉", cuisines: ["东北菜"], locations: ["东北"], difficulty: "medium", tags: ["酸甜", "猪肉", "经典"], popular: true },
  { name: "地三鲜", cuisines: ["东北菜"], locations: ["东北"], difficulty: "easy", tags: ["家常", "素菜", "下饭"], popular: true },
  { name: "小鸡炖蘑菇", cuisines: ["东北菜"], locations: ["东北"], difficulty: "easy", tags: ["咸香", "鸡肉", "炖菜"], popular: true },
  { name: "猪肉炖粉条", cuisines: ["东北菜"], locations: ["东北"], difficulty: "easy", tags: ["咸香", "猪肉", "炖菜"], popular: true },
  { name: "铁锅炖大鹅", cuisines: ["东北菜"], locations: ["东北"], difficulty: "medium", tags: ["咸香", "鹅肉", "炖菜"], popular: false },
  { name: "酸菜白肉", cuisines: ["东北菜"], locations: ["东北"], difficulty: "easy", tags: ["酸", "猪肉", "炖菜"], popular: true },

  // === 闽菜 ===
  { name: "佛跳墙", cuisines: ["闽菜"], locations: ["福建"], difficulty: "hard", tags: ["滋补", "海鲜", "高级"], popular: false },
  { name: "荔枝肉", cuisines: ["闽菜"], locations: ["福建"], difficulty: "medium", tags: ["酸甜", "猪肉", "经典"], popular: false },

  // === 徽菜 ===
  { name: "臭鳜鱼", cuisines: ["徽菜"], locations: ["安徽"], difficulty: "hard", tags: ["重口", "鱼", "经典"], popular: false },
  { name: "毛豆腐", cuisines: ["徽菜"], locations: ["安徽"], difficulty: "medium", tags: ["重口", "豆制品", "特色"], popular: false },

  // === 家常菜 ===
  { name: "番茄炒蛋", cuisines: ["家常菜"], locations: ["川渝", "江浙", "粤港澳", "东北", "湖南"], difficulty: "easy", tags: ["家常", "简单", "下饭"], popular: true },
  { name: "青椒土豆丝", cuisines: ["家常菜"], locations: ["川渝", "江浙", "粤港澳", "东北", "湖南"], difficulty: "easy", tags: ["家常", "素菜", "快手"], popular: true },
  { name: "蒜蓉西兰花", cuisines: ["家常菜"], locations: ["川渝", "江浙", "粤港澳", "东北", "湖南"], difficulty: "easy", tags: ["家常", "素菜", "清淡"], popular: false },
  { name: "可乐鸡翅", cuisines: ["家常菜"], locations: ["川渝", "江浙", "粤港澳", "东北", "湖南"], difficulty: "easy", tags: ["家常", "鸡肉", "甜"], popular: true },
  { name: "糖醋排骨", cuisines: ["家常菜"], locations: ["川渝", "江浙", "粤港澳", "东北", "湖南"], difficulty: "medium", tags: ["家常", "猪肉", "酸甜"], popular: true },
  { name: "红烧茄子", cuisines: ["家常菜"], locations: ["川渝", "江浙", "粤港澳", "东北", "湖南"], difficulty: "easy", tags: ["家常", "素菜", "下饭"], popular: true },
  { name: "炒青菜", cuisines: ["家常菜"], locations: ["川渝", "江浙", "粤港澳", "东北", "湖南"], difficulty: "easy", tags: ["家常", "素菜", "快手"], popular: false },
];

// ============ 4. 辅助函数 ============

/**
 * 根据菜系获取菜谱列表
 */
export function getRecipesByCuisine(cuisineName: string): RecipeNameData[] {
  return RECIPE_NAMES.filter(recipe =>
    recipe.cuisines.includes(cuisineName)
  );
}

/**
 * 根据地点获取菜谱列表
 */
export function getRecipesByLocation(locationName: string): RecipeNameData[] {
  return RECIPE_NAMES.filter(recipe =>
    recipe.locations.includes(locationName)
  );
}

/**
 * 获取热门菜谱
 */
export function getPopularRecipes(): RecipeNameData[] {
  return RECIPE_NAMES.filter(recipe => recipe.popular);
}

/**
 * 根据难度获取菜谱
 */
export function getRecipesByDifficulty(difficulty: "easy" | "medium" | "hard"): RecipeNameData[] {
  return RECIPE_NAMES.filter(recipe => recipe.difficulty === difficulty);
}

/**
 * 获取所有菜谱名称（用于选择器）
 */
export function getAllRecipeNames(): string[] {
  return RECIPE_NAMES.map(r => r.name);
}

/**
 * 按菜系分组
 */
export function groupRecipesByCuisine(): Record<string, RecipeNameData[]> {
  const grouped: Record<string, RecipeNameData[]> = {};

  CUISINES.forEach(cuisine => {
    grouped[cuisine.name] = getRecipesByCuisine(cuisine.name);
  });

  return grouped;
}

/**
 * 按地点分组
 */
export function groupRecipesByLocation(): Record<string, RecipeNameData[]> {
  const grouped: Record<string, RecipeNameData[]> = {};

  LOCATIONS.forEach(location => {
    grouped[location.name] = getRecipesByLocation(location.name);
  });

  return grouped;
}
