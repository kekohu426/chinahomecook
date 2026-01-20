export type BrowseSeedItem = {
  name: string;
  description: string;
  slug: string;
};

import { RECIPE_SCENES } from "@/data/recipeScenes";

export type BrowseSeedByType = {
  REGION: BrowseSeedItem[];
  CUISINE: BrowseSeedItem[];
  INGREDIENT: BrowseSeedItem[];
  SCENE: BrowseSeedItem[];
};

const DEFAULT_SCENE_ITEMS_ZH: BrowseSeedItem[] = RECIPE_SCENES.map((scene) => ({
  name: scene.nameZh,
  description: scene.descriptionZh,
  slug: scene.slug,
}));

const DEFAULT_SCENE_ITEMS_EN: BrowseSeedItem[] = RECIPE_SCENES.map((scene) => ({
  name: scene.nameEn,
  description: scene.descriptionEn,
  slug: scene.slug,
}));

export const DEFAULT_BROWSE_ITEMS_ZH: BrowseSeedByType = {
  REGION: [
    { name: "川渝", description: "麻辣鲜香，经典川味", slug: "chuanyu" },
    { name: "粤港澳", description: "清淡鲜美，原汁原味", slug: "yuegangao" },
    { name: "江浙", description: "甜润细腻，精致讲究", slug: "jiangzhe" },
    { name: "东北", description: "豪爽厚重，实惠下饭", slug: "dongbei" },
    { name: "湖南", description: "酸辣浓郁，重口开胃", slug: "hunan" },
    { name: "云贵", description: "酸辣鲜香，民族风味", slug: "yungui" },
  ],
  CUISINE: [
    { name: "川菜", description: "麻辣鲜香，百菜百味", slug: "chuancai" },
    { name: "粤菜", description: "清淡鲜美，突出原味", slug: "yuecai" },
    { name: "江浙菜", description: "清雅鲜甜，刀工细腻", slug: "jiangzhecai" },
    { name: "鲁菜", description: "咸鲜醇厚，讲究火候", slug: "lucai" },
    { name: "湘菜", description: "香辣浓郁，重口开胃", slug: "xiangcai" },
    { name: "西北菜", description: "面食为主，香料独特", slug: "xibeicai" },
  ],
  INGREDIENT: [
    { name: "鸡肉", description: "高蛋白家常做法", slug: "鸡肉" },
    { name: "猪肉", description: "经典家常味，百吃不腻", slug: "猪肉" },
    { name: "牛肉", description: "耐嚼有滋味，补充能量", slug: "牛肉" },
    { name: "鱼", description: "鲜嫩少刺，清爽好入口", slug: "鱼" },
    { name: "虾", description: "鲜甜弹牙，宴客好选择", slug: "虾" },
    { name: "豆腐", description: "百搭素食，营养均衡", slug: "豆腐" },
    { name: "鸡蛋", description: "家常必备，百变做法", slug: "鸡蛋" },
    { name: "番茄", description: "酸甜开胃，色泽诱人", slug: "番茄" },
    { name: "土豆", description: "软糯饱腹，孩子最爱", slug: "土豆" },
    { name: "菌菇", description: "鲜香浓郁，提升层次", slug: "菌菇" },
    { name: "辣椒", description: "微辣开胃，香气更足", slug: "辣椒" },
    { name: "青菜", description: "清爽解腻，搭配更均衡", slug: "青菜" },
  ],
  SCENE: DEFAULT_SCENE_ITEMS_ZH,
};

export const DEFAULT_BROWSE_ITEMS_EN: BrowseSeedByType = {
  REGION: [
    { name: "Sichuan & Chongqing", description: "Bold, spicy, classic Sichuan flavors", slug: "chuanyu" },
    { name: "Cantonese & Greater Bay", description: "Light, fresh, and true to the ingredient", slug: "yuegangao" },
    { name: "Jiangsu & Zhejiang", description: "Soft, delicate, and refined", slug: "jiangzhe" },
    { name: "Northeast", description: "Hearty, comforting, and filling", slug: "dongbei" },
    { name: "Hunan", description: "Hot, tangy, and bold", slug: "hunan" },
    { name: "Yunnan & Guizhou", description: "Sour-spicy, aromatic, ethnic flair", slug: "yungui" },
  ],
  CUISINE: [
    { name: "Sichuan", description: "Spicy, bold, and deeply savory", slug: "chuancai" },
    { name: "Cantonese", description: "Light, fresh, and ingredient-forward", slug: "yuecai" },
    { name: "Jiangsu & Zhejiang", description: "Clean, sweet, and delicate", slug: "jiangzhecai" },
    { name: "Shandong", description: "Savory, rich, and technique-driven", slug: "lucai" },
    { name: "Hunan", description: "Spicy, aromatic, and hearty", slug: "xiangcai" },
    { name: "Northwest", description: "Noodle-centered with bold spices", slug: "xibeicai" },
  ],
  INGREDIENT: [
    { name: "Chicken", description: "High-protein, everyday classics", slug: "鸡肉" },
    { name: "Pork", description: "Comforting, family-style staples", slug: "猪肉" },
    { name: "Beef", description: "Rich, hearty, and satisfying", slug: "牛肉" },
    { name: "Fish", description: "Light, tender, and fresh", slug: "鱼" },
    { name: "Shrimp", description: "Sweet, springy, and festive", slug: "虾" },
    { name: "Tofu", description: "Versatile, light, and balanced", slug: "豆腐" },
    { name: "Eggs", description: "Simple, flexible, and fast", slug: "鸡蛋" },
    { name: "Tomato", description: "Bright, tangy, and appetizing", slug: "番茄" },
    { name: "Potato", description: "Soft, filling, and kid-friendly", slug: "土豆" },
    { name: "Mushrooms", description: "Umami-rich and fragrant", slug: "菌菇" },
    { name: "Chili Pepper", description: "Gentle heat, big aroma", slug: "辣椒" },
    { name: "Greens", description: "Fresh, light, and balanced", slug: "青菜" },
  ],
  SCENE: DEFAULT_SCENE_ITEMS_EN,
};

