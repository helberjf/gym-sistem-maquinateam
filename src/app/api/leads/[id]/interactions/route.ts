import { getViewerContextFromSession } from "@/lib/academy/access";
import { handleRouteError, successResponse } from "@/lib/errors";
import { addLeadInteraction } from "@/lib/leads/service";
import { requireApiPermission } from "@/lib/permissions";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";
import {
  createLeadInteractionSchema,
  parseJsonBody,
} from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("manageLeads");
    const { id } = await context.params;
    const input = await parseJsonBody(request, createLeadInteractionSchema);
    const viewer = await getViewerContextFromSession(session);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "leads-interactions-create", id],
    });
    rateLimitHeaders = rateLimit.headers;

    const result = await addLeadInteraction(id, input, { viewer, request });

    return attachRateLimitHeaders(
      successResponse(
        {
          interaction: result.interaction,
          statusAdvanced: result.statusAdvanced,
          message: "Interacao registrada.",
        },
        { status: 201 },
      ),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "leads interactions create route",
      headers: rateLimitHeaders,
    });
  }
}
