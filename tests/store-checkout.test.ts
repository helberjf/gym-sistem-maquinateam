import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CheckoutPaymentKind,
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  ProductStatus,
} from "@prisma/client";
import { ConflictError, ForbiddenError } from "@/lib/errors";

// ─── All mocks must be defined before any imports ────────────────────────────
const mocks = vi.hoisted(() => {
  const tx = {
    cartItem: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    checkoutPayment: {
      create: vi.fn(),
      update: vi.fn(),
    },
    coupon: {
      update: vi.fn(),
    },
    couponRedemption: {
      create: vi.fn(),
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
      user: {
        findUnique: vi.fn(),
      },
      shippingAddress: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    },
    tx,
    getOptionalSession: vi.fn(),
    getActiveCartId: vi.fn(),
    validateCouponForItems: vi.fn(),
    createMercadoPagoPreference: vi.fn(),
    createAbacatePayPixQrCode: vi.fn(),
    getMercadoPagoWebhookUrl: vi.fn(),
    buildMercadoPagoReturnUrls: vi.fn(),
    onlyDigits: vi.fn((v?: string | null) => v?.replace(/\D/g, "") ?? ""),
    formatAbacatePayCellphone: vi.fn((v: string) => v),
    resolvePaymentProvider: vi.fn(),
    getAppUrl: vi.fn(),
    logAuditEvent: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/auth/session", () => ({
  getOptionalSession: mocks.getOptionalSession,
}));

vi.mock("@/lib/store/cart", () => ({
  getActiveCartId: mocks.getActiveCartId,
  getCartSnapshot: vi.fn(async () => ({
    cartId: null,
    authenticated: false,
    items: [],
    summary: { itemCount: 0, subtotalCents: 0 },
  })),
}));

vi.mock("@/lib/store/coupons", () => ({
  validateCouponForItems: mocks.validateCouponForItems,
}));

vi.mock("@/lib/payments/mercadopago", () => ({
  createMercadoPagoPreference: mocks.createMercadoPagoPreference,
  getMercadoPagoWebhookUrl: mocks.getMercadoPagoWebhookUrl,
  buildMercadoPagoReturnUrls: mocks.buildMercadoPagoReturnUrls,
  onlyDigits: mocks.onlyDigits,
}));

vi.mock("@/lib/payments/abacatepay", () => ({
  createAbacatePayPixQrCode: mocks.createAbacatePayPixQrCode,
  formatAbacatePayCellphone: mocks.formatAbacatePayCellphone,
}));

vi.mock("@/lib/payments/provider", () => ({
  resolvePaymentProvider: mocks.resolvePaymentProvider,
}));

vi.mock("@/lib/app-url", () => ({
  getAppUrl: mocks.getAppUrl,
}));

vi.mock("@/lib/audit", () => ({
  logAuditEvent: mocks.logAuditEvent,
}));

import { createStoreCheckoutSession } from "@/lib/store/orders";

// ─── shared fixtures ─────────────────────────────────────────────────────────

const GUEST_INPUT = {
  guest: {
    name: "João Silva",
    email: "joao@email.com",
    phone: "32999990000",
    document: "12345678901",
  },
  deliveryMethod: DeliveryMethod.PICKUP,
  paymentMethod: PaymentMethod.CREDIT_CARD,
  couponCode: undefined,
  notes: undefined,
  shippingAddressId: undefined,
  address: undefined,
  saveAddress: false,
};

const PREPARED_ITEM = {
  id: "ci-1",
  quantity: 1,
  product: {
    id: "prod-1",
    name: "Luva de Boxe",
    slug: "luva-de-boxe",
    sku: "LUVA-001",
    category: "luvas",
    priceCents: 8900,
    trackInventory: false,
    stockQuantity: 10,
    status: ProductStatus.ACTIVE,
    storeVisible: true,
    lowStockThreshold: 2,
    weightGrams: 400,
    images: [],
  },
};

