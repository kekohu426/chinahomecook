/**
 * 团队成员自动分配逻辑
 *
 * 为食谱随机分配探寻者和审核者
 * 策略：纯随机分配，后续可手动调整
 */

import { prisma } from "@/lib/db/prisma";

interface AssignResult {
  explorerId: string | null;
  reviewerId: string | null;
  explorerName?: string;
  reviewerName?: string;
}

/**
 * 从数组中随机选择一个元素
 */
function randomPick<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

/**
 * 为食谱随机分配团队成员
 * 策略：从活跃成员中随机选择，后续可手动调整
 */
export async function assignTeamMembers(): Promise<AssignResult> {
  const result: AssignResult = {
    explorerId: null,
    reviewerId: null,
  };

  try {
    // 获取所有活跃的团队成员
    const allMembers = await prisma.teamMember.findMany({
      where: { isActive: true },
    });

    if (allMembers.length === 0) {
      console.log("⚠️ 没有活跃的团队成员，跳过分配");
      return result;
    }

    // 分组：探寻者 vs 审核者（厨师/营养师）
    const explorers = allMembers.filter((m) => m.role === "explorer");
    const reviewers = allMembers.filter((m) => m.role === "chef" || m.role === "nutritionist");

    // 1. 随机分配探寻者
    const explorer = randomPick(explorers);
    if (explorer) {
      result.explorerId = explorer.id;
      result.explorerName = explorer.nameZh;
    }

    // 2. 随机分配审核者
    const reviewer = randomPick(reviewers);
    if (reviewer) {
      result.reviewerId = reviewer.id;
      result.reviewerName = reviewer.nameZh;
    }

    console.log(
      `✅ 随机分配完成: 探寻者=${result.explorerName || "无"}, 审核者=${result.reviewerName || "无"}`
    );
  } catch (error) {
    console.error("团队成员分配失败:", error);
  }

  return result;
}
