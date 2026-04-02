import { getStoreFavoriteProductIds } from "@/lib/store/favorites";
import { getStoreCatalogPageData, STORE_CATALOG_PAGE_SIZE } from "@/lib/store/catalog";
import { handleRouteError, successResponse } from "@/lib/errors";
import { parseSearchParams } from "@/lib/validators";
import { catalogPaginationSchema } from "@/lib/validators/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const input = parseSearchParams(params, catalogPaginationSchema);
    const data = await getStoreCatalogPageData(input, {
      page: input.page,
      limit: input.limit ?? STORE_CATALOG_PAGE_SIZE,
    });
    const favoriteIds = await getStoreFavoriteProductIds();

    return successResponse({
      products: data.products,
      source: data.source,
      pagination: data.pagination,
      favoriteIds,
    });
  } catch (error) {
    return handleRouteError(error, {
      source: "store public catalog route",
    });
  }
}
