import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductStatus } from "@prisma/client";
import { ConflictError, NotFoundError } from "@/lib/errors";

// ─── mocks must be hoisted before any imports ───────────────────────────────
const mocks = vi.hoisted(() => {
  const cookieStore = {
    get: vi.fn(),
    set: vi.fn(),
  };

  return {
    prisma: {
      product: {
        findUnique: vi.fn(),
      },
      cart: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      cartItem: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      $transaction: vi.fn(),
    },
    cookieStore,
    getOptionalSession: vi.fn(),
    isLowStockProduct: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/auth/session", () => ({
  getOptionalSession: mocks.getOptionalSession,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mocks.cookieStore),
}));

vi.mock("@/lib/commerce/constants", () => ({
  isLowStockProduct: mocks.isLowStockProduct,
}));

import { addCartItem, removeCartItem, updateCartItemQuantity } from "@/lib/store/cart";

// ─── shared fixtures ─────────────────────────────────────────────────────────

function buildProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "prod-1",
    name: "Luva de Boxe",
    slug: "luva-de-boxe",
    priceCents: 8900,
    status: ProductStatus.ACTIVE,
    storeVisible: true,
    trackInventory: false,
    stockQuantity: 10,
    lowStockThreshold: 2,
    images: [],
    ...overrides,
  };
}

function buildCart(overrides: Record<string, unknown> = {}) {
  return {
    id: "cart-1",
    userId: null,
    sessionToken: "tok-abc",
    expiresAt: null,
    ...overrides,
  };
}

const GUEST_CART = buildCart();
const GUEST_CART_ITEM = { id: "item-1", productId: "prod-1", quantity: 1 };

// ─── helpers to set a "guest session" (no user, token in cookie) ─────────────

function asGuest() {
  mocks.getOptionalSession.mockResolvedValue(null);
  mocks.cookieStore.get.mockReturnValue({ value: "tok-abc" });
  mocks.prisma.cart.findUnique.mockResolvedValue(GUEST_CART);
  mocks.prisma.cart.upsert.mockResolvedValue(GUEST_CART);
}

// ─── addCartItem ─────────────────────────────────────────────────────────────

