import type { Prisma } from "@prisma/client";
import { ProductStatus } from "@prisma/client";
import type { z } from "zod";
import { isLowStockProduct } from "@/lib/commerce/constants";
import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { CatalogSortValue } from "@/lib/store/constants";
import type { catalogFiltersSchema } from "@/lib/validators/store";

type CatalogFilters = z.infer<typeof catalogFiltersSchema>;

function getPublicProductWhere(filters?: Partial<CatalogFilters>): Prisma.ProductWhereInput {
  return {
    storeVisible: true,
    status: {
      not: ProductStatus.ARCHIVED,
    },
    ...(filters?.category
      ? {
          category: filters.category,
        }
      : {}),
    ...(filters?.q
      ? {
          OR: [
            {
              name: {
                contains: filters.q,
                mode: "insensitive",
              },
            },
            {
              shortDescription: {
                contains: filters.q,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: filters.q,
                mode: "insensitive",
              },
            },
            {
              category: {
                contains: filters.q,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
    ...(filters?.priceMin !== undefined || filters?.priceMax !== undefined
      ? {
          priceCents: {
            ...(filters?.priceMin !== undefined
              ? {
                  gte: filters.priceMin,
                }
              : {}),
            ...(filters?.priceMax !== undefined
              ? {
                  lte: filters.priceMax,
                }
              : {}),
          },
        }
      : {}),
  };
}

function getCatalogOrderBy(sort: CatalogSortValue): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "price_asc":
      return [{ priceCents: "asc" }, { name: "asc" }];
    case "price_desc":
      return [{ priceCents: "desc" }, { name: "asc" }];
    case "name_asc":
      return [{ name: "asc" }];
    case "featured":
    default:
      return [{ featured: "desc" }, { status: "asc" }, { createdAt: "desc" }];
  }
}

const publicProductCardSelect = {
  id: true,
  name: true,
  slug: true,
  category: true,
  shortDescription: true,
  priceCents: true,
  stockQuantity: true,
  lowStockThreshold: true,
  trackInventory: true,
  status: true,
  featured: true,
  images: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    take: 1,
    select: {
      url: true,
      altText: true,
    },
  },
} satisfies Prisma.ProductSelect;

export async function getFeaturedStoreProducts(limit = 4) {
  return prisma.product.findMany({
    where: {
      storeVisible: true,
      status: ProductStatus.ACTIVE,
      OR: [
        {
          featured: true,
        },
        {
          stockQuantity: {
            gt: 0,
          },
        },
        {
          trackInventory: false,
        },
      ],
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: publicProductCardSelect,
  });
}

export async function getStoreCatalogData(filters: CatalogFilters) {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: getPublicProductWhere(filters),
      orderBy: getCatalogOrderBy(filters.sort as CatalogSortValue),
      select: publicProductCardSelect,
    }),
    prisma.product.findMany({
      where: {
        storeVisible: true,
        status: {
          not: ProductStatus.ARCHIVED,
        },
      },
      distinct: ["category"],
      orderBy: {
        category: "asc",
      },
      select: {
        category: true,
      },
    }),
  ]);

  const filteredProducts = products.filter((product) => {
    if (filters.availability === "in_stock") {
      return !product.trackInventory || product.stockQuantity > 0;
    }

    if (filters.availability === "low_stock") {
      return isLowStockProduct({
        trackInventory: product.trackInventory,
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        status: product.status,
      });
    }

    return true;
  });

  return {
    products: filteredProducts,
    categories: categories.map((entry) => entry.category),
    summary: {
      totalProducts: filteredProducts.length,
      featuredProducts: filteredProducts.filter((product) => product.featured).length,
      inStockProducts: filteredProducts.filter(
        (product) => !product.trackInventory || product.stockQuantity > 0,
      ).length,
    },
  };
}

export async function getStoreProductDetail(slug: string) {
  const product = await prisma.product.findFirst({
    where: {
      slug,
      storeVisible: true,
      status: {
        not: ProductStatus.ARCHIVED,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      category: true,
      shortDescription: true,
      description: true,
      priceCents: true,
      status: true,
      stockQuantity: true,
      lowStockThreshold: true,
      trackInventory: true,
      featured: true,
      weightGrams: true,
      heightCm: true,
      widthCm: true,
      lengthCm: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        select: {
          id: true,
          url: true,
          altText: true,
          isPrimary: true,
        },
      },
    },
  });

  if (!product) {
    throw new NotFoundError("Produto nao encontrado.");
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      id: {
        not: product.id,
      },
      storeVisible: true,
      status: ProductStatus.ACTIVE,
      category: product.category,
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 4,
    select: publicProductCardSelect,
  });

  return {
    product,
    relatedProducts,
  };
}
