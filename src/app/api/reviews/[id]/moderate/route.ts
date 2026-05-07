import { getViewerContextFromSession } from "@/lib/academy/access";
import { handleRouteError, successResponse } from "@/lib/errors";
import { requireApiPermission } from "@/lib/permissions";
import {
  adminLimiter,
  attachRateLimitHeaders,
  enforceRateLimit,
} from "@/lib/rate-limit";
import { moderateReview } from "@/lib/reviews/service";
import { moderateReviewSchema, parseJsonBody } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("moderateReviews");
    const { id } = await context.params;
    const input = await parseJsonBody(request, moderateReviewSchema);
    const viewer = await getViewerContextFromSession(session);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: adminLimiter,
      keyParts: [session.user.id, "reviews-moderate", id],
    });
    rateLimitHeaders = rateLimit.headers;

    const review = await moderateReview(id, input, { viewer, request });
    return attachRateLimitHeaders(
      successResponse({ review, message: "Avaliacao moderada." }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "reviews moderate route",
      headers: rateLimitHeaders,
    });
  }
}
