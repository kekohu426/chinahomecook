/**
 * API 路由鉴权守卫
 *
 * 提供统一的管理员权限验证
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * 验证管理员权限
 * @returns null 表示验证通过，否则返回错误响应
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "未登录" },
      { status: 401 }
    );
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "需要管理员权限" },
      { status: 403 }
    );
  }
  return null;
}

/**
 * 验证用户已登录（不要求管理员）
 * @returns null 表示验证通过，否则返回错误响应
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "未登录" },
      { status: 401 }
    );
  }
  return null;
}
