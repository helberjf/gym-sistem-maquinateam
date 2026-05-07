import {
  LeadInteractionType,
  LeadStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import type { ViewerContext } from "@/lib/academy/access";
import { logAuditEvent } from "@/lib/audit";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import { logger, serializeError } from "@/lib/observability/logger";
import { buildOffsetPagination } from "@/lib/pagination";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type {
  CreateLeadInput,
  CreateLeadInteractionInput,
  LeadFiltersInput,
  QualifyLeadInput,
  UpdateLeadInput,
} from "@/lib/validators/leads";

const DEFAULT_PAGE_SIZE = 20;

const PIPELINE_ORDER: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.QUALIFIED,
  LeadStatus.PROPOSAL,
  LeadStatus.NEGOTIATION,
  LeadStatus.WON,
];

type MutationContext = {
  viewer: ViewerContext;
  request?: Request;
};

function assertCanView(viewer: ViewerContext) {
  if (!hasPermission(viewer.role, "viewLeads")) {
    throw new ForbiddenError("Sem permissao para visualizar leads.");
  }
}

function assertCanManage(viewer: ViewerContext) {
  if (!hasPermission(viewer.role, "manageLeads")) {
    throw new ForbiddenError("Sem permissao para gerenciar leads.");
  }
}

function assertCanDelete(viewer: ViewerContext) {
  if (!hasPermission(viewer.role, "deleteLeads")) {
    throw new ForbiddenError("Apenas administradores podem excluir leads.");
  }
}

function getNextStatus(current: LeadStatus): LeadStatus | null {
  const idx = PIPELINE_ORDER.indexOf(current);
  if (idx === -1 || idx >= PIPELINE_ORDER.length - 1) return null;
  return PIPELINE_ORDER[idx + 1];
}

async function ensureAssigneeExists(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) {
    throw new BadRequestError("Usuario responsavel invalido ou inativo.");
  }
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.RECEPCAO) {
    throw new BadRequestError(
      "Responsavel deve ser admin ou recepcao.",
    );
  }
  return user;
}

export async function listLeads(
  filters: LeadFiltersInput,
  viewer: ViewerContext,
) {
  assertCanView(viewer);

  const where: Prisma.LeadWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.source) where.source = filters.source;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { phone: { contains: filters.search, mode: "insensitive" } },
      {
        instagramHandle: { contains: filters.search, mode: "insensitive" },
      },
    ];
  }

  const total = await prisma.lead.count({ where });
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const pagination = buildOffsetPagination({
    page: filters.page ?? 1,
    pageSize,
    totalItems: total,
  });

  const items = await prisma.lead.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    skip: pagination.skip,
    take: pagination.limit,
    include: {
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { interactions: true, tasks: true } },
    },
  });

  return { items, pagination };
}

export async function getLeadById(id: string, viewer: ViewerContext) {
  assertCanView(viewer);

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      interactions: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      tasks: {
        include: { assignedTo: { select: { id: true, name: true } } },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
        take: 100,
      },
    },
  });

  if (!lead) {
    throw new NotFoundError("Lead nao encontrado.");
  }

  return lead;
}

