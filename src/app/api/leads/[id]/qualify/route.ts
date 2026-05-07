import { getViewerContextFromSession } from "@/lib/academy/access";
import { handleRouteError, successResponse } from "@/lib/errors";
import { qualifyLead } from "@/lib/leads/service";
import { requireApiPermission } from "@/lib/permissions";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";
import { parseJsonBody, qualifyLeadSchema } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("manageLeads");
    const { id } = await context.params;
    const input = await parseJsonBody(request, qualifyLeadSchema);
    const viewer = await getViewerContextFromSession(session);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "leads-qualify", id],
    });
    rateLimitHeaders = rateLimit.headers;

    const lead = await qualifyLead(id, input, { viewer, request });

    return attachRateLimitHeaders(
      successResponse({ lead, message: "Lead atualizado no pipeline." }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "leads qualify route",
      headers: rateLimitHeaders,
    });
  }
}
