import { getOptionalSession } from "@/lib/auth/session";
import { handleRouteError, successResponse } from "@/lib/errors";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  publicReadLimiter,
} from "@/lib/rate-limit";
import { getCartSummary } from "@/lib/store/cart";
import { getStoreWishlistSummary } from "@/lib/store/favorites";

export const runtime = "nodejs";

export async function GET(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const rateLimit = await enforceRateLimit({
      request,
      limiter: publicReadLimiter,
      keyParts: ["public-viewer"],
    });
    rateLimitHeaders = rateLimit.headers;

    const session = await getOptionalSession();
    const cart = await getCartSummary({ session });
    const wishlist = await getStoreWishlistSummary({ session });

    return attachRateLimitHeaders(
      successResponse({
        isAuthenticated: Boolean(session?.user?.id),
        cartCount: cart.itemCount,
        wishlistCount: wishlist.count,
      }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "public viewer route",
      headers: rateLimitHeaders,
    });
  }
}
