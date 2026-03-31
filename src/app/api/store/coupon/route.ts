import { auth } from "@/auth";
import { getCartSnapshot } from "@/lib/store/cart";
import { validateCouponForItems } from "@/lib/store/coupons";
import { handleRouteError, successResponse } from "@/lib/errors";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";
import { applyCouponSchema, parseJsonBody } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await auth();
    const input = await parseJsonBody(request, applyCouponSchema);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session?.user?.id ?? "guest", "store-coupon", input.code],
    });
    rateLimitHeaders = rateLimit.headers;

    const cart = await getCartSnapshot();
    const validation = await validateCouponForItems({
      code: input.code,
      userId: session?.user?.id ?? null,
      items: cart.items.map((item) => ({
        productId: item.product.id,
        category: item.product.category,
        quantity: item.quantity,
        unitPriceCents: item.product.priceCents,
      })),
    });

    if (!validation.ok) {
      return attachRateLimitHeaders(
        successResponse({
          valid: false,
          message: validation.message,
        }),
        rateLimitHeaders,
      );
    }

    return attachRateLimitHeaders(
      successResponse({
        valid: true,
        coupon: {
          id: validation.coupon.id,
          code: validation.coupon.code,
          description: validation.coupon.description,
        },
        discountCents: validation.discountCents,
        eligibleSubtotalCents: validation.eligibleSubtotalCents,
        message: "Cupom aplicado com sucesso.",
      }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "store coupon validate route",
      headers: rateLimitHeaders,
    });
  }
}
