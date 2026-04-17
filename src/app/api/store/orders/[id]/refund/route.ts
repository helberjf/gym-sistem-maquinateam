import { refundStoreOrder } from "@/lib/store/orders";
import { handleRouteError, successResponse } from "@/lib/errors";
import { requireApiPermission } from "@/lib/permissions";
import {
  adminLimiter,
  attachRateLimitHeaders,
  enforceRateLimit,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("manageStoreOrders");
    const { id } = await context.params;
    const rateLimit = await enforceRateLimit({
      request,
      limiter: adminLimiter,
      keyParts: [session.user.id, "store-orders-refund", id],
    });
    rateLimitHeaders = rateLimit.headers;

    const result = await refundStoreOrder(id, {
      userId: session.user.id,
      request,
    });

    return attachRateLimitHeaders(
      successResponse({
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        message: "Estorno processado com sucesso.",
      }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "store orders refund route",
      headers: rateLimitHeaders,
    });
  }
}