export async function createLead(
  input: CreateLeadInput,
  context: MutationContext,
) {
  assertCanManage(context.viewer);

  const finalAssignedToId = input.assignedToId ?? context.viewer.userId;
  await ensureAssigneeExists(finalAssignedToId);

  const created = await prisma.lead.create({
    data: {
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      instagramHandle: input.instagramHandle ?? null,
      source: input.source,
      valueCents:
        input.valueCents === null || input.valueCents === undefined
          ? null
          : Math.round(input.valueCents),
      notes: input.notes ?? null,
      assignedToId: finalAssignedToId,
      createdById: context.viewer.userId,
    },
    include: {
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await logAuditEvent({
    actorId: context.viewer.userId,
    action: "lead.create",
    entityType: "Lead",
    entityId: created.id,
    summary: `Lead "${created.name}" criado.`,
    afterData: created,
    request: context.request,
  });

  return created;
}

export async function updateLead(
  id: string,
  input: UpdateLeadInput,
  context: MutationContext,
) {
  assertCanManage(context.viewer);

  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Lead nao encontrado.");

  if (input.assignedToId) {
    await ensureAssigneeExists(input.assignedToId);
  }

  if (input.status === LeadStatus.LOST) {
    const reason = input.lostReason ?? existing.lostReason;
    if (!reason) {
      throw new BadRequestError("Motivo da perda obrigatorio.");
    }
  }

  const data: Prisma.LeadUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.email !== undefined) data.email = input.email;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.instagramHandle !== undefined)
    data.instagramHandle = input.instagramHandle;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.source !== undefined) data.source = input.source;

  if (input.valueCents !== undefined) {
    data.valueCents =
      input.valueCents === null ? null : Math.round(input.valueCents);
  }

  if (input.assignedToId !== undefined) {
    data.assignedTo = input.assignedToId
      ? { connect: { id: input.assignedToId } }
      : { disconnect: true };
  }

  if (input.status !== undefined) {
    data.status = input.status;
    if (input.status === LeadStatus.WON) {
      data.convertedAt = new Date();
    }
    if (input.status === LeadStatus.LOST) {
      data.lostReason = input.lostReason ?? existing.lostReason;
    }
    if (
      input.status !== LeadStatus.LOST &&
      input.status !== LeadStatus.WON &&
      existing.status === LeadStatus.LOST
    ) {
      data.lostReason = null;
      data.convertedAt = null;
    }
  }

  const updated = await prisma.lead.update({
    where: { id },
    data,
    include: {
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await logAuditEvent({
    actorId: context.viewer.userId,
    action: "lead.update",
    entityType: "Lead",
    entityId: updated.id,
    summary: `Lead "${updated.name}" atualizado.`,
    beforeData: existing,
    afterData: updated,
    request: context.request,
  });

  return updated;
}

export async function deleteLead(id: string, context: MutationContext) {
  assertCanDelete(context.viewer);

  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Lead nao encontrado.");

  await prisma.lead.delete({ where: { id } });

  await logAuditEvent({
    actorId: context.viewer.userId,
    action: "lead.delete",
    entityType: "Lead",
    entityId: id,
    summary: `Lead "${existing.name}" excluido.`,
    beforeData: existing,
    request: context.request,
  });

  return { id };
}

export async function qualifyLead(
  id: string,
  input: QualifyLeadInput,
  context: MutationContext,
) {
  assertCanManage(context.viewer);

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) throw new NotFoundError("Lead nao encontrado.");

  const data: Prisma.LeadUpdateInput = {};

  if (input.action === "advance") {
    if (lead.status === LeadStatus.WON || lead.status === LeadStatus.LOST) {
      throw new BadRequestError("Nao e possivel avancar um lead finalizado.");
    }
    const nextStatus = getNextStatus(lead.status);
    if (!nextStatus) {
      throw new BadRequestError("Lead ja esta no estagio final do pipeline.");
    }
    data.status = nextStatus;
    if (nextStatus === LeadStatus.WON) {
      data.convertedAt = new Date();
    }
  } else if (input.action === "lost") {
    if (lead.status === LeadStatus.WON) {
      throw new BadRequestError(
        "Nao e possivel marcar como perdido um lead ja convertido.",
      );
    }
    if (!input.lostReason) {
      throw new BadRequestError("Motivo da perda obrigatorio.");
    }
    data.status = LeadStatus.LOST;
    data.lostReason = input.lostReason;
  } else {
    if (lead.status !== LeadStatus.LOST) {
      throw new BadRequestError("Apenas leads perdidos podem ser reabertos.");
    }
    data.status = LeadStatus.NEW;
    data.lostReason = null;
    data.convertedAt = null;
  }

  const updated = await prisma.lead.update({
    where: { id },
    data,
    include: {
      assignedTo: { select: { id: true, name: true } },
    },
  });

  await logAuditEvent({
    actorId: context.viewer.userId,
    action: `lead.qualify.${input.action}`,
    entityType: "Lead",
    entityId: updated.id,
    summary: `Lead "${updated.name}" -> ${updated.status}.`,
    beforeData: lead,
    afterData: updated,
    request: context.request,
  });

  return updated;
}

export async function addLeadInteraction(
  id: string,
  input: CreateLeadInteractionInput,
  context: MutationContext,
) {
  assertCanManage(context.viewer);

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, status: true, name: true },
  });
  if (!lead) throw new NotFoundError("Lead nao encontrado.");

  const shouldAdvance = lead.status === LeadStatus.NEW;

  try {
    const [interaction] = await prisma.$transaction([
      prisma.leadInteraction.create({
        data: {
          leadId: id,
          userId: context.viewer.userId,
          type: input.type ?? LeadInteractionType.NOTE,
          content: input.content,
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
      ...(shouldAdvance
        ? [
            prisma.lead.update({
              where: { id },
              data: { status: LeadStatus.CONTACTED },
            }),
          ]
        : []),
    ]);

    await logAuditEvent({
      actorId: context.viewer.userId,
      action: "lead.interaction.create",
      entityType: "LeadInteraction",
      entityId: interaction.id,
      summary: `Interacao registrada no lead "${lead.name}".`,
      afterData: { leadId: lead.id, type: interaction.type },
      request: context.request,
    });

    return { interaction, statusAdvanced: shouldAdvance };
  } catch (error) {
    logger.error("leads.add_interaction_failed", {
      leadId: id,
      error: serializeError(error),
    });
    throw error;
  }
}
