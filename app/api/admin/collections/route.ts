/**
 * Collections 列表 API
 *
 * GET  /api/admin/collections - 获取集合列表
 * POST /api/admin/collections - 创建集合
 *
 * 核心口径：
 * 1. 达标：publishedCount >= minRequired（pending 不计入）
 * 2. 进度：progress = publishedCount / targetCount * 100
 * 3. 列表使用缓存字段 cached*
 * 4. 规则优先级：组间 AND → 组内 logic → NOT；空组/空条件忽略
 */

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

// 生成 slug
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
    console.warn("自动同步合集失败（忽略）:", error);
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
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 20，最大 100）
 * - type: 集合类型
 * - status: 状态 (draft/published/archived)
 * - qualified: 是否达标 (true/false)
 * - search: 搜索名称/slug
 * - sortBy: 排序字段
 * - sortOrder: 排序方向 (asc/desc)
 */
export async function GET(request: NextRequest) {
  try {
    // 权限检查
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "需要管理员权限" },
        },
        { status: 401 }
      );
    }

    await autoSyncCollections();

    // 解析查询参数
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

    // 构建查询条件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (params.type) {
      where.type = params.type;
    }

    if (params.status) {
      where.status = params.status;
    }

    // 根据 filter 参数筛选
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

    // 查询总数和列表
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

    // 转换为响应格式，计算 progress 和 qualifiedStatus
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

    // 达标筛选（在内存中过滤，因为需要字段间比较）
    if (params.qualified !== undefined) {
      items = items.filter((item) =>
        params.qualified
          ? item.qualifiedStatus === "qualified"
          : item.qualifiedStatus !== "qualified"
      );
    }

    // 分页在过滤后执行，保证 total/totalPages 与数据一致
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
    console.error("获取集合列表失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "获取集合列表失败" },
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
    // 权限检查
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "需要管理员权限" },
        },
        { status: 401 }
      );
    }

    const body: CreateCollectionRequest = await request.json();

    // 验证必填字段
    if (!body.type || !body.name) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "缺少必填字段",
            details: {
              type: !body.type ? ["类型不能为空"] : [],
              name: !body.name ? ["名称不能为空"] : [],
            },
          },
        },
        { status: 400 }
      );
    }

    // 生成 slug
    const slug = body.slug || generateSlug(body.name);

    // 检查 slug 唯一性
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
            message: "slug 已存在",
            details: { slug: ["该 slug 已被使用"] },
          },
        },
        { status: 409 }
      );
    }

    // 生成 path
    const typePath =
      CollectionTypePath[body.type as keyof typeof CollectionTypePath] ||
      `/recipe/${body.type}`;
    const path = `${typePath}/${slug}`;

    // 确定规则类型
    const ruleType =
      body.ruleType ||
      (body.cuisineId || body.locationId || body.tagId ? "auto" : "custom");

    // 构建规则
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

    // 对于 cuisine 类型，自动创建或关联 Cuisine
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

    // 对于 region 类型，自动创建或关联 Location
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

    // 创建集合
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
    console.error("创建集合失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "创建集合失败" },
      },
      { status: 500 }
    );
  }
}
