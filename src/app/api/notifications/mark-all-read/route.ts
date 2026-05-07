import { auth } from "@/auth";
import { handleRouteError, successResponse, UnauthorizedError } from "@/lib/errors";
import { markAllAsRead } from "@/lib/notifications/inbox";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await auth();
    if (!session?.user?.id || session.user.isActive === false) {
      throw new UnauthorizedError("Nao autorizado.");
    }

    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "notifications-mark-all"],
    });
    rateLimitHeaders = rateLimit.headers;

    const result = await markAllAsRead(session.user.id);
    return attachRateLimitHeaders(successResponse(result), rateLimitHeaders);
  } catch (error) {
    return handleRouteError(error, {
      source: "notifications mark-all-read route",
      headers: rateLimitHeaders,
    });
  }
}