describe("addCartItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isLowStockProduct.mockReturnValue(false);
    mocks.prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn(mocks.prisma),
    );

    // Default snapshot: empty cart
    mocks.prisma.cartItem.findMany.mockResolvedValue([]);
  });

  it("throws ConflictError when product is not found", async () => {
    asGuest();
    mocks.prisma.product.findUnique.mockResolvedValue(null);

    await expect(
      addCartItem({ productId: "prod-missing", quantity: 1 }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws ConflictError when product is archived", async () => {
    asGuest();
    mocks.prisma.product.findUnique.mockResolvedValue(
      buildProduct({ status: ProductStatus.ARCHIVED }),
    );

    await expect(
      addCartItem({ productId: "prod-1", quantity: 1 }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws ConflictError when product is store-hidden", async () => {
    asGuest();
    mocks.prisma.product.findUnique.mockResolvedValue(
      buildProduct({ storeVisible: false }),
    );

    await expect(
      addCartItem({ productId: "prod-1", quantity: 1 }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws ConflictError when requested quantity exceeds tracked stock", async () => {
    asGuest();
    mocks.prisma.product.findUnique.mockResolvedValue(
      buildProduct({ trackInventory: true, stockQuantity: 3 }),
    );
    // already 2 in cart
    mocks.prisma.cartItem.findUnique.mockResolvedValue({
      id: "item-1",
      quantity: 2,
    });

    await expect(
      addCartItem({ productId: "prod-1", quantity: 2 }), // total would be 4 > 3
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("allows adding when product has no inventory tracking", async () => {
    asGuest();
    mocks.prisma.product.findUnique.mockResolvedValue(
      buildProduct({ trackInventory: false, stockQuantity: 0 }),
    );
    mocks.prisma.cartItem.findUnique.mockResolvedValue(null);
    mocks.prisma.cartItem.upsert.mockResolvedValue(GUEST_CART_ITEM);

    await expect(
      addCartItem({ productId: "prod-1", quantity: 99 }),
    ).resolves.toBeDefined();
  });

  it("upserts cart item with correct new quantity when no prior item exists", async () => {
    asGuest();
    mocks.prisma.product.findUnique.mockResolvedValue(buildProduct());
    mocks.prisma.cartItem.findUnique.mockResolvedValue(null);
    mocks.prisma.cartItem.upsert.mockResolvedValue(GUEST_CART_ITEM);

    await addCartItem({ productId: "prod-1", quantity: 3 });

    expect(mocks.prisma.cartItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ quantity: 3 }),
        create: expect.objectContaining({ quantity: 3 }),
      }),
    );
  });

  it("accumulates quantity when item already exists in cart", async () => {
    asGuest();
    mocks.prisma.product.findUnique.mockResolvedValue(buildProduct());
    mocks.prisma.cartItem.findUnique.mockResolvedValue({ id: "item-1", quantity: 2 });
    mocks.prisma.cartItem.upsert.mockResolvedValue({ ...GUEST_CART_ITEM, quantity: 5 });

    await addCartItem({ productId: "prod-1", quantity: 3 });

    expect(mocks.prisma.cartItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ quantity: 5 }), // 2 + 3
      }),
    );
  });

  it("throws NotFoundError when no cart can be created (no session, no cookie)", async () => {
    mocks.getOptionalSession.mockResolvedValue(null);
    mocks.cookieStore.get.mockReturnValue(undefined);
    mocks.prisma.product.findUnique.mockResolvedValue(buildProduct());
    mocks.prisma.cart.upsert.mockResolvedValue(null);
    mocks.prisma.cart.findUnique.mockResolvedValue(null);

    // getOrCreateActiveCart can return null when there is no session and no cookie
    // and the upsert returns null — expect NotFoundError
    mocks.prisma.cart.upsert.mockResolvedValue(null as unknown as typeof GUEST_CART);

    await expect(
      addCartItem({ productId: "prod-1", quantity: 1 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

// ─── removeCartItem ───────────────────────────────────────────────────────────

describe("removeCartItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isLowStockProduct.mockReturnValue(false);
    mocks.prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn(mocks.prisma),
    );
    mocks.prisma.cartItem.findMany.mockResolvedValue([]);
  });

  it("throws NotFoundError when cart does not exist", async () => {
    mocks.getOptionalSession.mockResolvedValue(null);
    mocks.cookieStore.get.mockReturnValue(undefined);
    mocks.prisma.cart.findUnique.mockResolvedValue(null);

    await expect(removeCartItem("item-1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws NotFoundError when item does not belong to the cart", async () => {
    asGuest();
    mocks.prisma.cartItem.findFirst.mockResolvedValue(null);

    await expect(removeCartItem("item-missing")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("deletes the item and returns updated snapshot", async () => {
    asGuest();
    mocks.prisma.cartItem.findFirst.mockResolvedValue({ id: "item-1" });
    mocks.prisma.cartItem.delete.mockResolvedValue({ id: "item-1" });

    await removeCartItem("item-1");

    expect(mocks.prisma.cartItem.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "item-1" },
      }),
    );
  });

  it("queries item scoped to the active cart id", async () => {
    asGuest();
    mocks.prisma.cartItem.findFirst.mockResolvedValue({ id: "item-1" });
    mocks.prisma.cartItem.delete.mockResolvedValue({ id: "item-1" });

    await removeCartItem("item-1");

    expect(mocks.prisma.cartItem.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "item-1",
          cartId: GUEST_CART.id,
        }),
      }),
    );
  });
});

// ─── updateCartItemQuantity ───────────────────────────────────────────────────

describe("updateCartItemQuantity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isLowStockProduct.mockReturnValue(false);
    mocks.prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn(mocks.prisma),
    );
    mocks.prisma.cartItem.findMany.mockResolvedValue([]);
  });

  it("throws NotFoundError when cart does not exist", async () => {
    mocks.getOptionalSession.mockResolvedValue(null);
    mocks.cookieStore.get.mockReturnValue(undefined);
    mocks.prisma.cart.findUnique.mockResolvedValue(null);

    await expect(
      updateCartItemQuantity("item-1", 2),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws NotFoundError when item is not in the cart", async () => {
    asGuest();
    mocks.prisma.cartItem.findFirst.mockResolvedValue(null);

    await expect(
      updateCartItemQuantity("item-missing", 2),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ConflictError when new quantity exceeds tracked stock", async () => {
    asGuest();
    mocks.prisma.cartItem.findFirst.mockResolvedValue({
      id: "item-1",
      productId: "prod-1",
    });
    mocks.prisma.product.findUnique.mockResolvedValue(
      buildProduct({ trackInventory: true, stockQuantity: 2 }),
    );

    await expect(
      updateCartItemQuantity("item-1", 5),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("updates quantity when within stock limits", async () => {
    asGuest();
    mocks.prisma.cartItem.findFirst.mockResolvedValue({
      id: "item-1",
      productId: "prod-1",
    });
    mocks.prisma.product.findUnique.mockResolvedValue(
      buildProduct({ trackInventory: true, stockQuantity: 10 }),
    );
    mocks.prisma.cartItem.update.mockResolvedValue({ id: "item-1", quantity: 4 });

    await updateCartItemQuantity("item-1", 4);

    expect(mocks.prisma.cartItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "item-1" },
        data: { quantity: 4 },
      }),
    );
  });

  it("updates without stock check when trackInventory is false", async () => {
    asGuest();
    mocks.prisma.cartItem.findFirst.mockResolvedValue({
      id: "item-1",
      productId: "prod-1",
    });
    mocks.prisma.product.findUnique.mockResolvedValue(
      buildProduct({ trackInventory: false }),
    );
    mocks.prisma.cartItem.update.mockResolvedValue({ id: "item-1", quantity: 99 });

    await expect(
      updateCartItemQuantity("item-1", 99),
    ).resolves.toBeDefined();
  });
});
