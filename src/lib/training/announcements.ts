import { Prisma, UserRole } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { slugify } from "@/lib/academy/constants";
import { type ViewerContext } from "@/lib/academy/access";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { buildOffsetPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import {
  type AnnouncementFiltersInput,
  type CreateAnnouncementInput,
  type UpdateAnnouncementInput,
  type MutationContext,
  parseDateOnly,
  normalizeOptionalString,
  assertCanManageAnnouncement,
  generateUniqueAnnouncementSlug,
  getStudentAnnouncementTeacherIds,
  isAnnouncementVisibleToStudent,
  getVisiblePublishedAnnouncements,
  mergeAnnouncementsById,
} from "@/lib/training/utils";

export async function getAnnouncementsIndexData(
  viewer: ViewerContext,
  filters: AnnouncementFiltersInput,
) {
  const canManage = hasPermission(viewer.role, "manageAnnouncements");
  const isPublishedFilter =
    filters.isPublished === undefined ? undefined : filters.isPublished;
  const now = Date.now();

  const buildAnnouncementSummary = (
    announcements: Array<{ isPublished: boolean; isPinned: boolean; expiresAt: Date | null }>,
  ) => ({
    total: announcements.length,
    published: announcements.filter((a) => a.isPublished).length,
    pinned: announcements.filter((a) => a.isPinned).length,
    expiringSoon: announcements.filter((a) => {
      if (!a.expiresAt) return false;
      return (
        a.expiresAt.getTime() > now &&
        a.expiresAt.getTime() <= now + 7 * 24 * 60 * 60 * 1000
      );
    }).length,
  });

  if (viewer.role === UserRole.ADMIN || viewer.role === UserRole.RECEPCAO) {
    const adminWhere = {
      AND: [
        filters.search
          ? {
              OR: [
                { title: { contains: filters.search, mode: "insensitive" } },
                { excerpt: { contains: filters.search, mode: "insensitive" } },
                { content: { contains: filters.search, mode: "insensitive" } },
              ],
            }
          : {},
        filters.targetRole === undefined
          ? {}
          : filters.targetRole === null
            ? { targetRole: null }
            : { targetRole: filters.targetRole },
        isPublishedFilter === undefined ? {} : { isPublished: isPublishedFilter },
      ],
    } satisfies Prisma.AnnouncementWhereInput;

    const [totalAnnouncements, publishedAnnouncements, pinnedAnnouncements, expiringSoonAnnouncements] =
      await Promise.all([
        prisma.announcement.count({ where: adminWhere }),
        prisma.announcement.count({ where: { AND: [adminWhere, { isPublished: true }] } }),
        prisma.announcement.count({ where: { AND: [adminWhere, { isPinned: true }] } }),
        prisma.announcement.count({
          where: {
            AND: [
              adminWhere,
              {
                expiresAt: {
                  gt: new Date(now),
                  lte: new Date(now + 7 * 24 * 60 * 60 * 1000),
                },
              },
            ],
          },
        }),
      ]);
    const pagination = buildOffsetPagination({
      page: filters.page,
      totalItems: totalAnnouncements,
    });
    const announcements = await prisma.announcement.findMany({
      where: adminWhere,
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      skip: pagination.skip,
      take: pagination.limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        targetRole: true,
        isPinned: true,
        isPublished: true,
        publishedAt: true,
        expiresAt: true,
        createdAt: true,
        createdByUserId: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            role: true,
            teacherProfile: { select: { id: true } },
          },
        },
      },
    });

    return {
      announcements,
      pagination,
      summary: {
        total: totalAnnouncements,
        published: publishedAnnouncements,
        pinned: pinnedAnnouncements,
        expiringSoon: expiringSoonAnnouncements,
      },
      canManage,
    };
  }

  if (viewer.role === UserRole.PROFESSOR) {
    const ownAnnouncements = await prisma.announcement.findMany({
      where: {
        AND: [
          { createdByUserId: viewer.userId },
          filters.search
            ? {
                OR: [
                  { title: { contains: filters.search, mode: "insensitive" } },
                  { excerpt: { contains: filters.search, mode: "insensitive" } },
                  { content: { contains: filters.search, mode: "insensitive" } },
                ],
              }
            : {},
          filters.targetRole === undefined
            ? {}
            : filters.targetRole === null
              ? { targetRole: null }
              : { targetRole: filters.targetRole },
          isPublishedFilter === undefined ? {} : { isPublished: isPublishedFilter },
        ],
      },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        targetRole: true,
        isPinned: true,
        isPublished: true,
        publishedAt: true,
        expiresAt: true,
        createdAt: true,
        createdByUserId: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            role: true,
            teacherProfile: { select: { id: true } },
          },
        },
      },
    });

    const publicAnnouncements =
      isPublishedFilter === false
        ? []
        : await getVisiblePublishedAnnouncements(viewer, {
            search: filters.search,
            targetRole:
              filters.targetRole === UserRole.PROFESSOR ||
              filters.targetRole === undefined ||
              filters.targetRole === null
                ? filters.targetRole ?? undefined
                : undefined,
          });

    const mergedAnnouncements = mergeAnnouncementsById([
      ...ownAnnouncements,
      ...publicAnnouncements,
    ]);
    const pagination = buildOffsetPagination({
      page: filters.page,
      totalItems: mergedAnnouncements.length,
    });
    const announcements = mergedAnnouncements.slice(
      pagination.skip,
      pagination.skip + pagination.limit,
    );

    return {
      announcements,
      pagination,
      summary: buildAnnouncementSummary(mergedAnnouncements),
      canManage,
    };
  }

  const visibleAnnouncements = await getVisiblePublishedAnnouncements(viewer, {
    search: filters.search,
  });
  const pagination = buildOffsetPagination({
    page: filters.page,
    totalItems: visibleAnnouncements.length,
  });
  const announcements = visibleAnnouncements.slice(
    pagination.skip,
    pagination.skip + pagination.limit,
  );

  return {
    announcements,
    pagination,
    summary: buildAnnouncementSummary(visibleAnnouncements),
    canManage,
  };
}

