import { prisma } from "@/lib/db/prisma";
import {
  DEFAULT_BROWSE_ITEMS_EN,
  DEFAULT_BROWSE_ITEMS_ZH,
  DEFAULT_TESTIMONIALS_EN,
  DEFAULT_TESTIMONIALS_ZH,
} from "@/lib/home/defaults";

type BrowseType = "REGION" | "CUISINE" | "INGREDIENT" | "SCENE";

const ALL_TYPES: BrowseType[] = ["REGION", "CUISINE", "INGREDIENT", "SCENE"];

async function createBrowseItem(params: {
  type: BrowseType;
  name: string;
  description?: string | null;
  href: string;
  sortOrder: number;
  en?: { name: string; description?: string | null };
}) {
  const created = await prisma.homeBrowseItem.create({
    data: {
      type: params.type,
      name: params.name,
      description: params.description || null,
      href: params.href,
      sortOrder: params.sortOrder,
      isActive: true,
    },
  });

  if (params.en) {
    await prisma.homeBrowseItemTranslation.create({
      data: {
        itemId: created.id,
        locale: "en",
        name: params.en.name,
        description: params.en.description || null,
      },
    });
  }
}

export async function seedHomeBrowseItems() {
  const typeCounts = await prisma.homeBrowseItem.groupBy({
    by: ["type"],
    _count: { _all: true },
  });

  const existingTypes = new Set(
    typeCounts
      .map((item) => item.type as BrowseType)
      .filter((type) => ALL_TYPES.includes(type))
  );
  const missingTypes = ALL_TYPES.filter((type) => !existingTypes.has(type));
  if (missingTypes.length === 0) return;

  const seedFromDefaults = async (type: BrowseType) => {
    const zhItems = DEFAULT_BROWSE_ITEMS_ZH[type] || [];
    const enItems = DEFAULT_BROWSE_ITEMS_EN[type] || [];
    for (const [index, item] of zhItems.entries()) {
      const href =
        type === "REGION"
          ? `/recipe/region/${encodeURIComponent(item.slug)}`
          : type === "CUISINE"
          ? `/recipe/cuisine/${encodeURIComponent(item.slug)}`
          : type === "SCENE"
          ? `/recipe/scene/${encodeURIComponent(item.slug)}`
          : `/recipe/ingredient/${encodeURIComponent(item.slug)}`;

      const enItem = enItems[index];
      await createBrowseItem({
        type,
        name: item.name,
        description: item.description,
        href,
        sortOrder: index,
        en: enItem
          ? { name: enItem.name, description: enItem.description }
          : undefined,
      });
    }
  };

  for (const type of missingTypes) {
    if (type === "REGION") {
      const locations = await prisma.location.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: { translations: { where: { locale: "en" } } },
        take: 12,
      });

      if (locations.length === 0) {
        await seedFromDefaults(type);
        continue;
      }

      for (const [index, location] of locations.entries()) {
        const en = location.translations[0];
        await createBrowseItem({
          type,
          name: location.name,
          description: location.description,
          href: `/recipe/region/${encodeURIComponent(location.slug)}`,
          sortOrder: location.sortOrder ?? index,
          en: en ? { name: en.name, description: en.description } : undefined,
        });
      }
      continue;
    }

    if (type === "CUISINE") {
      const cuisines = await prisma.cuisine.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: { translations: { where: { locale: "en" } } },
        take: 12,
      });

      if (cuisines.length === 0) {
        await seedFromDefaults(type);
        continue;
      }

      for (const [index, cuisine] of cuisines.entries()) {
        const en = cuisine.translations[0];
        await createBrowseItem({
          type,
          name: cuisine.name,
          description: cuisine.description,
          href: `/recipe/cuisine/${encodeURIComponent(cuisine.slug)}`,
          sortOrder: cuisine.sortOrder ?? index,
          en: en ? { name: en.name, description: en.description } : undefined,
        });
      }
      continue;
    }

    if (type === "SCENE") {
      const scenes = await prisma.tag.findMany({
        where: { type: "scene", isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: { translations: { where: { locale: "en" } } },
        take: 12,
      });

      if (scenes.length === 0) {
        await seedFromDefaults(type);
        continue;
      }

      for (const [index, scene] of scenes.entries()) {
        const en = scene.translations[0];
        await createBrowseItem({
          type,
          name: scene.name,
          description: null,
          href: `/recipe/scene/${encodeURIComponent(scene.slug)}`,
          sortOrder: scene.sortOrder ?? index,
          en: en ? { name: en.name, description: null } : undefined,
        });
      }
      continue;
    }

    const ingredients = await prisma.tag.findMany({
      where: { type: "ingredient", isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { translations: { where: { locale: "en" } } },
      take: 12,
    });

    if (ingredients.length === 0) {
      await seedFromDefaults(type);
      continue;
    }

    for (const [index, ingredient] of ingredients.entries()) {
      const en = ingredient.translations[0];
      await createBrowseItem({
        type,
        name: ingredient.name,
        description: null,
        href: `/recipe/ingredient/${encodeURIComponent(ingredient.slug)}`,
        sortOrder: ingredient.sortOrder ?? index,
        en: en ? { name: en.name, description: null } : undefined,
      });
    }
  }
}

export async function seedHomeTestimonials() {
  const count = await prisma.homeTestimonial.count();
  if (count > 0) return;

  for (const [index, item] of DEFAULT_TESTIMONIALS_ZH.entries()) {
    const created = await prisma.homeTestimonial.create({
      data: {
        name: item.name,
        role: item.role,
        city: item.city,
        content: item.content,
        meta: item.meta,
        avatarUrl: item.avatarUrl,
        sortOrder: index,
        isActive: true,
      },
    });

    const enItem = DEFAULT_TESTIMONIALS_EN[index];
    if (enItem) {
      await prisma.homeTestimonialTranslation.create({
        data: {
          testimonialId: created.id,
          locale: "en",
          name: enItem.name,
          role: enItem.role,
          city: enItem.city,
          content: enItem.content,
          meta: enItem.meta,
        },
      });
    }
  }
}

export async function seedHomeThemes() {
  const count = await prisma.homeThemeCard.count();
  if (count > 0) return;

  const featuredThemes = await prisma.collection.findMany({
    where: { type: "theme", status: "published", isFeatured: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const sourceThemes =
    featuredThemes.length > 0
      ? featuredThemes
      : await prisma.collection.findMany({
          where: { type: "theme", status: "published" },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        });

  if (sourceThemes.length === 0) return;

  for (const [index, theme] of sourceThemes.entries()) {
    const created = await prisma.homeThemeCard.create({
      data: {
        title: theme.name,
        imageUrl: theme.coverImage || "",
        tag: theme.slug,
        href: theme.path,
        sortOrder: theme.sortOrder ?? index,
        isActive: true,
      },
    });

    if (theme.nameEn) {
      await prisma.homeThemeCardTranslation.create({
        data: {
          cardId: created.id,
          locale: "en",
          title: theme.nameEn,
        },
      });
    }
  }
}
