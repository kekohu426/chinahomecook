/**
 * Collections 鍒楄〃 API
 *
 * GET  /api/admin/collections - 鑾峰彇闆嗗悎鍒楄〃
 * POST /api/admin/collections - 鍒涘缓闆嗗悎
 *
 * 鏍稿績鍙ｅ緞锛? * 1. 杈炬爣锛歱ublishedCount >= minRequired锛坧ending 涓嶈鍏ワ級
 * 2. 杩涘害锛歱rogress = publishedCount / targetCount * 100
 * 3. 鍒楄〃浣跨敤缂撳瓨瀛楁 cached*
 * 4. 瑙勫垯浼樺厛绾э細缁勯棿 AND 鈫?缁勫唴 logic 鈫?NOT锛涚┖缁?绌烘潯浠跺拷鐣? */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import {
  calculateProgress,
  calculateQualifiedStatus,
  CollectionTypePath,
} from "@/lib/types/collection";
import type {
  CollectionListParams,
  CollectionListItem,
  CreateCollectionRequest,
  ApiResponse,
  ApiError,
} from "@/lib/types/collection-api";

// 鐢熸垚 slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s]+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "")
    .slice(0, 50);
}

const AUTO_TYPES = [
  "cuisine",
  "region",
  "scene",
  "method",
  "taste",
  "crowd",
  "occasion",
  "ingredient",
];

async function getUniqueSlug(base: string, used: Set<string>, type: string): Promise<string> {
  if (!used.has(base)) return base;
  const typed = `${base}-${type}`;
  if (!used.has(typed)) return typed;
  let counter = 2;
  while (used.has(`${typed}-${counter}`)) {
    counter += 1;
  }
  return `${typed}-${counter}`;
}

async function createCollectionSafe(data: Parameters<typeof prisma.collection.create>[0]["data"]) {
  try {
    await prisma.collection.create({ data });
  } catch (error) {
    console.warn("鑷姩鍚屾鍚堥泦澶辫触锛堝拷鐣ワ級:", error);
  }
}

async function autoSyncCollections(): Promise<void> {
  const existing = await prisma.collection.findMany({
    where: { type: { in: AUTO_TYPES } },
    select: {
      id: true,
      type: true,
      slug: true,
      cuisineId: true,
      locationId: true,
      tagId: true,
    },
  });

  const usedSlugs = new Set(existing.map((item) => item.slug));
  const existingCuisineIds = new Set(
    existing.filter((item) => item.cuisineId).map((item) => item.cuisineId as string)
  );
  const existingLocationIds = new Set(
    existing.filter((item) => item.locationId).map((item) => item.locationId as string)
  );
  const existingTagIds = new Set(
    existing.filter((item) => item.tagId).map((item) => item.tagId as string)
  );

  const [cuisines, locations, tags] = await Promise.all([
    prisma.cuisine.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, sortOrder: true },
    }),
    prisma.location.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, sortOrder: true },
    }),
    prisma.tag.findMany({
      where: { isActive: true, type: { in: AUTO_TYPES.filter((t) => t !== "region" && t !== "cuisine") } },
      select: { id: true, name: true, slug: true, type: true, sortOrder: true },
    }),
  ]);

  for (const cuisine of cuisines) {
    if (existingCuisineIds.has(cuisine.id)) continue;
    const baseSlug = cuisine.slug || generateSlug(cuisine.name);
    const slug = await getUniqueSlug(baseSlug, usedSlugs, "cuisine");
    usedSlugs.add(slug);
    const path = `${CollectionTypePath.cuisine}/${slug}`;
    await createCollectionSafe({
      type: "cuisine",
      name: cuisine.name,
      slug,
      path,
      ruleType: "auto",
      rules: { mode: "auto", field: "cuisineId", value: cuisine.id },
      sortOrder: cuisine.sortOrder || 0,
      cuisineId: cuisine.id,
    });
  }

  for (const location of locations) {
    if (existingLocationIds.has(location.id)) continue;
    const baseSlug = location.slug || generateSlug(location.name);
    const slug = await getUniqueSlug(baseSlug, usedSlugs, "region");
    usedSlugs.add(slug);
    const path = `${CollectionTypePath.region}/${slug}`;
    await createCollectionSafe({
      type: "region",
      name: location.name,
      slug,
      path,
      ruleType: "auto",
      rules: { mode: "auto", field: "locationId", value: location.id },
      sortOrder: location.sortOrder || 0,
      locationId: location.id,
    });
  }

  for (const tag of tags) {
    if (existingTagIds.has(tag.id)) continue;
    const baseSlug = tag.slug || generateSlug(tag.name);
    const slug = await getUniqueSlug(baseSlug, usedSlugs, tag.type);
    usedSlugs.add(slug);
    const typePath =
      CollectionTypePath[tag.type as keyof typeof CollectionTypePath] ||
      `/recipe/${tag.type}`;
    const path = `${typePath}/${slug}`;
    await createCollectionSafe({
      type: tag.type,
      name: tag.name,
      slug,
      path,
      ruleType: "auto",
      rules: { mode: "auto", field: "tagId", value: tag.id },
      sortOrder: tag.sortOrder || 0,
      tagId: tag.id,
    });
  }
}