export async function getDashboardAnnouncements(viewer: ViewerContext, take = 4) {
  return getVisiblePublishedAnnouncements(viewer, { take });
}

export async function getAnnouncementDetailData(
  viewer: ViewerContext,
  announcementId: string,
) {
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      targetRole: true,
      isPinned: true,
      isPublished: true,
      publishedAt: true,
      expiresAt: true,
      createdAt: true,
      createdByUserId: true,
      createdByUser: {
        select: {
          id: true,
          name: true,
          role: true,
          teacherProfile: { select: { id: true } },
        },
      },
    },
  });

  if (!announcement) {
    throw new NotFoundError("Aviso nao encontrado.");
  }

  if (viewer.role === UserRole.ADMIN || viewer.role === UserRole.RECEPCAO) {
    return { announcement, canManage: true };
  }

  if (viewer.role === UserRole.PROFESSOR) {
    const isPublishedAndActive =
      announcement.isPublished &&
      (!announcement.publishedAt || announcement.publishedAt <= new Date()) &&
      (!announcement.expiresAt || announcement.expiresAt > new Date());

    if (
      announcement.createdByUserId !== viewer.userId &&
      !(
        isPublishedAndActive &&
        (announcement.targetRole === null || announcement.targetRole === UserRole.PROFESSOR)
      )
    ) {
      throw new NotFoundError("Aviso nao encontrado.");
    }

    return { announcement, canManage: true };
  }

  const teacherIds = await getStudentAnnouncementTeacherIds(viewer);
  const isPublishedAndActive =
    announcement.isPublished &&
    (!announcement.publishedAt || announcement.publishedAt <= new Date()) &&
    (!announcement.expiresAt || announcement.expiresAt > new Date());

  if (
    !isPublishedAndActive ||
    (announcement.targetRole !== null && announcement.targetRole !== UserRole.ALUNO) ||
    !isAnnouncementVisibleToStudent(announcement, teacherIds)
  ) {
    throw new NotFoundError("Aviso nao encontrado.");
  }

  return { announcement, canManage: false };
}

