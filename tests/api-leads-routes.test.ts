import { beforeEach, describe, expect, it, vi } from "vitest";
import { LeadSource, LeadStatus, UserRole } from "@prisma/client";
import { jsonRequest, paramsContext, readJson } from "./helpers/api-route";

const mocks = vi.hoisted(() => {
  const rateLimitHeaders = new Headers({ "X-RateLimit-Limit": "99" });
  return {
    rateLimitHeaders,
    enforceRateLimit: vi.fn(async () => ({ headers: rateLimitHeaders })),
    listLeads: vi.fn(),
    createLead: vi.fn(),
    getLeadById: vi.fn(),
    updateLead: vi.fn(),
    deleteLead: vi.fn(),
    qualifyLead: vi.fn(),
    addLeadInteraction: vi.fn(),
    requireApiPermission: vi.fn(),
    getViewerContextFromSession: vi.fn(async (session: { user: { id: string; role: UserRole } }) => ({
      userId: session.user.id,
      role: session.user.role,
      studentProfileId: null,
      teacherProfileId: null,
    })),
  };
});

vi.mock("@/lib/rate-limit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rate-limit")>(
    "@/lib/rate-limit",
  );
  return {
    ...actual,
    enforceRateLimit: mocks.enforceRateLimit,
  };
});

vi.mock("@/lib/leads/service", () => ({
  listLeads: mocks.listLeads,
  createLead: mocks.createLead,
  getLeadById: mocks.getLeadById,
  updateLead: mocks.updateLead,
  deleteLead: mocks.deleteLead,
  qualifyLead: mocks.qualifyLead,
  addLeadInteraction: mocks.addLeadInteraction,
}));

vi.mock("@/lib/permissions", async () => {
  const actual = await vi.importActual<typeof import("@/lib/permissions")>(
    "@/lib/permissions",
  );
  return {
    ...actual,
    requireApiPermission: mocks.requireApiPermission,
  };
});

vi.mock("@/lib/academy/access", async () => {
  const actual = await vi.importActual<typeof import("@/lib/academy/access")>(
    "@/lib/academy/access",
  );
  return {
    ...actual,
    getViewerContextFromSession: mocks.getViewerContextFromSession,
  };
});

vi.mock("@/lib/observability/tracing", () => ({
  withTrace: async (_label: string, fn: (trace: { traceId: string }) => unknown) =>
    fn({ traceId: "trace-1" }),
  sendAlert: vi.fn(async () => undefined),
}));

import * as listRoute from "@/app/api/leads/route";
import * as detailRoute from "@/app/api/leads/[id]/route";
import * as qualifyRoute from "@/app/api/leads/[id]/qualify/route";
import * as interactionsRoute from "@/app/api/leads/[id]/interactions/route";

const adminSession = {
  user: { id: "u-admin", role: UserRole.ADMIN },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireApiPermission.mockResolvedValue(adminSession);
  mocks.enforceRateLimit.mockResolvedValue({ headers: mocks.rateLimitHeaders });
});

describe("GET /api/leads", () => {
  it("requires viewLeads permission", async () => {
    mocks.listLeads.mockResolvedValue({
      items: [],
      pagination: { page: 1, totalPages: 0, totalItems: 0 },
    });

    const request = new Request("https://example.com/api/leads?page=1");
    const response = await listRoute.GET(request);

    expect(response.status).toBe(200);
    expect(mocks.requireApiPermission).toHaveBeenCalledWith("viewLeads");
  });

  it("propagates ForbiddenError as 403", async () => {
    const { ForbiddenError } = await import("@/lib/errors");
    mocks.requireApiPermission.mockRejectedValueOnce(
      new ForbiddenError("Acesso negado."),
    );

    const response = await listRoute.GET(
      new Request("https://example.com/api/leads"),
    );
    expect(response.status).toBe(403);
  });
});

describe("POST /api/leads", () => {
  it("creates a lead with valid payload (201)", async () => {
    mocks.createLead.mockResolvedValue({ id: "lead-1", name: "Joao" });

    const response = await listRoute.POST(
      jsonRequest("https://example.com/api/leads", {
        name: "Joao",
        source: LeadSource.WEBSITE,
      }),
    );

    expect(response.status).toBe(201);
    const body = await readJson<{ ok: boolean; leadId: string }>(response);
    expect(body.leadId).toBe("lead-1");
    expect(mocks.requireApiPermission).toHaveBeenCalledWith("manageLeads");
  });

  it("rejects missing name with 400", async () => {
    const response = await listRoute.POST(
      jsonRequest("https://example.com/api/leads", {
        source: LeadSource.WEBSITE,
      }),
    );
    expect(response.status).toBe(400);
  });
});

