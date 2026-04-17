import { getCartSnapshot } from "@/lib/store/cart";
import { handleRouteError, successResponse } from "@/lib/errors";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  publicReadLimiter,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const rateLimit = await enforceRateLimit({
      request,
      limiter: publicReadLimiter,
      keyParts: ["store-cart"],
    });
    rateLimitHeaders = rateLimit.headers;

    const cart = await getCartSnapshot();

    return attachRateLimitHeaders(
      successResponse({ cart }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "store cart get route",
      headers: rateLimitHeaders,
    });
  }
}
