import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LeadInteractionType,
  LeadSource,
  LeadStatus,
  UserRole,
} from "@prisma/client";

const mocks = vi.hoisted(() => ({
  prisma: {
    lead: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    leadInteraction: { create: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
  logAuditEvent: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/audit", () => ({ logAuditEvent: mocks.logAuditEvent }));

import {
  addLeadInteraction,
  createLead,
  deleteLead,
  getLeadById,
  listLeads,
  qualifyLead,
  updateLead,
} from "@/lib/leads/service";

const ADMIN_VIEWER = {
  userId: "u-admin",
  role: UserRole.ADMIN,
  studentProfileId: null,
  teacherProfileId: null,
};
const RECEPCAO_VIEWER = {
  userId: "u-rec",
  role: UserRole.RECEPCAO,
  studentProfileId: null,
  teacherProfileId: null,
};
const PROFESSOR_VIEWER = {
  userId: "u-prof",
  role: UserRole.PROFESSOR,
  studentProfileId: null,
  teacherProfileId: null,
};
const ALUNO_VIEWER = {
  userId: "u-aluno",
  role: UserRole.ALUNO,
  studentProfileId: null,
  teacherProfileId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.prisma.user.findUnique.mockResolvedValue({
    id: "u-rec",
    role: UserRole.RECEPCAO,
    isActive: true,
  });
  mocks.prisma.lead.count.mockResolvedValue(0);
  mocks.prisma.lead.findMany.mockResolvedValue([]);
});

describe("listLeads — visibility", () => {
  it("ADMIN can list leads", async () => {
    await expect(
      listLeads({ page: 1, pageSize: 20 }, ADMIN_VIEWER),
    ).resolves.toBeTruthy();
    expect(mocks.prisma.lead.findMany).toHaveBeenCalled();
  });

  it("RECEPCAO can list leads", async () => {
    await expect(
      listLeads({ page: 1, pageSize: 20 }, RECEPCAO_VIEWER),
    ).resolves.toBeTruthy();
  });

  it("PROFESSOR is forbidden from listing leads", async () => {
    await expect(
      listLeads({ page: 1, pageSize: 20 }, PROFESSOR_VIEWER),
    ).rejects.toThrow(/permissao/i);
  });

  it("ALUNO is forbidden from listing leads", async () => {
    await expect(
      listLeads({ page: 1, pageSize: 20 }, ALUNO_VIEWER),
    ).rejects.toThrow(/permissao/i);
  });
});

describe("createLead", () => {
  beforeEach(() => {
    mocks.prisma.lead.create.mockResolvedValue({
      id: "lead-1",
      name: "Joao",
      assignedToId: "u-rec",
    });
  });

  it("creates lead with current user as default assignee when none is provided", async () => {
    await createLead(
      {
        name: "Joao Silva",
        source: LeadSource.WEBSITE,
      },
      { viewer: ADMIN_VIEWER },
    );

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ADMIN_VIEWER.userId },
      }),
    );
    expect(mocks.prisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assignedToId: ADMIN_VIEWER.userId,
          createdById: ADMIN_VIEWER.userId,
          name: "Joao Silva",
          source: LeadSource.WEBSITE,
        }),
      }),
    );
    expect(mocks.logAuditEvent).toHaveBeenCalled();
  });

  it("rejects creation when assignee role is PROFESSOR", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "u-prof",
      role: UserRole.PROFESSOR,
      isActive: true,
    });

    await expect(
      createLead(
        {
          name: "Joao",
          source: LeadSource.OTHER,
          assignedToId: "u-prof",
        },
        { viewer: ADMIN_VIEWER },
      ),
    ).rejects.toThrow(/admin ou recepcao/i);
  });

  it("rejects creation when PROFESSOR is the viewer (no manageLeads)", async () => {
    await expect(
      createLead(
        { name: "Joao", source: LeadSource.OTHER },
        { viewer: PROFESSOR_VIEWER },
      ),
    ).rejects.toThrow(/permissao/i);
  });

  it("rounds floating valueCents to integer (avoids Prisma P2007)", async () => {
    await createLead(
      {
        name: "Joao",
        source: LeadSource.OTHER,
        valueCents: 12999.4 as unknown as number,
      },
      { viewer: ADMIN_VIEWER },
    );
    expect(mocks.prisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ valueCents: 12999 }),
      }),
    );
  });
});

