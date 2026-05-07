import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationTone, NotificationType } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  prisma: {
    notification: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));

import {
  archiveNotification,
  createNotification,
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllAsRead,
  markAsRead,
  markAsUnread,
} from "@/lib/notifications/inbox";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.prisma.notification.count.mockResolvedValue(0);
  mocks.prisma.notification.findMany.mockResolvedValue([]);
});

describe("createNotification", () => {
  it("creates without dedupKey via plain create", async () => {
    mocks.prisma.notification.create.mockResolvedValue({ id: "n-1" });

    await createNotification({
      userId: "u-1",
      type: NotificationType.PAYMENT_DUE,
      tone: NotificationTone.WARNING,
      title: "Pagamento proximo",
      message: "Vence amanha.",
    });

    expect(mocks.prisma.notification.create).toHaveBeenCalled();
    expect(mocks.prisma.notification.upsert).not.toHaveBeenCalled();
  });

  it("uses upsert when dedupKey is provided (refresh existing row)", async () => {
    mocks.prisma.notification.upsert.mockResolvedValue({ id: "n-2" });

    await createNotification({
      userId: "u-1",
      type: NotificationType.STOCK_LOW,
      title: "Estoque baixo",
      message: "3 produtos",
      dedupKey: "stock_low:daily",
    });

    expect(mocks.prisma.notification.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_dedupKey: { userId: "u-1", dedupKey: "stock_low:daily" } },
      }),
    );
  });

  it("returns null and logs when prisma throws (does not crash caller)", async () => {
    mocks.prisma.notification.create.mockRejectedValueOnce(
      new Error("DB unavailable"),
    );

    const result = await createNotification({
      userId: "u-1",
      type: NotificationType.GENERIC,
      title: "T",
      message: "M",
    });

    expect(result).toBeNull();
  });
});

describe("listNotifications", () => {
  it("default scope excludes archived", async () => {
    await listNotifications({ userId: "u-1" });

    const firstCall = mocks.prisma.notification.findMany.mock.calls[0];
    expect(firstCall?.[0]).toMatchObject({
      where: { userId: "u-1", archivedAt: null },
    });
  });

  it("status=unread filters readAt+archivedAt nulls", async () => {
    await listNotifications({ userId: "u-1", status: "unread" });

    const firstCall = mocks.prisma.notification.findMany.mock.calls[0];
    expect(firstCall?.[0]).toMatchObject({
      where: { userId: "u-1", readAt: null, archivedAt: null },
    });
  });

  it("status=archived filters archivedAt: { not: null }", async () => {
    await listNotifications({ userId: "u-1", status: "archived" });

    const firstCall = mocks.prisma.notification.findMany.mock.calls[0];
    expect(firstCall?.[0].where.archivedAt).toEqual({ not: null });
  });
});

describe("markAsRead / markAsUnread", () => {
  it("forbids reading another user notification", async () => {
    mocks.prisma.notification.findUnique.mockResolvedValue({
      id: "n-1",
      userId: "u-other",
      readAt: null,
    });
    await expect(markAsRead("n-1", "u-1")).rejects.toThrow(/permissao/i);
  });

  it("returns existing unchanged when already read", async () => {
    const row = { id: "n-1", userId: "u-1", readAt: new Date() };
    mocks.prisma.notification.findUnique.mockResolvedValue(row);

    const result = await markAsRead("n-1", "u-1");
    expect(result).toBe(row);
    expect(mocks.prisma.notification.update).not.toHaveBeenCalled();
  });

  it("setting unread on unread row is no-op", async () => {
    const row = { id: "n-1", userId: "u-1", readAt: null };
    mocks.prisma.notification.findUnique.mockResolvedValue(row);

    const result = await markAsUnread("n-1", "u-1");
    expect(result).toBe(row);
    expect(mocks.prisma.notification.update).not.toHaveBeenCalled();
  });
});

describe("markAllAsRead", () => {
  it("scopes update to unread+not-archived for the user", async () => {
    mocks.prisma.notification.updateMany.mockResolvedValue({ count: 3 });
    const result = await markAllAsRead("u-1");
    expect(mocks.prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: "u-1", readAt: null, archivedAt: null },
      data: { readAt: expect.any(Date) },
    });
    expect(result.updated).toBe(3);
  });
});

describe("archive / delete", () => {
  it("archive sets archivedAt", async () => {
    mocks.prisma.notification.findUnique.mockResolvedValue({
      id: "n-1",
      userId: "u-1",
    });
    mocks.prisma.notification.update.mockResolvedValue({ id: "n-1" });
    await archiveNotification("n-1", "u-1");
    expect(mocks.prisma.notification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ archivedAt: expect.any(Date) }),
      }),
    );
  });

  it("delete forbids cross-user removal", async () => {
    mocks.prisma.notification.findUnique.mockResolvedValue({
      id: "n-1",
      userId: "u-other",
    });
    await expect(deleteNotification("n-1", "u-1")).rejects.toThrow(/permissao/i);
  });
});

describe("getUnreadCount", () => {
  it("counts unread + not archived", async () => {
    mocks.prisma.notification.count.mockResolvedValueOnce(7);
    const count = await getUnreadCount("u-1");
    expect(count).toBe(7);
    expect(mocks.prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: "u-1", readAt: null, archivedAt: null },
    });
  });
});
