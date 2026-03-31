import { createCoupon } from "@/lib/store/coupons";
import { handleRouteError, successResponse } from "@/lib/errors";
import { requireApiPermission } from "@/lib/permissions";
import {
  adminLimiter,
  attachRateLimitHeaders,
  enforceRateLimit,
} from "@/lib/rate-limit";
import { createCouponSchema, parseJsonBody } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("manageCoupons");
    const input = await parseJsonBody(request, createCouponSchema);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: adminLimiter,
      keyParts: [session.user.id, "store-coupons", input.code],
    });
    rateLimitHeaders = rateLimit.headers;

    const coupon = await createCoupon(input, {
      userId: session.user.id,
      request,
    });

    return attachRateLimitHeaders(
      successResponse(
        {
          couponId: coupon.id,
          message: "Cupom criado com sucesso.",
        },
        { status: 201 },
      ),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "store coupons create route",
      headers: rateLimitHeaders,
    });
  }
}
