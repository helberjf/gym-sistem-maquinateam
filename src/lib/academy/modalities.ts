import { Prisma, UserRole } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { slugify } from "@/lib/academy/constants";
import {
  getModalityVisibilityWhere,
  type ViewerContext,
} from "@/lib/academy/access";
import { NotFoundError, ConflictError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { buildOffsetPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import {
  type ModalityFiltersInput,
  type CreateModalityInput,
  type UpdateModalityInput,
  type MutationContext,
  normalizeOptionalString,
  normalizeOptionalUppercase,
} from "@/lib/academy/utils";

export async function getModalitiesIndexData(
  viewer: ViewerContext,
  filters: ModalityFiltersInput,
) {
  const where: Prisma.ModalityWhereInput = {
    AND: [
      getModalityVisibilityWhere(viewer),
      filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { description: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {},
      filters.onlyInactive === true
        ? { isActive: false }
        : filters.onlyInactive === false
          ? { isActive: true }
          : {},
    ],
  };

  const totalModalities = await prisma.modality.count({ where });
  const pagination = buildOffsetPagination({ page: filters.page, totalItems: totalModalities });
  const modalities = await prisma.modality.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    skip: pagination.skip,
    take: pagination.limit,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      colorHex: true,
      sortOrder: true,
      isActive: true,
      _count: { select: { classSchedules: true, teachers: true, primaryStudents: true } },
    },
  });

  return {
    modalities,
    pagination,
    canManage: hasPermission(viewer.role, "manageModalities"),
  };
}

export async function getModalityDetailData(
  viewer: ViewerContext,
  modalityId: string,
) {
  const modality = await prisma.modality.findFirst({
    where: { AND: [getModalityVisibilityWhere(viewer), { id: modalityId }] },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      colorHex: true,
      sortOrder: true,
      isActive: true,
      teachers: {
        select: { id: true, user: { select: { name: true } } },
        orderBy: { user: { name: "asc" } },
      },
      classSchedules: {
        where:
          viewer.role === UserRole.ALUNO
            ? {
                enrollments: {
                  some: {
                    studentProfileId: viewer.studentProfileId ?? "__no_access__",
                    isActive: true,
                  },
                },
              }
            : viewer.role === UserRole.PROFESSOR
              ? { teacherProfileId: viewer.teacherProfileId ?? "__no_access__" }
              : undefined,
        orderBy: [{ isActive: "desc" }, { startTime: "asc" }],
        select: {
          id: true,
          title: true,
          isActive: true,
          startTime: true,
          endTime: true,
          dayOfWeek: true,
          daysOfWeek: true,
          teacherProfile: { select: { user: { select: { name: true } } } },
          _count: { select: { enrollments: true } },
        },
      },
      primaryStudents: {
        take: 10,
        select: {
          id: true,
          registrationNumber: true,
          status: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!modality) {
    throw new NotFoundError("Modalidade nao encontrada ou indisponivel.");
  }

  return {
    modality,
    canManage: hasPermission(viewer.role, "manageModalities"),
  };
}

export async function createModality(
  input: CreateModalityInput,
  context: MutationContext,
) {
  const slug = input.slug ?? slugify(input.name);

  const modality = await prisma.modality.create({
    data: {
      name: input.name,
      slug,
      description: normalizeOptionalString(input.description),
      colorHex: normalizeOptionalUppercase(input.colorHex),
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    },
    select: { id: true, name: true, slug: true },
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "MODALITY_CREATED",
    entityType: "Modality",
    entityId: modality.id,
    summary: `Modalidade ${modality.name} criada.`,
    afterData: { slug: modality.slug },
  });

  return modality;
}

export async function updateModality(
  input: UpdateModalityInput,
  context: MutationContext,
) {
  const existing = await prisma.modality.findUnique({
    where: { id: input.id },
    select: { id: true, name: true, slug: true, isActive: true },
  });

  if (!existing) {
    throw new NotFoundError("Modalidade nao encontrada.");
  }

  if (input.isActive === false) {
    const activeClasses = await prisma.classSchedule.count({
      where: { modalityId: input.id, isActive: true },
    });

    if (activeClasses > 0) {
      throw new ConflictError(
        "Inative ou mova as turmas ativas desta modalidade antes de arquiva-la.",
      );
    }
  }

  const modality = await prisma.modality.update({
    where: { id: input.id },
    data: {
      name: input.name,
      slug: input.slug ?? existing.slug,
      description: normalizeOptionalString(input.description),
      colorHex: normalizeOptionalUppercase(input.colorHex),
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    },
    select: { id: true, name: true, slug: true, isActive: true },
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "MODALITY_UPDATED",
    entityType: "Modality",
    entityId: modality.id,
    summary: `Modalidade ${modality.name} atualizada.`,
    beforeData: { slug: existing.slug, isActive: existing.isActive },
    afterData: { slug: modality.slug, isActive: modality.isActive },
  });

  return modality;
}

export async function archiveModality(
  modalityId: string,
  context: MutationContext,
) {
  const modality = await prisma.modality.findUnique({
    where: { id: modalityId },
    select: { id: true, name: true, isActive: true },
  });

  if (!modality) {
    throw new NotFoundError("Modalidade nao encontrada.");
  }

  const activeClasses = await prisma.classSchedule.count({
    where: { modalityId, isActive: true },
  });

  if (activeClasses > 0) {
    throw new ConflictError(
      "Inative ou mova as turmas ativas desta modalidade antes de arquiva-la.",
    );
  }

  await prisma.modality.update({ where: { id: modalityId }, data: { isActive: false } });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "MODALITY_ARCHIVED",
    entityType: "Modality",
    entityId: modalityId,
    summary: `Modalidade ${modality.name} arquivada.`,
    beforeData: { isActive: modality.isActive },
    afterData: { isActive: false },
  });
}
