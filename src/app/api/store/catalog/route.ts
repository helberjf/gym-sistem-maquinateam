import { getStoreFavoriteProductIds } from "@/lib/store/favorites";
import { getStoreCatalogPageData, STORE_CATALOG_PAGE_SIZE } from "@/lib/store/catalog";
import { handleRouteError, successResponse } from "@/lib/errors";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  publicReadLimiter,
} from "@/lib/rate-limit";
import { parseSearchParams } from "@/lib/validators";
import { catalogPaginationSchema } from "@/lib/validators/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const rateLimit = await enforceRateLimit({
      request,
      limiter: publicReadLimiter,
      keyParts: ["store-catalog"],
    });
    rateLimitHeaders = rateLimit.headers;

    const params = new URL(request.url).searchParams;
    const input = parseSearchParams(params, catalogPaginationSchema);
    const data = await getStoreCatalogPageData(input, {
      page: input.page,
      limit: input.limit ?? STORE_CATALOG_PAGE_SIZE,
    });
    const favoriteIds = await getStoreFavoriteProductIds();

    return attachRateLimitHeaders(
      successResponse({
        products: data.products,
        source: data.source,
        pagination: data.pagination,
        favoriteIds,
      }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "store public catalog route",
      headers: rateLimitHeaders,
    });
  }
}
