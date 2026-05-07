import { ReviewTargetType } from "@prisma/client";
import { handleRouteError, successResponse } from "@/lib/errors";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  publicReadLimiter,
} from "@/lib/rate-limit";
import { getReviewSummary } from "@/lib/reviews/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const url = new URL(request.url);
    const targetType = url.searchParams.get("targetType");
    const targetId = url.searchParams.get("targetId");

    if (
      !targetType ||
      !Object.values(ReviewTargetType).includes(targetType as ReviewTargetType) ||
      !targetId
    ) {
      return Response.json(
        { ok: false, error: "Parametros targetType/targetId obrigatorios." },
        { status: 400 },
      );
    }

    const rateLimit = await enforceRateLimit({
      request,
      limiter: publicReadLimiter,
      keyParts: ["reviews-summary", targetType, targetId],
    });
    rateLimitHeaders = rateLimit.headers;

    const summary = await getReviewSummary(
      targetType as ReviewTargetType,
      targetId,
    );

    return attachRateLimitHeaders(successResponse(summary), rateLimitHeaders);
  } catch (error) {
    return handleRouteError(error, {
      source: "reviews summary route",
      headers: rateLimitHeaders,
    });
  }
}
