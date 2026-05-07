import { getViewerContextFromSession } from "@/lib/academy/access";
import { handleRouteError, successResponse } from "@/lib/errors";
import { requireApiPermission } from "@/lib/permissions";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";
import { deleteOwnReview, updateOwnReview } from "@/lib/reviews/service";
import { parseJsonBody, updateOwnReviewSchema } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("createReview");
    const { id } = await context.params;
    const input = await parseJsonBody(request, updateOwnReviewSchema);
    const viewer = await getViewerContextFromSession(session);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "reviews-update", id],
    });
    rateLimitHeaders = rateLimit.headers;

    const review = await updateOwnReview(id, input, { viewer, request });
    return attachRateLimitHeaders(
      successResponse({ review, message: "Avaliacao atualizada." }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "reviews update route",
      headers: rateLimitHeaders,
    });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("createReview");
    const { id } = await context.params;
    const viewer = await getViewerContextFromSession(session);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "reviews-delete", id],
    });
    rateLimitHeaders = rateLimit.headers;

    const result = await deleteOwnReview(id, { viewer, request });
    return attachRateLimitHeaders(
      successResponse({ ...result, message: "Avaliacao removida." }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "reviews delete route",
      headers: rateLimitHeaders,
    });
  }
}
