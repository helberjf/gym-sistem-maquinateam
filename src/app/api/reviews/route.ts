import { ReviewTargetType } from "@prisma/client";
import { getViewerContextFromSession } from "@/lib/academy/access";
import { handleRouteError, successResponse } from "@/lib/errors";
import { requireApiPermission } from "@/lib/permissions";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
  publicReadLimiter,
} from "@/lib/rate-limit";
import {
  createReview,
  listForModeration,
  listPublicReviews,
} from "@/lib/reviews/service";
import {
  createReviewSchema,
  parseJsonBody,
  parseSearchParams,
  reviewFiltersSchema,
} from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const url = new URL(request.url);
    const filters = parseSearchParams(url.searchParams, reviewFiltersSchema);

    // Public read mode: targetType + targetId only -> APPROVED reviews
    const isPublicQuery =
      filters.targetType !== undefined &&
      filters.targetId !== undefined &&
      filters.status === undefined;

    if (isPublicQuery) {
      const rateLimit = await enforceRateLimit({
        request,
        limiter: publicReadLimiter,
        keyParts: ["reviews-public", filters.targetType, filters.targetId],
      });
      rateLimitHeaders = rateLimit.headers;

      const result = await listPublicReviews(
        filters.targetType as ReviewTargetType,
        filters.targetId as string,
        filters.page,
        filters.pageSize,
      );
      return attachRateLimitHeaders(successResponse(result), rateLimitHeaders);
    }

    // Moderation queue (admin/recepcao)
    const session = await requireApiPermission("viewReviewModeration");
    const viewer = await getViewerContextFromSession(session);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "reviews-moderation-list"],
    });
    rateLimitHeaders = rateLimit.headers;

    const result = await listForModeration(filters, viewer);
    return attachRateLimitHeaders(successResponse(result), rateLimitHeaders);
  } catch (error) {
    return handleRouteError(error, {
      source: "reviews list route",
      headers: rateLimitHeaders,
    });
  }
}

export async function POST(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("createReview");
    const input = await parseJsonBody(request, createReviewSchema);
    const viewer = await getViewerContextFromSession(session);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "reviews-create"],
    });
    rateLimitHeaders = rateLimit.headers;

    const created = await createReview(input, { viewer, request });

    return attachRateLimitHeaders(
      successResponse(
        { reviewId: created.id, review: created, message: "Avaliacao registrada." },
        { status: 201 },
      ),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "reviews create route",
      headers: rateLimitHeaders,
    });
  }
}
