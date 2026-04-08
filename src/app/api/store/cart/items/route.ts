import { getOptionalSession } from "@/lib/auth/session";
import { addCartItem } from "@/lib/store/cart";
import { handleRouteError, successResponse } from "@/lib/errors";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";
import { cartItemMutationSchema, parseJsonBody } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await getOptionalSession();
    const input = await parseJsonBody(request, cartItemMutationSchema);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session?.user?.id ?? "guest", "store-cart", input.productId],
    });
    rateLimitHeaders = rateLimit.headers;

    const cart = await addCartItem(input);

    return attachRateLimitHeaders(
      successResponse(
        {
          cart,
          message: "Produto adicionado ao carrinho.",
        },
        { status: 201 },
      ),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "store cart add item route",
      headers: rateLimitHeaders,
    });
  }
}
