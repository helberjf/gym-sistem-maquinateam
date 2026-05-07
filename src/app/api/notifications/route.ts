import { auth } from "@/auth";
import { handleRouteError, successResponse, UnauthorizedError } from "@/lib/errors";
import { listNotifications } from "@/lib/notifications/inbox";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await auth();
    if (!session?.user?.id || session.user.isActive === false) {
      throw new UnauthorizedError("Nao autorizado.");
    }

    const url = new URL(request.url);
    const status = (url.searchParams.get("status") ?? "all") as
      | "all"
      | "unread"
      | "archived";
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Math.min(
      Number(url.searchParams.get("pageSize") ?? "25"),
      100,
    );

    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "notifications-list"],
    });
    rateLimitHeaders = rateLimit.headers;

    const result = await listNotifications({
      userId: session.user.id,
      status,
      page,
      pageSize,
    });

    return attachRateLimitHeaders(successResponse(result), rateLimitHeaders);
  } catch (error) {
    return handleRouteError(error, {
      source: "notifications list route",
      headers: rateLimitHeaders,
    });
  }
}
