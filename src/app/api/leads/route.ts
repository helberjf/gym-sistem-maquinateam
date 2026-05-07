import { getViewerContextFromSession } from "@/lib/academy/access";
import { handleRouteError, successResponse } from "@/lib/errors";
import { createLead, listLeads } from "@/lib/leads/service";
import { requireApiPermission } from "@/lib/permissions";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";
import {
  createLeadSchema,
  leadFiltersSchema,
  parseJsonBody,
  parseSearchParams,
} from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("viewLeads");
    const url = new URL(request.url);
    const filters = parseSearchParams(url.searchParams, leadFiltersSchema);
    const viewer = await getViewerContextFromSession(session);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "leads-list"],
    });
    rateLimitHeaders = rateLimit.headers;

    const result = await listLeads(filters, viewer);

    return attachRateLimitHeaders(successResponse(result), rateLimitHeaders);
  } catch (error) {
    return handleRouteError(error, {
      source: "leads list route",
      headers: rateLimitHeaders,
    });
  }
}

export async function POST(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const session = await requireApiPermission("manageLeads");
    const input = await parseJsonBody(request, createLeadSchema);
    const viewer = await getViewerContextFromSession(session);
    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: [session.user.id, "leads-create"],
    });
    rateLimitHeaders = rateLimit.headers;

    const created = await createLead(input, { viewer, request });

    return attachRateLimitHeaders(
      successResponse(
        {
          leadId: created.id,
          message: "Lead criado com sucesso.",
          lead: created,
        },
        { status: 201 },
      ),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "leads create route",
      headers: rateLimitHeaders,
    });
  }
}
