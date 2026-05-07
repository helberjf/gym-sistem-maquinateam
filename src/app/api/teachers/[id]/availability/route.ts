import { getViewerContextFromSession } from "@/lib/academy/access";
import {
  listTeacherAvailability,
  replaceTeacherAvailability,
} from "@/lib/availability/service";
import { handleRouteError, successResponse } from "@/lib/errors";
import { requireApiPermission } from "@/lib/permissions";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";
import {
  parseJsonBody,
  replaceTeacherAvailabilitySchema,
} from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("viewTeacherAvailability");
    const { id } = await context.params;
    const viewer = await getViewerContextFromSession(session);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "teacher-availability-list", id],
    });
    rateLimitHeaders = rateLimit.headers;

    const result = await listTeacherAvailability(id, viewer);

    return attachRateLimitHeaders(successResponse(result), rateLimitHeaders);
  } catch (error) {
    return handleRouteError(error, {
      source: "teacher availability list route",
      headers: rateLimitHeaders,
    });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission(
      "manageOwnTeacherAvailability",
    );
    const { id } = await context.params;
    const input = await parseJsonBody(
      request,
      replaceTeacherAvailabilitySchema,
    );
    const viewer = await getViewerContextFromSession(session);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "teacher-availability-replace", id],
    });
    rateLimitHeaders = rateLimit.headers;

    const slots = await replaceTeacherAvailability(
      { ...input, teacherProfileId: input.teacherProfileId ?? id },
      { viewer, request },
    );

    return attachRateLimitHeaders(
      successResponse({
        slots,
        message: "Disponibilidade atualizada.",
      }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "teacher availability replace route",
      headers: rateLimitHeaders,
    });
  }
}
