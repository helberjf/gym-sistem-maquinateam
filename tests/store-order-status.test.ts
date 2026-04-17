import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  InventoryMovementType,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  UserRole,
} from "@prisma/client";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";

// ─── mocks before any imports ─────────────────────────────────────────────────
const mocks = vi.hoisted(() => {
  const tx = {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    product: {
      update: vi.fn(),
    },
    inventoryMovement: {
      create: vi.fn(),
    },
  };

  return {
    prisma: {
      $transaction: vi.fn(),
    },
    tx,
    auth: vi.fn(),
    logAuditEvent: vi.fn(),
    hasPermission: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/audit", () => ({
  logAuditEvent: mocks.logAuditEvent,
}));

vi.mock("@/lib/permissions", () => ({
  hasPermission: mocks.hasPermission,
  requireApiPermission: vi.fn(),
}));

import { updateOrderStatus } from "@/lib/store/orders";

// ─── fixtures ─────────────────────────────────────────────────────────────────

const ADMIN_SESSION = {
  user: { id: "admin-1", role: UserRole.ADMIN },
};

function buildOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: "order-1",
    orderNumber: "PED-20250615-1234",
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    paidAt: null,
    cancelledAt: null,
    deliveredAt: null,
    inventoryRestoredAt: null,
    trackingCode: null,
    items: [],
    ...overrides,
  };
}

const BASE_INPUT = {
  status: OrderStatus.PAID,
  note: undefined,
  trackingCode: undefined,
  paymentStatus: undefined,
};

function setupAdminSession() {
  mocks.auth.mockResolvedValue(ADMIN_SESSION);
  mocks.hasPermission.mockReturnValue(true);
}

