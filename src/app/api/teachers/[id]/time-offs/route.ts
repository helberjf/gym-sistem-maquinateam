import { getViewerContextFromSession } from "@/lib/academy/access";
import { addTeacherTimeOff } from "@/lib/availability/service";
import { handleRouteError, successResponse } from "@/lib/errors";
import { requireApiPermission } from "@/lib/permissions";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";
import { parseJsonBody, teacherTimeOffSchema } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission(
      "manageOwnTeacherAvailability",
    );
    const { id } = await context.params;
    const input = await parseJsonBody(request, teacherTimeOffSchema);
    const viewer = await getViewerContextFromSession(session);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "teacher-timeoff-create", id],
    });
    rateLimitHeaders = rateLimit.headers;

    const created = await addTeacherTimeOff(
      { ...input, teacherProfileId: input.teacherProfileId ?? id },
      { viewer, request },
    );

    return attachRateLimitHeaders(
      successResponse(
        { timeOff: created, message: "Folga registrada." },
        { status: 201 },
      ),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "teacher timeoff create route",
      headers: rateLimitHeaders,
    });
  }
}
