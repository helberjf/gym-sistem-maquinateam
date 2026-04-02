import { getOptionalSession } from "@/lib/auth/session";
import { getShippingQuoteForActiveCart } from "@/lib/store/orders";
import { handleRouteError, successResponse } from "@/lib/errors";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";
import { parseJsonBody, shippingQuoteSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await getOptionalSession();
    const input = await parseJsonBody(request, shippingQuoteSchema);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [
        session?.user?.id ?? "guest",
        "store-shipping-quote",
        input.address.zipCode,
      ],
    });
    rateLimitHeaders = rateLimit.headers;

    const quotes = await getShippingQuoteForActiveCart({
      address: input.address,
    });

    return attachRateLimitHeaders(
      successResponse({
        quotes,
        message: "Opcoes de frete atualizadas.",
      }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "store shipping quote route",
      headers: rateLimitHeaders,
    });
  }
}