function setupTransaction() {
  mocks.prisma.$transaction.mockImplementation(
    async (fn: (tx: typeof mocks.tx) => Promise<unknown>) => fn(mocks.tx),
  );
  mocks.tx.order.update.mockResolvedValue(buildOrder({ status: OrderStatus.PAID }));
  mocks.tx.product.update.mockResolvedValue({});
  mocks.tx.inventoryMovement.create.mockResolvedValue({});
  mocks.logAuditEvent.mockResolvedValue(undefined);
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe("updateOrderStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── access control ───────────────────────────────────────────────────────────

  it("throws ForbiddenError when session role lacks manageStoreOrders permission", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "student-1", role: UserRole.ALUNO },
    });
    mocks.hasPermission.mockReturnValue(false);

    await expect(
      updateOrderStatus("order-1", BASE_INPUT, { userId: "student-1" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws ForbiddenError when there is no session", async () => {
    mocks.auth.mockResolvedValue(null);
    mocks.hasPermission.mockReturnValue(false);

    await expect(
      updateOrderStatus("order-1", BASE_INPUT, { userId: null }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  // ── order not found ──────────────────────────────────────────────────────────

  it("throws NotFoundError when order does not exist", async () => {
    setupAdminSession();
    mocks.prisma.$transaction.mockImplementation(
      async (fn: (tx: typeof mocks.tx) => Promise<unknown>) => fn(mocks.tx),
    );
    mocks.tx.order.findUnique.mockResolvedValue(null);

    await expect(
      updateOrderStatus("missing-order", BASE_INPUT, { userId: "admin-1" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  // ── cancelled order guard ─────────────────────────────────────────────────────

  it("throws ConflictError when trying to change status of an already-cancelled order", async () => {
    setupAdminSession();
    mocks.prisma.$transaction.mockImplementation(
      async (fn: (tx: typeof mocks.tx) => Promise<unknown>) => fn(mocks.tx),
    );
    mocks.tx.order.findUnique.mockResolvedValue(
      buildOrder({ status: OrderStatus.CANCELLED }),
    );

    await expect(
      updateOrderStatus(
        "order-1",
        { ...BASE_INPUT, status: OrderStatus.PAID },
        { userId: "admin-1" },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("allows re-cancelling an already-cancelled order (idempotent)", async () => {
    setupAdminSession();
    setupTransaction();
    mocks.tx.order.findUnique.mockResolvedValue(
      buildOrder({ status: OrderStatus.CANCELLED }),
    );
    mocks.tx.order.update.mockResolvedValue(
      buildOrder({ status: OrderStatus.CANCELLED }),
    );

    await expect(
      updateOrderStatus(
        "order-1",
        { ...BASE_INPUT, status: OrderStatus.CANCELLED },
        { userId: "admin-1" },
      ),
    ).resolves.toBeDefined();
  });

  // ── happy path: paid ──────────────────────────────────────────────────────────

  it("transitions order to PAID and sets paidAt when status is PAID", async () => {
    setupAdminSession();
    setupTransaction();
    mocks.tx.order.findUnique.mockResolvedValue(buildOrder());

    await updateOrderStatus("order-1", BASE_INPUT, { userId: "admin-1" });

    expect(mocks.tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.PAID,
          paidAt: expect.any(Date),
        }),
      }),
    );
  });

  it("does not override paidAt when it is already set", async () => {
    const existingPaidAt = new Date("2025-06-01");
    setupAdminSession();
    setupTransaction();
    mocks.tx.order.findUnique.mockResolvedValue(
      buildOrder({ paidAt: existingPaidAt }),
    );

    await updateOrderStatus("order-1", BASE_INPUT, { userId: "admin-1" });

    const call = mocks.tx.order.update.mock.calls[0]?.[0];
    expect(call?.data?.paidAt).toBe(existingPaidAt);
  });

  // ── happy path: cancellation with inventory restore ───────────────────────────

  it("restores inventory for each item when cancelling a PENDING order", async () => {
    setupAdminSession();
    setupTransaction();
    mocks.tx.order.findUnique.mockResolvedValue(
      buildOrder({
        items: [
          { productId: "p1", quantity: 2 },
          { productId: "p2", quantity: 1 },
        ],
      }),
    );
    mocks.tx.order.update.mockResolvedValue(
      buildOrder({ status: OrderStatus.CANCELLED }),
    );

    await updateOrderStatus(
      "order-1",
      { ...BASE_INPUT, status: OrderStatus.CANCELLED },
      { userId: "admin-1" },
    );

    expect(mocks.tx.product.update).toHaveBeenCalledTimes(2);
    expect(mocks.tx.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "p1" },
        data: expect.objectContaining({
          stockQuantity: { increment: 2 },
          status: ProductStatus.ACTIVE,
        }),
      }),
    );
    expect(mocks.tx.inventoryMovement.create).toHaveBeenCalledTimes(2);
    expect(mocks.tx.inventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: InventoryMovementType.ORDER_RESTORE,
          orderId: "order-1",
          performedByUserId: "admin-1",
        }),
      }),
    );
  });

  it("skips inventory restore when inventoryRestoredAt is already set", async () => {
    setupAdminSession();
    setupTransaction();
    mocks.tx.order.findUnique.mockResolvedValue(
      buildOrder({
        inventoryRestoredAt: new Date(),
        items: [{ productId: "p1", quantity: 1 }],
      }),
    );
    mocks.tx.order.update.mockResolvedValue(
      buildOrder({ status: OrderStatus.CANCELLED }),
    );

    await updateOrderStatus(
      "order-1",
      { ...BASE_INPUT, status: OrderStatus.CANCELLED },
      { userId: "admin-1" },
    );

    expect(mocks.tx.product.update).not.toHaveBeenCalled();
    expect(mocks.tx.inventoryMovement.create).not.toHaveBeenCalled();
  });

  // ── status history ────────────────────────────────────────────────────────────

  it("always creates a statusHistory entry regardless of transition", async () => {
    setupAdminSession();
    setupTransaction();
    mocks.tx.order.findUnique.mockResolvedValue(buildOrder());

    await updateOrderStatus(
      "order-1",
      { ...BASE_INPUT, status: OrderStatus.SHIPPED, note: "Enviado pelos Correios" },
      { userId: "admin-1" },
    );

    const updateCall = mocks.tx.order.update.mock.calls[0]?.[0];
    expect(updateCall?.data?.statusHistory?.create).toMatchObject({
      status: OrderStatus.SHIPPED,
      note: "Enviado pelos Correios",
      changedByUserId: "admin-1",
    });
  });

  // ── tracking code ─────────────────────────────────────────────────────────────

  it("persists tracking code when provided", async () => {
    setupAdminSession();
    setupTransaction();
    mocks.tx.order.findUnique.mockResolvedValue(buildOrder());

    await updateOrderStatus(
      "order-1",
      { ...BASE_INPUT, status: OrderStatus.SHIPPED, trackingCode: "BR123456789BR" },
      { userId: "admin-1" },
    );

    expect(mocks.tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          trackingCode: "BR123456789BR",
        }),
      }),
    );
  });

  // ── audit ─────────────────────────────────────────────────────────────────────

  it("emits a STORE_ORDER_STATUS_UPDATED audit event on every successful update", async () => {
    setupAdminSession();
    setupTransaction();
    mocks.tx.order.findUnique.mockResolvedValue(buildOrder());

    await updateOrderStatus("order-1", BASE_INPUT, {
      userId: "admin-1",
      request: new Request("https://example.com"),
    });

    expect(mocks.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "STORE_ORDER_STATUS_UPDATED",
        actorId: "admin-1",
        entityId: expect.any(String),
      }),
    );
  });
});
