/**
 * 菜系差异化指导
 *
 * 为不同菜系提供特色化的生成指导
 */

export interface CuisineGuide {
  name: string;
  flavorProfile: string;
  techniques: string[];
  visualElements: string[];
  toneGuidance: string;
}

export const CUISINE_GUIDES: Record<string, CuisineGuide> = {
  川菜: {
    name: "川菜",
    flavorProfile: "麻辣鲜香，一菜一格，百菜百味。突出花椒的麻和辣椒的辣，讲究复合味型（麻辣、香辣、酸辣、鱼香、怪味等）",
    techniques: ["炝锅（花椒辣椒爆香）", "小炒（急火快炒）", "干煸（炒至干香）", "水煮（麻辣汤汁）", "回锅（二次烹饪）"],
    visualElements: ["红油光泽", "花椒粒点缀", "辣椒段或辣椒面", "葱花蒜末", "热气腾腾的汤汁"],
    toneGuidance: "强调麻辣刺激但层次丰富，下饭是核心诉求，适合喜欢重口味的食客"
  },

  粤菜: {
    name: "粤菜",
    flavorProfile: "清淡鲜美，讲究食材本味。追求鲜、嫩、爽、滑，调味以盐、糖、生抽为主，不掩盖食材原味",
    techniques: ["清蒸（保持原味）", "白灼（快速焯水）", "滑炒（滑油锁水）", "煲汤（文火慢炖）", "烧腊（明炉烤制）"],
    visualElements: ["食材原色", "清澈的汤汁", "油亮但不油腻", "精致摆盘", "葱姜丝点缀"],
    toneGuidance: "强调食材品质和火候控制，追求鲜嫩口感，适合注重健康和原味的食客"
  },

  湘菜: {
    name: "湘菜",
    flavorProfile: "香辣酸鲜，口味偏重。以剁椒、腊味、酸菜为特色，辣而不燥，酸而不酷",
    techniques: ["干煸（炒至焦香）", "焖（小火收汁）", "蒸（剁椒蒸）", "炒（大火爆炒）", "腊制（风干腌制）"],
    visualElements: ["剁椒红色", "腊肉色泽", "焦香边缘", "蒜末葱花", "浓稠汤汁"],
    toneGuidance: "强调香辣下饭，适合重口味和喜欢腊味的食客，突出湖南特色食材"
  },

  鲁菜: {
    name: "鲁菜",
    flavorProfile: "咸鲜为主，讲究火候。注重原汁原味，善用葱姜蒜提味，汤菜尤为出色",
    techniques: ["爆炒（急火快炒）", "扒（慢火收汁）", "烧（红烧白烧）", "炸（外酥里嫩）", "熬汤（浓白高汤）"],
    visualElements: ["金黄色泽", "浓稠汤汁", "葱段姜片", "酱色光泽", "整齐摆盘"],
    toneGuidance: "强调传统正宗，火候精准，适合喜欢咸鲜口味和传统烹饪的食客"
  },

  苏菜: {
    name: "苏菜（淮扬菜）",
    flavorProfile: "清鲜平和，咸甜适中。讲究刀工和造型，口味偏甜，注重原汁原味",
    techniques: ["炖（文火慢炖）", "焖（小火收汁）", "煨（密封慢煮）", "蒸（清蒸保鲜）", "炒（清炒嫩滑）"],
    visualElements: ["清澈汤汁", "精致刀工", "食材原色", "糖色光泽", "雅致摆盘"],
    toneGuidance: "强调精致细腻，刀工讲究，适合喜欢清淡微甜口味的食客"
  },

  浙菜: {
    name: "浙菜",
    flavorProfile: "清鲜脆嫩，口味清淡。善用河鲜海鲜，注重原汁原味，略带甜味",
    techniques: ["炒（嫩炒滑炒）", "炸（酥炸）", "烩（勾芡收汁）", "蒸（清蒸）", "烧（红烧）"],
    visualElements: ["清澈汤汁", "食材鲜嫩", "油亮色泽", "葱姜点缀", "清爽摆盘"],
    toneGuidance: "强调江南水乡特色，食材新鲜，适合喜欢清淡鲜美的食客"
  },

  闽菜: {
    name: "闽菜",
    flavorProfile: "鲜香清淡，善用海鲜。讲究汤菜，调味偏甜酸，善用红糟、虾油等特色调料",
    techniques: ["炒（滑炒）", "蒸（清蒸）", "煨（文火慢煮）", "炸（酥炸）", "糟（红糟腌制）"],
    visualElements: ["海鲜原色", "清澈汤汁", "红糟色泽", "姜葱点缀", "精致摆盘"],
    toneGuidance: "强调海鲜鲜美，汤菜精华，适合喜欢海鲜和清淡口味的食客"
  },

  徽菜: {
    name: "徽菜",
    flavorProfile: "重油重色，咸鲜微辣。善用火腿、笋干等山珍，讲究火功，汁浓味重",
    techniques: ["烧（红烧）", "炖（文火慢炖）", "蒸（清蒸）", "熏（烟熏）", "腌（腌制）"],
    visualElements: ["酱红色泽", "浓稠汤汁", "火腿笋干", "油亮光泽", "朴实摆盘"],
    toneGuidance: "强调山野风味，火功深厚，适合喜欢浓郁口味的食客"
  },

  东北菜: {
    name: "东北菜",
    flavorProfile: "咸鲜为主，分量大。口味偏重，善用酱料，讲究实惠和下饭",
    techniques: ["炖（大锅炖）", "炒（大火爆炒）", "拌（凉拌）", "酱（酱制）", "烤（烧烤）"],
    visualElements: ["大块食材", "浓稠汤汁", "酱色光泽", "葱姜蒜", "豪放摆盘"],
    toneGuidance: "强调分量足、下饭、实惠，适合喜欢大口吃肉的食客"
  },

  家常菜: {
    name: "家常菜",
    flavorProfile: "咸鲜适中，口味大众。食材常见，做法简单，适合日常烹饪",
    techniques: ["炒（家常炒）", "炖（家常炖）", "蒸（清蒸）", "煮（水煮）", "煎（煎制）"],
    visualElements: ["家常食材", "自然色泽", "简单摆盘", "葱花点缀", "温馨氛围"],
    toneGuidance: "强调简单易做、食材常见、适合新手，突出家的温暖感"
  }
};

/**
 * 获取菜系指导文本
 */
export function getCuisineGuide(cuisine?: string): string {
  if (!cuisine || !CUISINE_GUIDES[cuisine]) {
    return "";
  }

  const guide = CUISINE_GUIDES[cuisine];
  return `
【${guide.name}特色要求】
- 风味特点：${guide.flavorProfile}
- 核心技法：${guide.techniques.join("、")}
- 视觉元素：${guide.visualElements.join("、")}
- 文案语气：${guide.toneGuidance}
`;
}

/**
 * 获取所有支持的菜系列表
 */
export function getSupportedCuisines(): string[] {
  return Object.keys(CUISINE_GUIDES);
}
