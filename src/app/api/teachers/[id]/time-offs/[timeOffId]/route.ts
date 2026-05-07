import { getViewerContextFromSession } from "@/lib/academy/access";
import { deleteTeacherTimeOff } from "@/lib/availability/service";
import { handleRouteError, successResponse } from "@/lib/errors";
import { requireApiPermission } from "@/lib/permissions";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string; timeOffId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission(
      "manageOwnTeacherAvailability",
    );
    const { timeOffId } = await context.params;
    const viewer = await getViewerContextFromSession(session);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "teacher-timeoff-delete", timeOffId],
    });
    rateLimitHeaders = rateLimit.headers;

    const result = await deleteTeacherTimeOff(timeOffId, { viewer, request });

    return attachRateLimitHeaders(
      successResponse({ ...result, message: "Folga removida." }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "teacher timeoff delete route",
      headers: rateLimitHeaders,
    });
  }
}
