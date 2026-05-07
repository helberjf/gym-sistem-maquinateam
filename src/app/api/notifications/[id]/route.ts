import { auth } from "@/auth";
import {
  BadRequestError,
  handleRouteError,
  successResponse,
  UnauthorizedError,
} from "@/lib/errors";
import {
  archiveNotification,
  deleteNotification,
  markAsRead,
  markAsUnread,
} from "@/lib/notifications/inbox";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await auth();
    if (!session?.user?.id || session.user.isActive === false) {
      throw new UnauthorizedError("Nao autorizado.");
    }
    const { id } = await context.params;

    const body = (await request.json().catch(() => null)) as {
      action?: string;
    } | null;
    const action = body?.action ?? "read";

    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "notification-action", id],
    });
    rateLimitHeaders = rateLimit.headers;

    let notification;
    if (action === "read") {
      notification = await markAsRead(id, session.user.id);
    } else if (action === "unread") {
      notification = await markAsUnread(id, session.user.id);
    } else if (action === "archive") {
      notification = await archiveNotification(id, session.user.id);
    } else {
      throw new BadRequestError(
        "Acao invalida. Use: read, unread ou archive.",
      );
    }

    return attachRateLimitHeaders(
      successResponse({ notification }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "notifications action route",
      headers: rateLimitHeaders,
    });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await auth();
    if (!session?.user?.id || session.user.isActive === false) {
      throw new UnauthorizedError("Nao autorizado.");
    }
    const { id } = await context.params;

    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "notification-delete", id],
    });
    rateLimitHeaders = rateLimit.headers;

    const result = await deleteNotification(id, session.user.id);
    return attachRateLimitHeaders(
      successResponse(result),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "notifications delete route",
      headers: rateLimitHeaders,
    });
  }
}