/**
 * GET /api/admin/collections
 *
 * Query params:
 * - page: 椤电爜锛堥粯璁?1锛? * - pageSize: 姣忛〉鏁伴噺锛堥粯璁?20锛屾渶澶?100锛? * - type: 闆嗗悎绫诲瀷
 * - status: 鐘舵€?(draft/published/archived)
 * - qualified: 鏄惁杈炬爣 (true/false)
 * - search: 鎼滅储鍚嶇О/slug
 * - sortBy: 鎺掑簭瀛楁
 * - sortOrder: 鎺掑簭鏂瑰悜 (asc/desc)
 */
export async function GET(request: NextRequest) {
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

    await autoSyncCollections();

    // 瑙ｆ瀽鏌ヨ鍙傛暟

    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter"); // featured | landing
    const params: CollectionListParams = {
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: Math.min(parseInt(searchParams.get("pageSize") || "20"), 100),
      type: searchParams.get("type") || undefined,
      status: searchParams.get("status") || undefined,
      qualified:
        searchParams.get("qualified") !== null
          ? searchParams.get("qualified") === "true"
          : undefined,
      search: searchParams.get("search") || undefined,
      sortBy:
        (searchParams.get("sortBy") as CollectionListParams["sortBy"]) ||
        "updatedAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    // 鏋勫缓鏌ヨ鏉′欢

    const where: any = {};

    if (params.type) {
      where.type = params.type;
    }

    if (params.status) {
      where.status = params.status;
    }

    // 鏍规嵁 filter 鍙傛暟绛涢€?

    if (filter === "featured") {
      where.isFeatured = true;
    } else if (filter === "landing") {
      where.isFeatured = false;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { nameEn: { contains: params.search, mode: "insensitive" } },
        { slug: { contains: params.search, mode: "insensitive" } },
      ];
    }

    // 鏌ヨ鎬绘暟鍜屽垪琛?

    const collections = await prisma.collection.findMany({
      where,
      orderBy: params.sortBy
        ? { [params.sortBy]: params.sortOrder || "asc" }
        : { sortOrder: "asc" },
      select: {
        id: true,
        type: true,
        name: true,
        nameEn: true,
        slug: true,
        path: true,
        status: true,
        coverImage: true,
        sortOrder: true,
        minRequired: true,
        targetCount: true,
        cachedMatchedCount: true,
        cachedPublishedCount: true,
        cachedPendingCount: true,
        cachedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 杞崲涓哄搷搴旀牸寮忥紝璁＄畻 progress 鍜?qualifiedStatus

    let items: CollectionListItem[] = collections.map((c) => ({
      id: c.id,
      type: c.type,
      name: c.name,
      nameEn: c.nameEn,
      slug: c.slug,
      path: c.path,
      status: c.status,
      coverImage: c.coverImage,
      sortOrder: c.sortOrder,
      minRequired: c.minRequired,
      targetCount: c.targetCount,
      cachedMatchedCount: c.cachedMatchedCount,
      cachedPublishedCount: c.cachedPublishedCount,
      cachedPendingCount: c.cachedPendingCount,
      cachedAt: c.cachedAt?.toISOString() || null,
      progress: calculateProgress(c.cachedPublishedCount, c.targetCount),
      qualifiedStatus: calculateQualifiedStatus(
        c.cachedPublishedCount,
        c.minRequired,
        c.targetCount
      ),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    // 杈炬爣绛涢€夛紙鍦ㄥ唴瀛樹腑杩囨护锛屽洜涓洪渶瑕佸瓧娈甸棿姣旇緝锛?

    if (params.qualified !== undefined) {
      items = items.filter((item) =>
        params.qualified
          ? item.qualifiedStatus === "qualified"
          : item.qualifiedStatus !== "qualified"
      );
    }

    // 鍒嗛〉鍦ㄨ繃婊ゅ悗鎵ц锛屼繚璇?total/totalPages 涓庢暟鎹竴鑷?

    const page = Math.max(1, params.page || 1);
    const pageSize = params.pageSize || 20;
    const total = items.length;
    const pagedItems = items.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json<ApiResponse<CollectionListItem[]>>({
      success: true,
      data: pagedItems,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("鑾峰彇闆嗗悎鍒楄〃澶辫触:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "鑾峰彇闆嗗悎鍒楄〃澶辫触" },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/collections
 */
export async function POST(request: NextRequest) {
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

    const body: CreateCollectionRequest = await request.json();

    // 楠岃瘉蹇呭～瀛楁

    if (!body.type || !body.name) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "缂哄皯蹇呭～瀛楁",
            details: {
              type: !body.type ? ["绫诲瀷涓嶈兘涓虹┖"] : [],
              name: !body.name ? ["鍚嶇О涓嶈兘涓虹┖"] : [],
            },
          },
        },
        { status: 400 }
      );
    }

    // 鐢熸垚 slug

    const slug = body.slug || generateSlug(body.name);

    // 妫€鏌?slug 鍞竴鎬?

    const existing = await prisma.collection.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existing) {
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

    // 鐢熸垚 path

    const typePath =
      CollectionTypePath[body.type as keyof typeof CollectionTypePath] ||
      `/recipe/${body.type}`;
    const path = `${typePath}/${slug}`;

    // 纭畾瑙勫垯绫诲瀷

    const ruleType =
      body.ruleType ||
      (body.cuisineId || body.locationId || body.tagId ? "auto" : "custom");

    // 鏋勫缓瑙勫垯

    let rules = {};
    if (ruleType === "auto") {
      if (body.cuisineId) {
        rules = { mode: "auto", field: "cuisineId", value: body.cuisineId };
      } else if (body.locationId) {
        rules = { mode: "auto", field: "locationId", value: body.locationId };
      } else if (body.tagId) {
        rules = { mode: "auto", field: "tagId", value: body.tagId };
      }
    } else {
      rules = { mode: "custom", groups: [], exclude: [] };
    }

    // 瀵逛簬 cuisine 绫诲瀷锛岃嚜鍔ㄥ垱寤烘垨鍏宠仈 Cuisine

    let finalCuisineId = body.cuisineId;
    if (body.type === "cuisine" && !body.cuisineId) {
      let cuisine = await prisma.cuisine.findFirst({
        where: { OR: [{ slug }, { name: body.name }] },
      });
      if (!cuisine) {
        cuisine = await prisma.cuisine.create({
          data: {
            name: body.name,
            slug,
            description: body.description,
            isActive: true,
            sortOrder: 0,
            transStatus: {},
          },
        });
      }
      finalCuisineId = cuisine.id;
      rules = { mode: "auto", field: "cuisineId", value: cuisine.id };
    }

    // 瀵逛簬 region 绫诲瀷锛岃嚜鍔ㄥ垱寤烘垨鍏宠仈 Location

    let finalLocationId = body.locationId;
    if (body.type === "region" && !body.locationId) {
      let location = await prisma.location.findFirst({
        where: { OR: [{ slug }, { name: body.name }] },
      });
      if (!location) {
        location = await prisma.location.create({
          data: {
            name: body.name,
            slug,
            description: body.description,
            isActive: true,
            sortOrder: 0,
            transStatus: {},
          },
        });
      }
      finalLocationId = location.id;
      rules = { mode: "auto", field: "locationId", value: location.id };
    }

    // 鍒涘缓闆嗗悎

    const collection = await prisma.collection.create({
      data: {
        type: body.type,
        name: body.name,
        nameEn: body.nameEn,
        slug,
        path,
        description: body.description,
        descriptionEn: body.descriptionEn,
        coverImage: body.coverImage,
        ruleType,
        rules,
        minRequired: body.minRequired ?? 20,
        targetCount: body.targetCount ?? 60,
        sortOrder: body.sortOrder ?? 0,
        cuisineId: finalCuisineId || null,
        locationId: finalLocationId || null,
        tagId: body.tagId || null,
      },
    });

    return NextResponse.json<ApiResponse<{ id: string; slug: string }>>({
      success: true,
      data: { id: collection.id, slug: collection.slug },
    });
  } catch (error) {
    console.error("鍒涘缓闆嗗悎澶辫触:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "鍒涘缓闆嗗悎澶辫触" },
      },
      { status: 500 }
    );
  }
}




