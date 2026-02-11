/**
 * 鍗曚釜鍚堥泦 API
 *
 * GET    /api/admin/collections/[id] - 鑾峰彇鍚堥泦璇︽儏锛堝疄鏃剁粺璁★級
 * PUT    /api/admin/collections/[id] - 鏇存柊鍚堥泦
 * DELETE /api/admin/collections/[id] - 鍒犻櫎鍚堥泦
 *
 * 鏍稿績鍙ｅ緞锛? * 1. 杈炬爣锛歱ublishedCount >= minRequired锛坧ending 涓嶈鍏ワ級
 * 2. 杩涘害锛歱rogress = publishedCount / targetCount * 100
 * 3. 璇︽儏椤典娇鐢ㄥ疄鏃惰绠楃粺璁? */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import {
  calculateProgress,
  calculateQualifiedStatus,
  CollectionTypePath,
} from "@/lib/types/collection";
import { buildRuleWhereClause, validateRuleConfig } from "@/lib/collection/rule-engine";
import type { RuleConfig } from "@/lib/types/collection";
import type {
  CollectionDetail,
  UpdateCollectionRequest,
  ApiResponse,
  ApiError,
} from "@/lib/types/collection-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * 瀹炴椂璁＄畻鍚堥泦鍖归厤鐨勯璋辨暟閲? * 鍙ｅ緞锛氭牴鎹鍒欏尮閰嶏紝鎺掗櫎 excludedRecipeIds
 */
async function countMatchedRecipesRealtime(collection: {
  id: string;
  ruleType: string;
  rules: unknown;
  cuisineId: string | null;
  locationId: string | null;
  tagId: string | null;
  excludedRecipeIds: string[];
  pinnedRecipeIds: string[];
}): Promise<{ matched: number; published: number; pending: number; draft: number }> {
  // 浣跨敤瑙勫垯寮曟搸鏋勫缓鏌ヨ鏉′欢
  const baseWhere = buildRuleWhereClause(collection.rules as RuleConfig, {
    cuisineId: collection.cuisineId,
    locationId: collection.locationId,
    tagId: collection.tagId,
    excludedRecipeIds: collection.excludedRecipeIds,
  });

  const pinnedIds = collection.pinnedRecipeIds || [];
  const excludedIds = collection.excludedRecipeIds || [];
  const matchWhere =
    pinnedIds.length > 0
      ? {
          AND: [
            { OR: [baseWhere, { id: { in: pinnedIds } }] },
            excludedIds.length > 0 ? { id: { notIn: excludedIds } } : {},
          ],
        }
      : baseWhere;

  // 鍒嗗埆缁熻鍚勭姸鎬佹暟閲?

  const [published, pending, draft] = await Promise.all([
    prisma.recipe.count({ where: { AND: [matchWhere, { status: "published" }] } }),
    prisma.recipe.count({ where: { AND: [matchWhere, { status: "pending" }] } }),
    prisma.recipe.count({ where: { AND: [matchWhere, { status: "draft" }] } }),
  ]);

  return {
    matched: published + pending + draft,
    published,
    pending,
    draft,
  };
}

