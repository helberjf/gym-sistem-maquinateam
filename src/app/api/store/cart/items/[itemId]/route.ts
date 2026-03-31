import { auth } from "@/auth";
import { removeCartItem, updateCartItemQuantity } from "@/lib/store/cart";
import { handleRouteError, successResponse } from "@/lib/errors";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";
import { parseJsonBody, updateCartItemSchema } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await auth();
    const { itemId } = await context.params;
    const input = await parseJsonBody(request, updateCartItemSchema);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session?.user?.id ?? "guest", "store-cart-update", itemId],
    });
    rateLimitHeaders = rateLimit.headers;

    const cart = await updateCartItemQuantity(itemId, input.quantity);

    return attachRateLimitHeaders(
      successResponse({
        cart,
        message: "Quantidade atualizada com sucesso.",
      }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "store cart update item route",
      headers: rateLimitHeaders,
    });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await auth();
    const { itemId } = await context.params;
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session?.user?.id ?? "guest", "store-cart-delete", itemId],
    });
    rateLimitHeaders = rateLimit.headers;

    const cart = await removeCartItem(itemId);

    return attachRateLimitHeaders(
      successResponse({
        cart,
        message: "Item removido do carrinho.",
      }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "store cart delete item route",
      headers: rateLimitHeaders,
    });
  }
}
