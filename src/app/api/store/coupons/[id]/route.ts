import { deactivateCoupon, updateCoupon } from "@/lib/store/coupons";
import { handleRouteError, successResponse } from "@/lib/errors";
import { requireApiPermission } from "@/lib/permissions";
import {
  adminLimiter,
  attachRateLimitHeaders,
  enforceRateLimit,
} from "@/lib/rate-limit";
import { parseJsonBody, updateCouponSchema } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("manageCoupons");
    const { id } = await context.params;
    const input = await parseJsonBody(request, updateCouponSchema);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: adminLimiter,
      keyParts: [session.user.id, "store-coupons-update", id],
    });
    rateLimitHeaders = rateLimit.headers;

    const coupon = await updateCoupon(
      {
        ...input,
        id,
      },
      {
        userId: session.user.id,
        request,
      },
    );

    return attachRateLimitHeaders(
      successResponse({
        couponId: coupon.id,
        message: "Cupom atualizado com sucesso.",
      }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "store coupons update route",
      headers: rateLimitHeaders,
    });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("manageCoupons");
    const { id } = await context.params;
    const rateLimit = await enforceRateLimit({
      request,
      limiter: adminLimiter,
      keyParts: [session.user.id, "store-coupons-delete", id],
    });
    rateLimitHeaders = rateLimit.headers;

    await deactivateCoupon(id, {
      userId: session.user.id,
      request,
    });

    return attachRateLimitHeaders(
      successResponse({
        message: "Cupom desativado com sucesso.",
      }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "store coupons delete route",
      headers: rateLimitHeaders,
    });
  }
}
