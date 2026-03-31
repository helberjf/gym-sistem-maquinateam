import { updateOrderStatus } from "@/lib/store/orders";
import { handleRouteError, successResponse } from "@/lib/errors";
import { requireApiPermission } from "@/lib/permissions";
import {
  adminLimiter,
  attachRateLimitHeaders,
  enforceRateLimit,
} from "@/lib/rate-limit";
import { parseJsonBody, updateOrderStatusSchema } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("manageStoreOrders");
    const { id } = await context.params;
    const input = await parseJsonBody(request, updateOrderStatusSchema);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: adminLimiter,
      keyParts: [session.user.id, "store-orders-status", id, input.status],
    });
    rateLimitHeaders = rateLimit.headers;

    const order = await updateOrderStatus(id, input, {
      userId: session.user.id,
      request,
    });

    return attachRateLimitHeaders(
      successResponse({
        orderId: order.id,
        message: "Status do pedido atualizado com sucesso.",
      }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "store orders status route",
      headers: rateLimitHeaders,
    });
  }
}