describe("GET /api/leads/[id]", () => {
  it("returns the lead", async () => {
    mocks.getLeadById.mockResolvedValue({ id: "lead-1", name: "Joao" });

    const response = await detailRoute.GET(
      new Request("https://example.com/api/leads/lead-1"),
      paramsContext({ id: "lead-1" }),
    );

    expect(response.status).toBe(200);
    expect(mocks.getLeadById).toHaveBeenCalledWith("lead-1", expect.any(Object));
  });

  it("translates NotFoundError to 404", async () => {
    const { NotFoundError } = await import("@/lib/errors");
    mocks.getLeadById.mockRejectedValueOnce(
      new NotFoundError("Lead nao encontrado."),
    );

    const response = await detailRoute.GET(
      new Request("https://example.com/api/leads/lead-x"),
      paramsContext({ id: "lead-x" }),
    );
    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/leads/[id]", () => {
  it("updates a lead", async () => {
    mocks.updateLead.mockResolvedValue({ id: "lead-1", status: LeadStatus.QUALIFIED });

    const response = await detailRoute.PATCH(
      jsonRequest(
        "https://example.com/api/leads/lead-1",
        { status: LeadStatus.QUALIFIED },
        { method: "PATCH" },
      ),
      paramsContext({ id: "lead-1" }),
    );

    expect(response.status).toBe(200);
    expect(mocks.updateLead).toHaveBeenCalled();
  });
});

describe("DELETE /api/leads/[id]", () => {
  it("requires deleteLeads permission", async () => {
    mocks.deleteLead.mockResolvedValue({ id: "lead-1" });

    const response = await detailRoute.DELETE(
      new Request("https://example.com/api/leads/lead-1", { method: "DELETE" }),
      paramsContext({ id: "lead-1" }),
    );

    expect(response.status).toBe(200);
    expect(mocks.requireApiPermission).toHaveBeenCalledWith("deleteLeads");
  });

  it("returns 403 when ForbiddenError is thrown by permission guard", async () => {
    const { ForbiddenError } = await import("@/lib/errors");
    mocks.requireApiPermission.mockRejectedValueOnce(
      new ForbiddenError("Apenas administradores podem excluir leads."),
    );

    const response = await detailRoute.DELETE(
      new Request("https://example.com/api/leads/lead-1", { method: "DELETE" }),
      paramsContext({ id: "lead-1" }),
    );
    expect(response.status).toBe(403);
  });
});

describe("POST /api/leads/[id]/qualify", () => {
  it("advances lead", async () => {
    mocks.qualifyLead.mockResolvedValue({
      id: "lead-1",
      status: LeadStatus.CONTACTED,
    });

    const response = await qualifyRoute.POST(
      jsonRequest("https://example.com/api/leads/lead-1/qualify", {
        action: "advance",
      }),
      paramsContext({ id: "lead-1" }),
    );

    expect(response.status).toBe(200);
    expect(mocks.qualifyLead).toHaveBeenCalledWith(
      "lead-1",
      expect.objectContaining({ action: "advance" }),
      expect.any(Object),
    );
  });

  it("rejects invalid action with 400", async () => {
    const response = await qualifyRoute.POST(
      jsonRequest("https://example.com/api/leads/lead-1/qualify", {
        action: "explode",
      }),
      paramsContext({ id: "lead-1" }),
    );
    expect(response.status).toBe(400);
  });

  it("requires lostReason for action=lost", async () => {
    const response = await qualifyRoute.POST(
      jsonRequest("https://example.com/api/leads/lead-1/qualify", {
        action: "lost",
      }),
      paramsContext({ id: "lead-1" }),
    );
    expect(response.status).toBe(400);
  });
});

describe("POST /api/leads/[id]/interactions", () => {
  it("creates an interaction with default NOTE type", async () => {
    mocks.addLeadInteraction.mockResolvedValue({
      interaction: { id: "int-1" },
      statusAdvanced: true,
    });

    const response = await interactionsRoute.POST(
      jsonRequest("https://example.com/api/leads/lead-1/interactions", {
        content: "Contato via Insta",
      }),
      paramsContext({ id: "lead-1" }),
    );

    expect(response.status).toBe(201);
    expect(mocks.addLeadInteraction).toHaveBeenCalled();
  });

  it("rejects empty content with 400", async () => {
    const response = await interactionsRoute.POST(
      jsonRequest("https://example.com/api/leads/lead-1/interactions", {
        content: "",
      }),
      paramsContext({ id: "lead-1" }),
    );
    expect(response.status).toBe(400);
  });
});
