import { getViewerContextFromSession } from "@/lib/academy/access";
import { handleRouteError, successResponse } from "@/lib/errors";
import { deleteLead, getLeadById, updateLead } from "@/lib/leads/service";
import { requireApiPermission } from "@/lib/permissions";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";
import { parseJsonBody, updateLeadSchema } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("viewLeads");
    const { id } = await context.params;
    const viewer = await getViewerContextFromSession(session);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "leads-detail", id],
    });
    rateLimitHeaders = rateLimit.headers;

    const lead = await getLeadById(id, viewer);

    return attachRateLimitHeaders(successResponse({ lead }), rateLimitHeaders);
  } catch (error) {
    return handleRouteError(error, {
      source: "leads detail route",
      headers: rateLimitHeaders,
    });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("manageLeads");
    const { id } = await context.params;
    const input = await parseJsonBody(request, updateLeadSchema);
    const viewer = await getViewerContextFromSession(session);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "leads-update", id],
    });
    rateLimitHeaders = rateLimit.headers;

    const lead = await updateLead(id, input, { viewer, request });

    return attachRateLimitHeaders(
      successResponse({ lead, message: "Lead atualizado." }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "leads update route",
      headers: rateLimitHeaders,
    });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("deleteLeads");
    const { id } = await context.params;
    const viewer = await getViewerContextFromSession(session);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "leads-delete", id],
    });
    rateLimitHeaders = rateLimit.headers;

    const result = await deleteLead(id, { viewer, request });

    return attachRateLimitHeaders(
      successResponse({ ...result, message: "Lead removido." }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "leads delete route",
      headers: rateLimitHeaders,
    });
  }
}
