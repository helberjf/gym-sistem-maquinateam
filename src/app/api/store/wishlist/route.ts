import {
  addStoreWishlistItem,
  getStoreWishlistSnapshot,
  removeStoreWishlistItem,
} from "@/lib/store/favorites";
import { handleRouteError, successResponse } from "@/lib/errors";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";
import { parseJsonBody, wishlistMutationSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET() {
  try {
    const wishlist = await getStoreWishlistSnapshot();
    return successResponse(wishlist);
  } catch (error) {
    return handleRouteError(error, {
      source: "store wishlist list route",
    });
  }
}

export async function POST(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const input = await parseJsonBody(request, wishlistMutationSchema);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: ["store-wishlist-add", input.productId],
    });
    rateLimitHeaders = rateLimit.headers;

    const summary = await addStoreWishlistItem(input.productId);

    return attachRateLimitHeaders(
      successResponse({
        summary,
        message: "Produto salvo nos favoritos.",
      }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "store wishlist add route",
      headers: rateLimitHeaders,
    });
  }
}

export async function DELETE(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const input = await parseJsonBody(request, wishlistMutationSchema);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: ["store-wishlist-remove", input.productId],
    });
    rateLimitHeaders = rateLimit.headers;

    const summary = await removeStoreWishlistItem(input.productId);

    return attachRateLimitHeaders(
      successResponse({
        summary,
        message: "Produto removido dos favoritos.",
      }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "store wishlist remove route",
      headers: rateLimitHeaders,
    });
  }
}
