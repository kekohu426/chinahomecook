import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

// GET - 获取当前用户的收藏列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 查找或创建用户
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || "",
          passwordHash: "", // OAuth用户不需要密码
          role: "user",
        },
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const recipeId = searchParams.get("recipeId");

    // 如果传入recipeId，检查是否已收藏
    if (recipeId) {
      const favorite = await prisma.userFavorite.findUnique({
        where: {
          userId_recipeId: {
            userId: user.id,
            recipeId,
          },
        },
      });
      return NextResponse.json({
        success: true,
        isFavorited: !!favorite,
      });
    }

    // 获取收藏列表
    const favorites = await prisma.userFavorite.findMany({
      where: { userId: user.id },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            summary: true,
            cuisine: { select: { name: true } },
            location: { select: { name: true } },
            aiGenerated: true,
            translations: {
              select: {
                locale: true,
                title: true,
                slug: true,
                summary: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: favorites.map((f) => ({
        id: f.id,
        recipeId: f.recipeId,
        createdAt: f.createdAt,
        recipe: f.recipe,
      })),
    });
  } catch (error) {
    console.error("获取收藏失败:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get favorites" },
      { status: 500 }
    );
  }
}

// POST - 添加收藏
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recipeId } = body;

    if (!recipeId) {
      return NextResponse.json(
        { success: false, error: "recipeId is required" },
        { status: 400 }
      );
    }

    // 查找或创建用户
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || "",
          passwordHash: "",
          role: "user",
        },
      });
    }

    // 检查食谱是否存在
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: "Recipe not found" },
        { status: 404 }
      );
    }

    // 创建收藏（如果已存在会因为unique约束失败）
    const favorite = await prisma.userFavorite.upsert({
      where: {
        userId_recipeId: {
          userId: user.id,
          recipeId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        recipeId,
      },
    });

    return NextResponse.json({
      success: true,
      data: favorite,
    });
  } catch (error) {
    console.error("添加收藏失败:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

// DELETE - 取消收藏
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recipeId } = body;

    if (!recipeId) {
      return NextResponse.json(
        { success: false, error: "recipeId is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    await prisma.userFavorite.deleteMany({
      where: {
        userId: user.id,
        recipeId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("取消收藏失败:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