/**
 * GET /api/admin/collections/[id]
 * 鑾峰彇鍚堥泦璇︽儏锛堜娇鐢ㄥ疄鏃剁粺璁★級
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // 鏉冮檺妫€鏌?
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "闇€瑕佺鐞嗗憳鏉冮檺" },
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        cuisine: true,
        location: true,
        tag: true,
      },
    });

    if (!collection) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Collection not found" },
        },
        { status: 404 }
      );
    }

    // 瀹炴椂璁＄畻缁熻鏁版嵁

    const counts = await countMatchedRecipesRealtime({
      id: collection.id,
      ruleType: collection.ruleType,
      rules: collection.rules,
      cuisineId: collection.cuisineId,
      locationId: collection.locationId,
      tagId: collection.tagId,
      excludedRecipeIds: collection.excludedRecipeIds,
      pinnedRecipeIds: collection.pinnedRecipeIds,
    });

    // 鑾峰彇宸插姞鍏ョ殑椋熻氨鍒楄〃锛堥檺鍒?00涓紝閬垮厤杩囧ぇ锛?

    const baseWhere = buildRuleWhereClause(collection.rules as RuleConfig, {
      cuisineId: collection.cuisineId,
      locationId: collection.locationId,
      tagId: collection.tagId,
      excludedRecipeIds: collection.excludedRecipeIds,
    });

    const pinnedIds = collection.pinnedRecipeIds || [];
    const excludedIds = collection.excludedRecipeIds || [];
    const matchWhere =
      pinnedIds.length > 0
        ? {
            AND: [
              { OR: [baseWhere, { id: { in: pinnedIds } }] },
              excludedIds.length > 0 ? { id: { notIn: excludedIds } } : {},
            ],
          }
        : baseWhere;

    const recipes = await prisma.recipe.findMany({
      where: matchWhere,
      select: {
        id: true,
        title: true,
        status: true,
      },
      take: 100,
      orderBy: [
        { status: "desc" }, // published first
        { createdAt: "desc" },
      ],
    });

    // 鍒ゆ柇姣忎釜椋熻氨鐨勫姞鍏ユ柟寮?

    const recipesWithMethod = recipes.map((r) => {
      let addMethod: "rule" | "manual" | "ai" = "rule";

      // 濡傛灉鍦?pinnedRecipeIds 涓紝璇存槑鏄墜鍔ㄦ坊鍔犳垨 AI 鐢熸垚

      if (pinnedIds.includes(r.id)) {
        // TODO: 鏈潵鍙互閫氳繃 Recipe 琛ㄧ殑瀛楁鍒ゆ柇鏄惁涓?AI 鐢熸垚
        // 鏆傛椂缁熶竴鏍囪涓烘墜鍔ㄦ坊鍔?
        addMethod = "manual";
      }

      return {
        id: r.id,
        title: r.title,
        status: r.status,
        addMethod,
      };
    });

    // 鑾峰彇鍏宠仈瀹炰綋鍚嶇О

    let linkedEntityName: string | undefined;
    let linkedEntityType: string | undefined;
    if (collection.cuisine) {
      linkedEntityName = collection.cuisine.name;
      linkedEntityType = "cuisine";
    } else if (collection.location) {
      linkedEntityName = collection.location.name;
      linkedEntityType = "location";
    } else if (collection.tag) {
      linkedEntityName = collection.tag.name;
      linkedEntityType = "tag";
    }

    // 鏋勫缓鍝嶅簲

    const detail: CollectionDetail = {
      id: collection.id,
      type: collection.type,
      name: collection.name,
      nameEn: collection.nameEn,
      slug: collection.slug,
      path: collection.path,
      status: collection.status,
      coverImage: collection.coverImage,
      description: collection.description,
      descriptionEn: collection.descriptionEn,
      ruleType: collection.ruleType as "auto" | "custom",
      rules: collection.rules as any,
      seo: collection.seo as any,
      pinnedRecipeIds: collection.pinnedRecipeIds,
      excludedRecipeIds: collection.excludedRecipeIds,
      minRequired: collection.minRequired,
      targetCount: collection.targetCount,
      sortOrder: collection.sortOrder,
      isFeatured: collection.isFeatured,
      publishedAt: collection.publishedAt?.toISOString() || null,
      transStatus: collection.transStatus as Record<string, string>,
      cuisineId: collection.cuisineId,
      locationId: collection.locationId,
      tagId: collection.tagId,
      linkedEntityName,
      linkedEntityType,
      // 瀹炴椂缁熻
      matchedCount: counts.matched,
      publishedCount: counts.published,
      pendingCount: counts.pending,
      draftCount: counts.draft,
      // 璁＄畻瀛楁
      progress: calculateProgress(counts.published, collection.targetCount),
      qualifiedStatus: calculateQualifiedStatus(
        counts.published,
        collection.minRequired,
        collection.targetCount
      ),
      // 宸插姞鍏ョ殑椋熻氨鍒楄〃
      recipes: recipesWithMethod,
      createdAt: collection.createdAt.toISOString(),
      updatedAt: collection.updatedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<CollectionDetail>>({
      success: true,
      data: detail,
    });
  } catch (error) {
    console.error("鑾峰彇鍚堥泦璇︽儏澶辫触:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "鑾峰彇鍚堥泦璇︽儏澶辫触" },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/collections/[id]
 * 鏇存柊鍚堥泦鍩烘湰淇℃伅
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // 鏉冮檺妫€鏌?
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "闇€瑕佺鐞嗗憳鏉冮檺" },
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body: UpdateCollectionRequest = await request.json();

    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Collection not found" },
        },
        { status: 404 }
      );
    }
    const updateData: any = {};

    // 鍙洿鏂板瓧娈?

    if (body.name !== undefined) updateData.name = body.name;
    if (body.nameEn !== undefined) updateData.nameEn = body.nameEn;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.descriptionEn !== undefined) updateData.descriptionEn = body.descriptionEn;
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.minRequired !== undefined) updateData.minRequired = body.minRequired;
    if (body.targetCount !== undefined) updateData.targetCount = body.targetCount;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
    if (body.seo !== undefined) {
      // 鍚堝苟鐜版湁 SEO 閰嶇疆鍜屾柊閰嶇疆
      const existingSeo = (existing.seo as Record<string, unknown>) || {};
      updateData.seo = { ...existingSeo, ...body.seo };
    }

    if (body.rules !== undefined || body.ruleType !== undefined) {
      const rules = body.rules ?? existing.rules;
      const validation = validateRuleConfig(rules as RuleConfig);
      if (!validation.valid) {
        return NextResponse.json<ApiError>(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "瑙勫垯閰嶇疆鏃犳晥",
              details: { rules: validation.errors },
            },
          },
          { status: 400 }
        );
      }

      updateData.ruleType = body.ruleType ?? existing.ruleType;
      updateData.rules = rules;
    }

    // 濡傛灉淇敼浜?slug锛岄渶瑕佸悓姝ユ洿鏂?path

    if (body.slug !== undefined && body.slug !== existing.slug) {
      // 妫€鏌ユ柊 slug 鏄惁宸插瓨鍦?
      const slugExists = await prisma.collection.findFirst({
        where: { slug: body.slug, NOT: { id } },
      });
      if (slugExists) {
        return NextResponse.json<ApiError>(
          {
            success: false,
            error: {
              code: "CONFLICT",
              message: "Slug already exists",
              details: { slug: ["This slug is already in use"] },
            },
          },
          { status: 409 }
        );
      }

      updateData.slug = body.slug;
      const typePath =
        CollectionTypePath[existing.type as keyof typeof CollectionTypePath] ||
        `/recipe/${existing.type}`;
      updateData.path = `${typePath}/${body.slug}`;
    }

    const updated = await prisma.collection.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json<ApiResponse<{ id: string; slug: string }>>({
      success: true,
      data: { id: updated.id, slug: updated.slug },
    });
  } catch (error) {
    console.error("鏇存柊鍚堥泦澶辫触:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "鏇存柊鍚堥泦澶辫触" },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/collections/[id]
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // 鏉冮檺妫€鏌?
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "闇€瑕佺鐞嗗憳鏉冮檺" },
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: { _count: { select: { recipes: true } } },
    });

    if (!collection) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Collection not found" },
        },
        { status: 404 }
      );
    }

    // 妫€鏌ユ槸鍚︽湁鍏宠仈鐨勯璋?

    if (collection._count.recipes > 0) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `Cannot delete collection: linked to ${collection._count.recipes} recipes`,
          },
        },
        { status: 400 }
      );
    }

    await prisma.collection.delete({ where: { id } });

    return NextResponse.json<ApiResponse<{ message: string }>>({
      success: true,
      data: { message: "鍒犻櫎鎴愬姛" },
    });
  } catch (error) {
    console.error("鍒犻櫎鍚堥泦澶辫触:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "鍒犻櫎澶辫触" },
      },
      { status: 500 }
    );
  }
}




