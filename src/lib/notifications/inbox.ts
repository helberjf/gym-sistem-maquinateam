import {
  NotificationTone,
  NotificationType,
  Prisma,
  type Notification,
} from "@prisma/client";
import {
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import { logger, serializeError } from "@/lib/observability/logger";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push/service";

export type NotificationCreateInput = {
  userId: string;
  type: NotificationType;
  tone?: NotificationTone;
  title: string;
  message: string;
  href?: string | null;
  dedupKey?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export type NotificationListFilter = {
  userId: string;
  status?: "all" | "unread" | "archived";
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 25;

/**
 * Persists a notification. When `dedupKey` is set, an existing row for the
 * same (userId, dedupKey) is reused — avoiding duplicate inbox items when
 * the same condition is detected on every dashboard refresh.
 */
export async function createNotification(
  input: NotificationCreateInput,
): Promise<Notification | null> {
  let row: Notification | null = null;

  try {
    if (input.dedupKey) {
      row = await prisma.notification.upsert({
        where: {
          userId_dedupKey: {
            userId: input.userId,
            dedupKey: input.dedupKey,
          },
        },
        update: {
          // Refresh title/message in case the situation changed (e.g., overdue
          // payment count went up).
          title: input.title,
          message: input.message,
          tone: input.tone ?? NotificationTone.INFO,
          href: input.href ?? null,
          metadata: input.metadata,
        },
        create: {
          userId: input.userId,
          type: input.type,
          tone: input.tone ?? NotificationTone.INFO,
          title: input.title,
          message: input.message,
          href: input.href ?? null,
          dedupKey: input.dedupKey,
          metadata: input.metadata,
        },
      });
    } else {
      row = await prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          tone: input.tone ?? NotificationTone.INFO,
          title: input.title,
          message: input.message,
          href: input.href ?? null,
          metadata: input.metadata,
        },
      });
    }
  } catch (error) {
    logger.error("notifications.create_failed", {
      userId: input.userId,
      type: input.type,
      error: serializeError(error),
    });
    return null;
  }

  // Best-effort push delivery — never blocks the inbox row.
  try {
    await sendPushToUser(input.userId, {
      title: input.title,
      body: input.message,
      url: input.href ?? "/dashboard/notificacoes",
      tag: input.dedupKey ?? row?.id,
    });
  } catch (error) {
    logger.warn("notifications.push_dispatch_failed", {
      userId: input.userId,
      error: serializeError(error),
    });
  }

  return row;
}

export async function listNotifications(filter: NotificationListFilter) {
  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? DEFAULT_PAGE_SIZE;

  const where: Prisma.NotificationWhereInput = { userId: filter.userId };

  if (filter.status === "unread") {
    where.readAt = null;
    where.archivedAt = null;
  } else if (filter.status === "archived") {
    where.archivedAt = { not: null };
  } else {
    where.archivedAt = null;
  }

  const [items, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        userId: filter.userId,
        readAt: null,
        archivedAt: null,
      },
    }),
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    unreadCount: unread,
  };
}

export async function markAsRead(id: string, userId: string) {
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Notificacao nao encontrada.");
  if (existing.userId !== userId) {
    throw new ForbiddenError("Sem permissao.");
  }

  if (existing.readAt) return existing;

  return prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });
}

export async function markAsUnread(id: string, userId: string) {
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Notificacao nao encontrada.");
  if (existing.userId !== userId) {
    throw new ForbiddenError("Sem permissao.");
  }

  if (!existing.readAt) return existing;

  return prisma.notification.update({
    where: { id },
    data: { readAt: null },
  });
}

export async function markAllAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null, archivedAt: null },
    data: { readAt: new Date() },
  });
  return { updated: result.count };
}

export async function archiveNotification(id: string, userId: string) {
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Notificacao nao encontrada.");
  if (existing.userId !== userId) {
    throw new ForbiddenError("Sem permissao.");
  }

  return prisma.notification.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
}

export async function deleteNotification(id: string, userId: string) {
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Notificacao nao encontrada.");
  if (existing.userId !== userId) {
    throw new ForbiddenError("Sem permissao.");
  }

  await prisma.notification.delete({ where: { id } });
  return { id };
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null, archivedAt: null },
  });
}

export type { Notification };