export async function createAnnouncement(
  input: CreateAnnouncementInput,
  context: MutationContext,
) {
  if (
    context.viewer.role === UserRole.PROFESSOR &&
    input.targetRole !== UserRole.ALUNO
  ) {
    throw new ForbiddenError(
      "Professores podem publicar avisos apenas para alunos vinculados.",
    );
  }

  const slug = await generateUniqueAnnouncementSlug(slugify(input.slug ?? input.title));
  const publishedAt = input.isPublished
    ? parseDateOnly(input.publishedAt) ?? new Date()
    : null;
  const expiresAt = parseDateOnly(input.expiresAt) ?? null;

  const announcement = await prisma.announcement.create({
    data: {
      title: input.title,
      slug,
      excerpt: normalizeOptionalString(input.excerpt),
      content: input.content.trim(),
      targetRole:
        context.viewer.role === UserRole.PROFESSOR
          ? UserRole.ALUNO
          : input.targetRole ?? null,
      isPinned: input.isPinned ?? false,
      isPublished: input.isPublished ?? true,
      publishedAt,
      expiresAt,
      createdByUserId: context.viewer.userId,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      targetRole: true,
      isPublished: true,
    },
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "ANNOUNCEMENT_CREATED",
    entityType: "Announcement",
    entityId: announcement.id,
    summary: `Aviso ${announcement.title} criado.`,
    afterData: {
      slug: announcement.slug,
      targetRole: announcement.targetRole,
      isPublished: announcement.isPublished,
      publishedAt,
      expiresAt,
    },
  });

  return announcement;
}

export async function updateAnnouncement(
  input: UpdateAnnouncementInput,
  context: MutationContext,
) {
  const existing = await prisma.announcement.findUnique({
    where: { id: input.id },
    select: {
      id: true,
      title: true,
      slug: true,
      targetRole: true,
      isPinned: true,
      isPublished: true,
      publishedAt: true,
      expiresAt: true,
      createdByUserId: true,
    },
  });

  if (!existing) {
    throw new NotFoundError("Aviso nao encontrado.");
  }

  assertCanManageAnnouncement(context.viewer, existing);

  if (
    context.viewer.role === UserRole.PROFESSOR &&
    input.targetRole !== UserRole.ALUNO
  ) {
    throw new ForbiddenError(
      "Professores podem publicar avisos apenas para alunos vinculados.",
    );
  }

  const slug = await generateUniqueAnnouncementSlug(
    slugify(input.slug ?? input.title),
    input.id,
  );
  const isPublished = input.isPublished ?? true;
  const publishedAt = isPublished
    ? parseDateOnly(input.publishedAt) ?? existing.publishedAt ?? new Date()
    : null;
  const expiresAt = parseDateOnly(input.expiresAt) ?? null;

  const announcement = await prisma.announcement.update({
    where: { id: input.id },
    data: {
      title: input.title,
      slug,
      excerpt: normalizeOptionalString(input.excerpt),
      content: input.content.trim(),
      targetRole:
        context.viewer.role === UserRole.PROFESSOR
          ? UserRole.ALUNO
          : input.targetRole ?? null,
      isPinned: input.isPinned ?? false,
      isPublished,
      publishedAt,
      expiresAt,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      targetRole: true,
      isPublished: true,
    },
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "ANNOUNCEMENT_UPDATED",
    entityType: "Announcement",
    entityId: announcement.id,
    summary: `Aviso ${announcement.title} atualizado.`,
    beforeData: existing,
    afterData: {
      slug: announcement.slug,
      targetRole: announcement.targetRole,
      isPublished: announcement.isPublished,
      publishedAt,
      expiresAt,
    },
  });

  return announcement;
}

export async function unpublishAnnouncement(
  announcementId: string,
  context: MutationContext,
) {
  const existing = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { id: true, title: true, isPublished: true, createdByUserId: true },
  });

  if (!existing) {
    throw new NotFoundError("Aviso nao encontrado.");
  }

  assertCanManageAnnouncement(context.viewer, existing);

  await prisma.announcement.update({
    where: { id: announcementId },
    data: { isPublished: false },
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "ANNOUNCEMENT_UNPUBLISHED",
    entityType: "Announcement",
    entityId: existing.id,
    summary: `Aviso ${existing.title} despublicado.`,
    beforeData: existing,
    afterData: { isPublished: false },
  });
}