export type TestimonialSeedItem = {
  name: string;
  role: string;
  city: string;
  avatarUrl: string;
  content: string;
  meta: string;
};

export const DEFAULT_TESTIMONIALS_ZH: TestimonialSeedItem[] = [
  {
    name: "王雅婷",
    role: "全职妈妈",
    city: "北京",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172065-UlbCpbdz.webp",
    content:
      "以前做饭完全靠外卖，有了孩子后想给他做点健康的。Recipe Zen 的食谱很适合我这种小白，步骤清楚还有语音朗读，手忙脚乱也不用一直看手机。上周做的番茄炖牛腩，老公夸了好久！",
    meta: "⭐⭐⭐⭐⭐ | 使用 3 个月 | 已做成 28 道菜",
  },
  {
    name: "李建国",
    role: "程序员",
    city: "深圳",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172080-MbORzZ4o.webp",
    content:
      "996 的生活，回家只想吃口热乎的。我用定制功能输入“快手菜 + 低油少盐”，很快推荐了适合的菜。最喜欢智能计时器，到点提醒，不用担心煮过头。",
    meta: "⭐⭐⭐⭐⭐ | 使用 2 个月 | 最爱功能：定制 + 计时",
  },
  {
    name: "张敏",
    role: "糖尿病患者",
    city: "上海",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172097-mXH5eYHf.webp",
    content:
      "确诊糖尿病后，饮食管理成了大问题。定制食谱能根据我的控糖需求生成方案，而且每道菜都有专业团队审核，不是随便拼凑的内容，吃得很放心。",
    meta: "⭐⭐⭐⭐⭐ | 使用 5 个月 | 血糖管理案例",
  },
  {
    name: "陈思远",
    role: "留学生",
    city: "美国加州",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172115-2ITSzc78.webp",
    content:
      "在国外特别想吃家乡菜，但又不会做。按地域分类的食谱帮了大忙，我是湖南人，网站上的川湘菜做法很地道。照着做剁椒鱼头时，真的特别感动。",
    meta: "⭐⭐⭐⭐⭐ | 使用 4 个月 | 已复刻 15 道家乡菜",
  },
  {
    name: "刘大爷",
    role: "退休教师",
    city: "成都",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172134-usPRQlR8.webp",
    content:
      "年纪大了眼神不好，但语音朗读功能特别方便，字也能调大。打印食谱更绝，贴厨房墙上做菜一抬头就看见。现在老伴儿都夸我手艺见长。",
    meta: "⭐⭐⭐⭐⭐ | 使用 6 个月 | 最爱功能：语音 + 打印",
  },
  {
    name: "小鹿美食记",
    role: "美食博主",
    city: "杭州",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172155-3oXy9doV.webp",
    content:
      "经常需要高清菜品图做封面，Recipe Zen 的图片库真实感很强，而且免费可商用！食谱内容也扎实，步骤能复现，我会推荐粉丝来学菜。",
    meta: "⭐⭐⭐⭐⭐ | 使用 8 个月 | 已下载 200+ 张图片",
  },
];

export const DEFAULT_TESTIMONIALS_EN: TestimonialSeedItem[] = [
  {
    name: "Yating Wang",
    role: "Full-time mom",
    city: "Beijing",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172065-UlbCpbdz.webp",
    content:
      "I relied on takeout before. Now the steps are so clear and voice guidance helps a lot. My tomato beef stew was a hit!",
    meta: "⭐⭐⭐⭐⭐ | 3 months | 28 dishes",
  },
  {
    name: "Jianguo Li",
    role: "Software engineer",
    city: "Shenzhen",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172080-MbORzZ4o.webp",
    content:
      "After a long day, I just want something warm. The AI custom and timers are perfect for quick, low-oil meals.",
    meta: "⭐⭐⭐⭐⭐ | 2 months | Favorite: Custom + Timer",
  },
  {
    name: "Min Zhang",
    role: "Health-conscious",
    city: "Shanghai",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172097-mXH5eYHf.webp",
    content:
      "The recipes feel trustworthy because they’re reviewed. It makes diet control much easier.",
    meta: "⭐⭐⭐⭐⭐ | 5 months | Verified result",
  },
  {
    name: "Siyuan Chen",
    role: "Overseas student",
    city: "California",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172115-2ITSzc78.webp",
    content:
      "Regional recipes bring back home flavors. Cooking them abroad feels comforting.",
    meta: "⭐⭐⭐⭐⭐ | 4 months | 15 home dishes",
  },
  {
    name: "Mr. Liu",
    role: "Retired teacher",
    city: "Chengdu",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172134-usPRQlR8.webp",
    content:
      "Voice playback and printed recipes are super helpful. I can cook without staring at my phone.",
    meta: "⭐⭐⭐⭐⭐ | 6 months | Favorite: Voice + Print",
  },
  {
    name: "Luna Foodie",
    role: "Food blogger",
    city: "Hangzhou",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172155-3oXy9doV.webp",
    content:
      "The image library is amazing and free to use. The recipe steps are solid and easy to follow.",
    meta: "⭐⭐⭐⭐⭐ | 8 months | 200+ images",
  },
];
