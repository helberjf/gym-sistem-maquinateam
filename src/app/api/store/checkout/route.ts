import { requireApiPermission } from "@/lib/permissions";
import { createOrderFromActiveCart } from "@/lib/store/orders";
import { handleRouteError, successResponse } from "@/lib/errors";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";
import { checkoutSchema, parseJsonBody } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("viewStoreOrders");
    const input = await parseJsonBody(request, checkoutSchema);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "store-checkout", input.deliveryMethod],
    });
    rateLimitHeaders = rateLimit.headers;

    const order = await createOrderFromActiveCart(input, {
      userId: session.user.id,
      request,
    });

    return attachRateLimitHeaders(
      successResponse(
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          totalCents: order.totalCents,
          message: "Pedido criado com sucesso.",
        },
        { status: 201 },
      ),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "store checkout route",
      headers: rateLimitHeaders,
    });
  }
}