const CREATED_ORDER = {
  id: "order-1",
  orderNumber: "PED-20250615-1234",
  totalCents: 8900,
  customerName: "João Silva",
  customerEmail: "joao@email.com",
  customerPhone: "32999990000",
  customerDocument: "12345678901",
  shippingZipCode: "36010-000",
  shippingStreet: "Rua Halfeld",
  shippingNumber: "5",
};

const CREATED_CHECKOUT_PAYMENT = {
  id: "cp-1",
  externalReference: "STORE-ABC-XYZ",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function setupTransactionMock() {
  let callCount = 0;

  mocks.prisma.$transaction.mockImplementation(
    async (fn: (tx: typeof mocks.tx) => Promise<unknown>) => {
      callCount += 1;

      if (callCount === 1) {
        // First transaction: create order + checkout payment
        mocks.tx.cartItem.findMany.mockResolvedValue([PREPARED_ITEM]);
        mocks.tx.order.findUnique.mockResolvedValue(null); // no duplicate order number
        mocks.tx.order.create.mockResolvedValue(CREATED_ORDER);
        mocks.tx.checkoutPayment.create.mockResolvedValue(CREATED_CHECKOUT_PAYMENT);

        const result = await fn(mocks.tx);
        return result;
      }

      // Second transaction: update checkout payment + clear cart
      mocks.tx.checkoutPayment.update.mockResolvedValue({});
      mocks.tx.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      return fn(mocks.tx);
    },
  );
}

function setupGuestPickupCreditCard() {
  mocks.getOptionalSession.mockResolvedValue(null);
  mocks.prisma.user.findUnique.mockResolvedValue(null);
  mocks.getActiveCartId.mockResolvedValue("cart-1");
  mocks.resolvePaymentProvider.mockReturnValue(PaymentProvider.MERCADO_PAGO);
  mocks.getAppUrl.mockReturnValue("https://example.com");
  mocks.getMercadoPagoWebhookUrl.mockReturnValue(
    "https://example.com/api/mercadopago/webhook",
  );
  mocks.buildMercadoPagoReturnUrls.mockReturnValue({
    successUrl: "https://example.com/checkout/sucesso",
    pendingUrl: "https://example.com/checkout/sucesso",
    failureUrl: "https://example.com/checkout/falha",
  });
  mocks.createMercadoPagoPreference.mockResolvedValue({
    preferenceId: "pref-123",
    checkoutUrl: "https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref-123",
    rawPayload: {},
  });
  mocks.logAuditEvent.mockResolvedValue(undefined);

  setupTransactionMock();
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe("createStoreCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws ConflictError when cart is empty (no cart ID)", async () => {
    mocks.getOptionalSession.mockResolvedValue(null);
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.getActiveCartId.mockResolvedValue(null);
    mocks.resolvePaymentProvider.mockReturnValue(PaymentProvider.MERCADO_PAGO);
    mocks.getAppUrl.mockReturnValue("https://example.com");
    mocks.buildMercadoPagoReturnUrls.mockReturnValue({
      successUrl: "https://example.com/checkout/sucesso",
      pendingUrl: "https://example.com/checkout/sucesso",
      failureUrl: "https://example.com/checkout/falha",
    });

    await expect(
      createStoreCheckoutSession(GUEST_INPUT, { userId: null }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws ConflictError when guest has no guest data provided", async () => {
    mocks.getOptionalSession.mockResolvedValue(null);
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.getActiveCartId.mockResolvedValue("cart-1");
    mocks.resolvePaymentProvider.mockReturnValue(PaymentProvider.MERCADO_PAGO);
    mocks.getAppUrl.mockReturnValue("https://example.com");
    mocks.buildMercadoPagoReturnUrls.mockReturnValue({
      successUrl: "https://example.com/checkout/sucesso",
      pendingUrl: "https://example.com/checkout/sucesso",
      failureUrl: "https://example.com/checkout/falha",
    });

    await expect(
      createStoreCheckoutSession(
        { ...GUEST_INPUT, guest: undefined },
        { userId: null },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws ForbiddenError when context userId does not match session user", async () => {
    mocks.getOptionalSession.mockResolvedValue({ user: { id: "user-A" } });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-A",
      name: "Alice",
      email: "alice@example.com",
      phone: null,
      role: "STUDENT",
      studentProfile: null,
    });
    mocks.getActiveCartId.mockResolvedValue("cart-1");
    mocks.resolvePaymentProvider.mockReturnValue(PaymentProvider.MERCADO_PAGO);
    mocks.getAppUrl.mockReturnValue("https://example.com");
    mocks.buildMercadoPagoReturnUrls.mockReturnValue({
      successUrl: "https://example.com/checkout/sucesso",
      pendingUrl: "https://example.com/checkout/sucesso",
      failureUrl: "https://example.com/checkout/falha",
    });

    await expect(
      createStoreCheckoutSession(GUEST_INPUT, {
        userId: "user-B", // mismatch!
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws ConflictError when selected delivery method is unavailable", async () => {
    mocks.getOptionalSession.mockResolvedValue(null);
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.getActiveCartId.mockResolvedValue("cart-1");
    mocks.resolvePaymentProvider.mockReturnValue(PaymentProvider.MERCADO_PAGO);
    mocks.getAppUrl.mockReturnValue("https://example.com");
    mocks.buildMercadoPagoReturnUrls.mockReturnValue({
      successUrl: "https://example.com/checkout/sucesso",
      pendingUrl: "https://example.com/checkout/sucesso",
      failureUrl: "https://example.com/checkout/falha",
    });

    // Transaction returns cart items but delivery method doesn't match any option
    mocks.prisma.$transaction.mockImplementation(
      async (fn: (tx: typeof mocks.tx) => Promise<unknown>) => {
        mocks.tx.cartItem.findMany.mockResolvedValue([PREPARED_ITEM]);
        mocks.tx.order.findUnique.mockResolvedValue(null);
        return fn(mocks.tx);
      },
    );

    // Request LOCAL_DELIVERY for a non-local address (no address provided at all)
    await expect(
      createStoreCheckoutSession(
        {
          ...GUEST_INPUT,
          deliveryMethod: DeliveryMethod.LOCAL_DELIVERY,
          address: {
            recipientName: "João",
            recipientPhone: "32999990000",
            zipCode: "01310-100",
            state: "SP",
            city: "São Paulo",
            district: "Bela Vista",
            street: "Av. Paulista",
            number: "1234",
            complement: undefined,
            reference: undefined,
            label: undefined,
          },
        },
        { userId: null },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws ConflictError when coupon validation fails", async () => {
    mocks.getOptionalSession.mockResolvedValue(null);
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.getActiveCartId.mockResolvedValue("cart-1");
    mocks.resolvePaymentProvider.mockReturnValue(PaymentProvider.MERCADO_PAGO);
    mocks.getAppUrl.mockReturnValue("https://example.com");
    mocks.buildMercadoPagoReturnUrls.mockReturnValue({
      successUrl: "https://example.com/checkout/sucesso",
      pendingUrl: "https://example.com/checkout/sucesso",
      failureUrl: "https://example.com/checkout/falha",
    });
    mocks.validateCouponForItems.mockResolvedValue({
      ok: false,
      message: "Cupom expirou.",
    });

    mocks.prisma.$transaction.mockImplementation(
      async (fn: (tx: typeof mocks.tx) => Promise<unknown>) => {
        mocks.tx.cartItem.findMany.mockResolvedValue([PREPARED_ITEM]);
        mocks.tx.order.findUnique.mockResolvedValue(null);
        return fn(mocks.tx);
      },
    );

    await expect(
      createStoreCheckoutSession(
        { ...GUEST_INPUT, couponCode: "EXPIRED" },
        { userId: null },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("succeeds with MercadoPago credit card and returns redirectUrl + orderId", async () => {
    setupGuestPickupCreditCard();

    const result = await createStoreCheckoutSession(GUEST_INPUT, { userId: null });

    expect(result.orderId).toBe("order-1");
    expect(result.orderNumber).toBe("PED-20250615-1234");
    expect(result.totalCents).toBe(8900);
    expect(result.redirectUrl).toContain("mercadopago.com");
    expect(mocks.createMercadoPagoPreference).toHaveBeenCalled();
  });

  it("passes externalReference and customer data to MercadoPago preference", async () => {
    setupGuestPickupCreditCard();

    await createStoreCheckoutSession(GUEST_INPUT, { userId: null });

    expect(mocks.createMercadoPagoPreference).toHaveBeenCalledWith(
      expect.objectContaining({
        externalReference: CREATED_CHECKOUT_PAYMENT.externalReference,
        payer: expect.objectContaining({
          email: "joao@email.com",
        }),
      }),
    );
  });

  it("succeeds with Pix and redirects to /checkout/pix page", async () => {
    mocks.getOptionalSession.mockResolvedValue(null);
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.getActiveCartId.mockResolvedValue("cart-1");
    mocks.resolvePaymentProvider.mockReturnValue(PaymentProvider.ABACATEPAY);
    mocks.getAppUrl.mockReturnValue("https://example.com");
    mocks.getMercadoPagoWebhookUrl.mockReturnValue(
      "https://example.com/api/mercadopago/webhook",
    );
    mocks.buildMercadoPagoReturnUrls.mockReturnValue({
      successUrl: "https://example.com/checkout/sucesso",
      pendingUrl: "https://example.com/checkout/sucesso",
      failureUrl: "https://example.com/checkout/falha",
    });
    mocks.createAbacatePayPixQrCode.mockResolvedValue({
      id: "pix-bill-1",
      status: "ACTIVE",
      brCode: "00020101...",
      brCodeBase64: "base64-qr",
    });
    mocks.logAuditEvent.mockResolvedValue(undefined);

    setupTransactionMock();

    const result = await createStoreCheckoutSession(
      { ...GUEST_INPUT, paymentMethod: PaymentMethod.PIX },
      { userId: null },
    );

    expect(result.redirectUrl).toContain("/checkout/pix");
    expect(result.redirectUrl).toContain(CREATED_CHECKOUT_PAYMENT.id);
    expect(mocks.createAbacatePayPixQrCode).toHaveBeenCalled();
    expect(mocks.createMercadoPagoPreference).not.toHaveBeenCalled();
  });

  it("clears the cart items in the second transaction after payment creation", async () => {
    setupGuestPickupCreditCard();

    await createStoreCheckoutSession(GUEST_INPUT, { userId: null });

    expect(mocks.tx.cartItem.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ cartId: "cart-1" }),
      }),
    );
  });

  it("updates checkout payment with providerPreferenceId and checkoutUrl", async () => {
    setupGuestPickupCreditCard();

    await createStoreCheckoutSession(GUEST_INPUT, { userId: null });

    expect(mocks.tx.checkoutPayment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CREATED_CHECKOUT_PAYMENT.id },
        data: expect.objectContaining({
          providerPreferenceId: "pref-123",
          checkoutUrl: expect.stringContaining("mercadopago"),
        }),
      }),
    );
  });

  it("creates an order with PENDING status and correct total", async () => {
    setupGuestPickupCreditCard();

    await createStoreCheckoutSession(GUEST_INPUT, { userId: null });

    expect(mocks.tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          customerName: "João Silva",
          customerEmail: "joao@email.com",
        }),
      }),
    );
  });

  it("creates a CheckoutPayment with STORE_ORDER kind", async () => {
    setupGuestPickupCreditCard();

    await createStoreCheckoutSession(GUEST_INPUT, { userId: null });

    expect(mocks.tx.checkoutPayment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          kind: CheckoutPaymentKind.STORE_ORDER,
          provider: PaymentProvider.MERCADO_PAGO,
          userId: null,
        }),
      }),
    );
  });

  it("emits a STORE_ORDER_CHECKOUT_CREATED audit event", async () => {
    setupGuestPickupCreditCard();

    await createStoreCheckoutSession(GUEST_INPUT, { userId: null });

    expect(mocks.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "STORE_ORDER_CHECKOUT_CREATED",
        entityId: CREATED_ORDER.id,
      }),
    );
  });
});