describe("qualifyLead", () => {
  it("advances NEW -> CONTACTED", async () => {
    mocks.prisma.lead.findUnique.mockResolvedValue({
      id: "lead-1",
      status: LeadStatus.NEW,
      name: "Joao",
    });
    mocks.prisma.lead.update.mockResolvedValue({
      id: "lead-1",
      status: LeadStatus.CONTACTED,
      name: "Joao",
    });

    const result = await qualifyLead(
      "lead-1",
      { action: "advance" },
      { viewer: ADMIN_VIEWER },
    );

    expect(result.status).toBe(LeadStatus.CONTACTED);
    expect(mocks.prisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: LeadStatus.CONTACTED }),
      }),
    );
  });

  it("advancing NEGOTIATION -> WON sets convertedAt", async () => {
    mocks.prisma.lead.findUnique.mockResolvedValue({
      id: "lead-1",
      status: LeadStatus.NEGOTIATION,
      name: "Joao",
    });
    mocks.prisma.lead.update.mockResolvedValue({
      id: "lead-1",
      status: LeadStatus.WON,
      name: "Joao",
    });

    await qualifyLead(
      "lead-1",
      { action: "advance" },
      { viewer: ADMIN_VIEWER },
    );

    expect(mocks.prisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: LeadStatus.WON,
          convertedAt: expect.any(Date),
        }),
      }),
    );
  });

  it("rejects advance when lead already WON", async () => {
    mocks.prisma.lead.findUnique.mockResolvedValue({
      id: "lead-1",
      status: LeadStatus.WON,
      name: "Joao",
    });
    await expect(
      qualifyLead("lead-1", { action: "advance" }, { viewer: ADMIN_VIEWER }),
    ).rejects.toThrow(/finalizado/i);
  });

  it("requires lostReason for action=lost", async () => {
    mocks.prisma.lead.findUnique.mockResolvedValue({
      id: "lead-1",
      status: LeadStatus.PROPOSAL,
      name: "Joao",
    });
    await expect(
      qualifyLead("lead-1", { action: "lost" }, { viewer: ADMIN_VIEWER }),
    ).rejects.toThrow(/motivo/i);
  });

  it("rejects reopen when lead is not LOST", async () => {
    mocks.prisma.lead.findUnique.mockResolvedValue({
      id: "lead-1",
      status: LeadStatus.NEW,
      name: "Joao",
    });
    await expect(
      qualifyLead("lead-1", { action: "reopen" }, { viewer: ADMIN_VIEWER }),
    ).rejects.toThrow(/perdidos/i);
  });
});

describe("addLeadInteraction", () => {
  it("auto-advances NEW -> CONTACTED on first interaction", async () => {
    mocks.prisma.lead.findUnique.mockResolvedValue({
      id: "lead-1",
      status: LeadStatus.NEW,
      name: "Joao",
    });
    mocks.prisma.$transaction.mockResolvedValue([
      { id: "int-1", type: LeadInteractionType.CALL },
      { id: "lead-1" },
    ]);

    const result = await addLeadInteraction(
      "lead-1",
      { type: LeadInteractionType.CALL, content: "Falamos no WhatsApp" },
      { viewer: ADMIN_VIEWER },
    );

    expect(result.statusAdvanced).toBe(true);
    expect(mocks.prisma.$transaction).toHaveBeenCalled();
  });

  it("does not advance when lead is already CONTACTED", async () => {
    mocks.prisma.lead.findUnique.mockResolvedValue({
      id: "lead-1",
      status: LeadStatus.CONTACTED,
      name: "Joao",
    });
    mocks.prisma.$transaction.mockResolvedValue([
      { id: "int-1", type: LeadInteractionType.NOTE },
    ]);

    const result = await addLeadInteraction(
      "lead-1",
      { type: LeadInteractionType.NOTE, content: "..." },
      { viewer: ADMIN_VIEWER },
    );

    expect(result.statusAdvanced).toBe(false);
  });
});

describe("deleteLead", () => {
  it("ADMIN can delete", async () => {
    mocks.prisma.lead.findUnique.mockResolvedValue({
      id: "lead-1",
      name: "Joao",
    });
    mocks.prisma.lead.delete.mockResolvedValue({ id: "lead-1" });

    await deleteLead("lead-1", { viewer: ADMIN_VIEWER });
    expect(mocks.prisma.lead.delete).toHaveBeenCalled();
  });

  it("RECEPCAO is forbidden from deleting", async () => {
    await expect(
      deleteLead("lead-1", { viewer: RECEPCAO_VIEWER }),
    ).rejects.toThrow(/administradores/i);
  });
});

describe("getLeadById", () => {
  it("returns 404-equivalent error when lead is missing", async () => {
    mocks.prisma.lead.findUnique.mockResolvedValue(null);
    await expect(getLeadById("lead-x", ADMIN_VIEWER)).rejects.toThrow(
      /encontrado/i,
    );
  });

  it("forbids ALUNO regardless of leadId", async () => {
    await expect(getLeadById("lead-1", ALUNO_VIEWER)).rejects.toThrow(
      /permissao/i,
    );
  });
});

describe("updateLead", () => {
  it("requires lostReason when transitioning to LOST", async () => {
    mocks.prisma.lead.findUnique.mockResolvedValue({
      id: "lead-1",
      status: LeadStatus.NEGOTIATION,
      lostReason: null,
    });
    await expect(
      updateLead(
        "lead-1",
        { status: LeadStatus.LOST },
        { viewer: ADMIN_VIEWER },
      ),
    ).rejects.toThrow(/motivo/i);
  });

  it("clears lostReason when reopening from LOST", async () => {
    mocks.prisma.lead.findUnique.mockResolvedValue({
      id: "lead-1",
      status: LeadStatus.LOST,
      lostReason: "preco alto",
    });
    mocks.prisma.lead.update.mockResolvedValue({
      id: "lead-1",
      status: LeadStatus.QUALIFIED,
      name: "x",
    });

    await updateLead(
      "lead-1",
      { status: LeadStatus.QUALIFIED },
      { viewer: ADMIN_VIEWER },
    );

    expect(mocks.prisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: LeadStatus.QUALIFIED,
          lostReason: null,
          convertedAt: null,
        }),
      }),
    );
  });
});
