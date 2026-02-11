/**
 * 团队成员种子脚本
 *
 * 将现有团队成员数据导入 TeamMember 表
 * 运行方式：npx tsx scripts/seed-team-members.ts
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Load environment variables
config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Please check .env.local file.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 团队成员数据（来自 seed-about.ts）
const teamMembers = [
  {
    slug: "evelyn-lin",
    nameZh: "林悦",
    nameEn: "Evelyn Lin",
    role: "founder",
    bioZh: "曾在海外生活十余年，深知美食是慰藉乡愁的最好良药。她创立 Recipe Zen，希望用科技打破文化壁垒，让每一位海外游子和美食爱好者都能轻松做出地道的中国味。",
    bioEn: "She lived abroad for over a decade and knows how food can soothe homesickness. Evelyn founded Recipe Zen to break cultural barriers with technology so that anyone can cook authentic Chinese dishes with ease.",
    mottoZh: "食物是连接过去与未来的记忆。",
    mottoEn: "Food connects the past with the future.",
    avatarUrl: "/about/team_member_evelyn_lin.png",
    specialtyCuisines: [],
    specialtyRegions: [],
    sortOrder: 1,
  },
  {
    slug: "wei-li",
    nameZh: "李未",
    nameEn: "Wei Li",
    role: "explorer",
    bioZh: "成都土著，一个为麻辣而生的男人。他痴迷于探索西南地区的民间风味，足迹遍布川渝云贵的山野与市集，致力于将最地道的烟火气带给世界。",
    bioEn: "Born in Chengdu, he is a man made for spice. Wei explores folk flavors across Sichuan, Chongqing, Yunnan, and Guizhou, bringing the most authentic street-side dishes to the world.",
    mottoZh: "真正的美味藏在街头巷尾的烟火气里。",
    mottoEn: "Real flavor lives in the smoke and bustle of the streets.",
    avatarUrl: "/about/team_member_wei_li.png",
    specialtyCuisines: ["川菜", "云南菜", "贵州菜", "重庆菜"],
    specialtyRegions: ["四川", "重庆", "云南", "贵州"],
    sortOrder: 2,
  },
  {
    slug: "sichen-chen",
    nameZh: "陈思",
    nameEn: "Sichen Chen",
    role: "explorer",
    bioZh: "来自苏州，一个典型的江南女子。她对食材的季节性变化极为敏感，擅长发掘江浙地区的清雅本味。她相信，最好的烹饪是顺应自然，呈现食材最本真的味道。",
    bioEn: "From Suzhou, she is attuned to the rhythm of ingredients and seasons. Sichen highlights the clean, delicate flavors of Jiangnan and believes the best cooking honors the ingredient's true essence.",
    mottoZh: "不时不食，每一口都是对自然的尊重。",
    mottoEn: "Seasonal eating is respect for nature in every bite.",
    avatarUrl: "/about/team_member_sichen_chen.png",
    specialtyCuisines: ["江浙菜", "苏菜", "杭帮菜"],
    specialtyRegions: ["江苏", "浙江", "上海"],
    sortOrder: 3,
  },
  {
    slug: "leo-zhang",
    nameZh: "张磊",
    nameEn: "Leo Zhang",
    role: "chef",
    bioZh: "拥有 20 年经验的鲁菜大厨，对北方面食和传统烹饪技法有深入研究。他确保 Recipe Zen 的每一份菜谱都严谨、可复现，让新手也能建立烹饪的信心。",
    bioEn: "With 20 years of experience in Lu cuisine, Leo specializes in northern dough techniques and traditional methods. He ensures every Recipe Zen recipe is rigorous and repeatable for beginners.",
    mottoZh: "厨房没有秘密，只有对火候和时间的敬畏。",
    mottoEn: "There are no secrets in the kitchen—only respect for heat and time.",
    avatarUrl: "/about/team_member_leo_zhang.png",
    specialtyCuisines: ["鲁菜", "面食", "北方菜"],
    specialtyRegions: ["山东", "北京", "东北"],
    sortOrder: 4,
  },
  {
    slug: "howard-leung",
    nameZh: "梁浩",
    nameEn: "Howard Leung",
    role: "chef",
    bioZh: "出生于香港厨师世家，曾在多家米其林餐厅工作。他精通粤菜，并热衷于融合创新。他为 Recipe Zen 带来了国际化的视野和对细节的极致追求。",
    bioEn: "Born into a Hong Kong chef family and trained in Michelin kitchens, Howard is a Cantonese expert who loves innovation. He brings an international lens and a sharp eye for detail.",
    mottoZh: "好的料理，是食材与技艺的完美对话。",
    mottoEn: "Great cooking is a conversation between ingredient and craft.",
    avatarUrl: "/about/team_member_howard_leung.png",
    specialtyCuisines: ["粤菜", "港式", "潮汕菜"],
    specialtyRegions: ["广东", "香港"],
    sortOrder: 5,
  },
  {
    slug: "jessica-wang",
    nameZh: "王静",
    nameEn: "Jessica Wang",
    role: "nutritionist",
    bioZh: "拥有美国注册营养师资质，她相信中式烹饪中蕴含着古老的营养智慧。她负责审核每道菜的营养信息，并提供专业的健康饮食建议。",
    bioEn: "A U.S.-registered dietitian, she believes traditional Chinese cooking holds deep nutritional wisdom. Jessica reviews nutrition data and offers professional guidance for healthier eating.",
    mottoZh: "吃得对，比吃得少更重要。",
    mottoEn: "Eating right matters more than eating less.",
    avatarUrl: "/about/team_member_jessica_wang.png",
    specialtyCuisines: [],
    specialtyRegions: [],
    sortOrder: 6,
  },
  {
    slug: "david-liu",
    nameZh: "刘波",
    nameEn: "David Liu",
    role: "chef",
    bioZh: "拥有 15 年食品科学背景，曾在大型连锁餐饮负责研发。他用科学的方法拆解每一道食谱，确保温度、时间和用量的精确无误。",
    bioEn: "With 15 years in food science and R&D for major chains, David deconstructs recipes scientifically. He ensures precision in temperature, timing, and portions.",
    mottoZh: "烹饪是艺术，更是科学。",
    mottoEn: "Cooking is art, but also science.",
    avatarUrl: "/about/team_member_david_liu.png",
    specialtyCuisines: ["创意菜", "分子料理", "融合菜"],
    specialtyRegions: ["上海", "现代都市"],
    sortOrder: 7,
  },
  {
    slug: "grace-wu",
    nameZh: "吴雅",
    nameEn: "Grace Wu",
    role: "chef",
    bioZh: "前米其林餐厅副主厨，对味道的层次有着近乎苛刻的要求。她致力于将复杂的专业技法简化为家庭厨房可操作的步骤，不让美味被打折。",
    bioEn: "Former sous-chef at a Michelin-starred restaurant with exacting standards for flavor. Grace adapts professional techniques for home kitchens without compromising taste.",
    mottoZh: "让每一次下厨都成为享受。",
    mottoEn: "Make every cooking session a joy.",
    avatarUrl: "/about/team_member_grace_wu.png",
    specialtyCuisines: ["家常菜", "烘焙", "甜点"],
    specialtyRegions: ["广州", "家庭厨房"],
    sortOrder: 8,
  },
  {
    slug: "sunny-zhao",
    nameZh: "赵阳",
    nameEn: "Sunny Zhao",
    role: "photographer",
    bioZh: "一位对光线和构图有偏执追求的摄影师。他认为，一张好的美食照片能瞬间唤醒人的食欲。他为 Recipe Zen 的所有图片定下了“真实、温暖、有食欲”的视觉基调。",
    bioEn: "A photographer obsessed with light and composition, Sunny believes a great food photo can awaken appetite instantly. He set the visual tone for Recipe Zen as \"real, warm, and crave-worthy.\"",
    mottoZh: "用光影捕捉食物最诱人的瞬间。",
    mottoEn: "Light is how we capture food at its most irresistible.",
    avatarUrl: "/about/team_member_sunny_zhao.png",
    specialtyCuisines: [],
    specialtyRegions: [],
    sortOrder: 7,
  },
];

async function main() {
  console.log("🌱 开始填充团队成员数据...\n");

  // 清空现有数据
  const existingCount = await prisma.teamMember.count();
  if (existingCount > 0) {
    console.log(`⚠️  发现 ${existingCount} 条现有数据，将进行 upsert 操作`);
  }

  // 导入团队成员
  for (const member of teamMembers) {
    const result = await prisma.teamMember.upsert({
      where: { slug: member.slug },
      update: {
        nameZh: member.nameZh,
        nameEn: member.nameEn,
        role: member.role,
        bioZh: member.bioZh,
        bioEn: member.bioEn,
        mottoZh: member.mottoZh,
        mottoEn: member.mottoEn,
        avatarUrl: member.avatarUrl,
        specialtyCuisines: member.specialtyCuisines,
        specialtyRegions: member.specialtyRegions,
        sortOrder: member.sortOrder,
        isActive: true,
      },
      create: {
        slug: member.slug,
        nameZh: member.nameZh,
        nameEn: member.nameEn,
        role: member.role,
        bioZh: member.bioZh,
        bioEn: member.bioEn,
        mottoZh: member.mottoZh,
        mottoEn: member.mottoEn,
        avatarUrl: member.avatarUrl,
        specialtyCuisines: member.specialtyCuisines,
        specialtyRegions: member.specialtyRegions,
        sortOrder: member.sortOrder,
        isActive: true,
      },
    });

    const roleLabel = {
      founder: "创始人",
      explorer: "探寻者",
      chef: "厨师",
      nutritionist: "营养师",
      photographer: "摄影师",
    }[member.role] || member.role;

    console.log(`✅ ${member.nameZh} (${member.nameEn}) - ${roleLabel}`);
  }

  console.log(`\n🎉 团队成员数据填充完成！共 ${teamMembers.length} 人`);

  // 显示统计
  const stats = await prisma.teamMember.groupBy({
    by: ["role"],
    _count: { role: true },
    where: { isActive: true },
  });

  console.log("\n📊 角色统计:");
  stats.forEach((s) => {
    const label = {
      founder: "创始人",
      explorer: "探寻者",
      chef: "厨师",
      nutritionist: "营养师",
      photographer: "摄影师",
    }[s.role] || s.role;
    console.log(`   ${label}: ${s._count.role} 人`);
  });
}

main()
  .catch((error) => {
    console.error("❌ 种子数据填充失败:", error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
