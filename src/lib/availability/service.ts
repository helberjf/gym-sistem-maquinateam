import { Prisma, UserRole } from "@prisma/client";
import type { ViewerContext } from "@/lib/academy/access";
import { logAuditEvent } from "@/lib/audit";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type {
  ReplaceTeacherAvailabilityInput,
  TeacherTimeOffInput,
} from "@/lib/validators/availability";

type MutationContext = {
  viewer: ViewerContext;
  request?: Request;
};

async function resolveTargetTeacherId(
  viewer: ViewerContext,
  requestedTeacherId?: string | null,
) {
  if (!requestedTeacherId || requestedTeacherId === viewer.teacherProfileId) {
    if (!viewer.teacherProfileId) {
      if (
        viewer.role !== UserRole.ADMIN &&
        viewer.role !== UserRole.RECEPCAO
      ) {
        throw new ForbiddenError("Sem perfil de professor associado.");
      }
      throw new BadRequestError(
        "Informe o teacherProfileId quando voce nao e o proprio professor.",
      );
    }
    if (!hasPermission(viewer.role, "manageOwnTeacherAvailability")) {
      throw new ForbiddenError("Sem permissao para gerenciar disponibilidade.");
    }
    return viewer.teacherProfileId;
  }

  if (!hasPermission(viewer.role, "manageAnyTeacherAvailability")) {
    throw new ForbiddenError(
      "Sem permissao para alterar disponibilidade de outros professores.",
    );
  }

  const exists = await prisma.teacherProfile.findUnique({
    where: { id: requestedTeacherId },
    select: { id: true, isActive: true },
  });
  if (!exists) {
    throw new NotFoundError("Professor nao encontrado.");
  }
  if (!exists.isActive) {
    throw new BadRequestError("Professor inativo.");
  }
  return requestedTeacherId;
}

export async function listTeacherAvailability(
  teacherProfileId: string,
  viewer: ViewerContext,
) {
  if (!hasPermission(viewer.role, "viewTeacherAvailability")) {
    throw new ForbiddenError("Sem permissao para ver disponibilidades.");
  }

  const [slots, timeOffs] = await Promise.all([
    prisma.teacherAvailability.findMany({
      where: { teacherProfileId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    prisma.teacherTimeOff.findMany({
      where: {
        teacherProfileId,
        endsAt: { gte: new Date() },
      },
      orderBy: { startsAt: "asc" },
      take: 50,
    }),
  ]);

  return { slots, timeOffs };
}

export async function replaceTeacherAvailability(
  input: ReplaceTeacherAvailabilityInput,
  context: MutationContext,
) {
  const targetTeacherId = await resolveTargetTeacherId(
    context.viewer,
    input.teacherProfileId,
  );

  const created = await prisma.$transaction(async (tx) => {
    await tx.teacherAvailability.deleteMany({
      where: { teacherProfileId: targetTeacherId },
    });

    if (input.slots.length === 0) {
      return [];
    }

    await tx.teacherAvailability.createMany({
      data: input.slots.map((slot) => ({
        teacherProfileId: targetTeacherId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        breaks: (slot.breaks ?? []) as unknown as Prisma.InputJsonValue,
        isActive: slot.isActive ?? true,
      })),
    });

    return tx.teacherAvailability.findMany({
      where: { teacherProfileId: targetTeacherId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  });

  await logAuditEvent({
    actorId: context.viewer.userId,
    action: "teacher.availability.replace",
    entityType: "TeacherProfile",
    entityId: targetTeacherId,
    summary: `Disponibilidade do professor ${targetTeacherId} atualizada (${input.slots.length} janelas).`,
    afterData: { slots: input.slots },
    request: context.request,
  });

  return created;
}

export async function addTeacherTimeOff(
  input: TeacherTimeOffInput,
  context: MutationContext,
) {
  const targetTeacherId = await resolveTargetTeacherId(
    context.viewer,
    input.teacherProfileId,
  );

  const created = await prisma.teacherTimeOff.create({
    data: {
      teacherProfileId: targetTeacherId,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      reason: input.reason ?? null,
    },
  });

  await logAuditEvent({
    actorId: context.viewer.userId,
    action: "teacher.timeoff.create",
    entityType: "TeacherTimeOff",
    entityId: created.id,
    summary: `Folga registrada para professor ${targetTeacherId}.`,
    afterData: created,
    request: context.request,
  });

  return created;
}

export async function deleteTeacherTimeOff(
  id: string,
  context: MutationContext,
) {
  const existing = await prisma.teacherTimeOff.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new NotFoundError("Folga nao encontrada.");
  }

  await resolveTargetTeacherId(context.viewer, existing.teacherProfileId);

  await prisma.teacherTimeOff.delete({ where: { id } });

  await logAuditEvent({
    actorId: context.viewer.userId,
    action: "teacher.timeoff.delete",
    entityType: "TeacherTimeOff",
    entityId: id,
    summary: `Folga ${id} removida.`,
    beforeData: existing,
    request: context.request,
  });

  return { id };
}
