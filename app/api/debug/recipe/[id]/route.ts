import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        steps: true,
        coverImage: true,
        imageShots: true,
      },
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    const steps = recipe.steps as any[];
    const imageShots = recipe.imageShots as any[];

    const stepImages = steps?.map((step, i) => ({
      index: i + 1,
      title: step.title || step.action?.substring(0, 30),
      hasImageUrl: !!step.imageUrl,
      imageUrl: step.imageUrl || null,
    })) || [];

    const coverImages = imageShots?.map((shot, i) => ({
      index: i + 1,
      key: shot.key,
      hasImageUrl: !!shot.imageUrl,
      imageUrl: shot.imageUrl || null,
    })) || [];

    return NextResponse.json({
      id: recipe.id,
      title: recipe.title,
      coverImage: recipe.coverImage,
      stepCount: steps?.length || 0,
      stepImages,
      coverImageCount: imageShots?.length || 0,
      coverImages,
    });
  } catch (error) {
    console.error("查询失败:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
