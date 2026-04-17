import { beforeEach, describe, expect, it, vi } from "vitest";
import { CouponDiscountType } from "@prisma/client";

const mocks = vi.hoisted(() => {
  const db = {
    coupon: {
      findFirst: vi.fn(),
    },
    couponRedemption: {
      count: vi.fn(),
    },
  };

  return {
    prisma: {
      coupon: {
        findFirst: vi.fn(),
      },
      couponRedemption: {
        count: vi.fn(),
      },
    },
    db,
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

import { validateCouponForItems } from "@/lib/store/coupons";

const NOW = new Date("2025-06-15T12:00:00.000Z");

const BASE_ITEMS = [
  { productId: "p1", category: "luvas", quantity: 2, unitPriceCents: 5000 },
];

function buildCoupon(overrides: Record<string, unknown> = {}) {
  return {
    id: "coupon-1",
    code: "DESCONTO10",
    active: true,
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 10,
    startsAt: null,
    expiresAt: null,
    usageLimit: null,
    usageCount: 0,
    perUserLimit: null,
    minOrderValueCents: null,
    eligibleCategories: [] as string[],
    ...overrides,
  };
}

describe("validateCouponForItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.coupon.findFirst.mockResolvedValue(null);
    mocks.prisma.couponRedemption.count.mockResolvedValue(0);
  });

  it("returns invalid when code is empty", async () => {
    const result = await validateCouponForItems({
      code: "   ",
      items: BASE_ITEMS,
      now: NOW,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/invalido/i);
    expect(mocks.prisma.coupon.findFirst).not.toHaveBeenCalled();
  });

  it("returns invalid when items array is empty", async () => {
    const result = await validateCouponForItems({
      code: "DESCONTO10",
      items: [],
      now: NOW,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/invalido/i);
    expect(mocks.prisma.coupon.findFirst).not.toHaveBeenCalled();
  });

  it("returns invalid when coupon does not exist", async () => {
    mocks.prisma.coupon.findFirst.mockResolvedValue(null);

    const result = await validateCouponForItems({
      code: "INEXISTENTE",
      items: BASE_ITEMS,
      now: NOW,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/inexistente|inativo/i);
  });

  it("returns invalid when coupon is inactive", async () => {
    mocks.prisma.coupon.findFirst.mockResolvedValue(buildCoupon({ active: false }));

    const result = await validateCouponForItems({
      code: "DESCONTO10",
      items: BASE_ITEMS,
      now: NOW,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/inexistente|inativo/i);
  });

  it("returns invalid when coupon has not started yet", async () => {
    const future = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);
    mocks.prisma.coupon.findFirst.mockResolvedValue(
      buildCoupon({ startsAt: future }),
    );

    const result = await validateCouponForItems({
      code: "DESCONTO10",
      items: BASE_ITEMS,
      now: NOW,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/ainda nao esta disponivel/i);
  });

  it("returns invalid when coupon has expired", async () => {
    const past = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);
    mocks.prisma.coupon.findFirst.mockResolvedValue(
      buildCoupon({ expiresAt: past }),
    );

    const result = await validateCouponForItems({
      code: "DESCONTO10",
      items: BASE_ITEMS,
      now: NOW,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/expirou/i);
  });

  it("returns invalid when global usage limit has been reached", async () => {
    mocks.prisma.coupon.findFirst.mockResolvedValue(
      buildCoupon({ usageLimit: 5, usageCount: 5 }),
    );

    const result = await validateCouponForItems({
      code: "DESCONTO10",
      items: BASE_ITEMS,
      now: NOW,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/limite total/i);
  });

  it("returns invalid when per-user limit has been reached", async () => {
    mocks.prisma.coupon.findFirst.mockResolvedValue(
      buildCoupon({ perUserLimit: 2 }),
    );
    mocks.prisma.couponRedemption.count.mockResolvedValue(2);

    const result = await validateCouponForItems({
      code: "DESCONTO10",
      userId: "user-1",
      items: BASE_ITEMS,
      now: NOW,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/limite permitido/i);
    expect(mocks.prisma.couponRedemption.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          couponId: "coupon-1",
          userId: "user-1",
        }),
      }),
    );
  });

  it("skips per-user check when userId is absent", async () => {
    mocks.prisma.coupon.findFirst.mockResolvedValue(
      buildCoupon({ perUserLimit: 2 }),
    );

    const result = await validateCouponForItems({
      code: "DESCONTO10",
      items: BASE_ITEMS,
      now: NOW,
    });

    expect(result.ok).toBe(true);
    expect(mocks.prisma.couponRedemption.count).not.toHaveBeenCalled();
  });

  it("returns invalid when no eligible items match coupon categories", async () => {
    mocks.prisma.coupon.findFirst.mockResolvedValue(
      buildCoupon({ eligibleCategories: ["shorts"] }),
    );

    const result = await validateCouponForItems({
      code: "DESCONTO10",
      items: BASE_ITEMS, // category: luvas
      now: NOW,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/nao se aplica/i);
  });

  it("returns invalid when eligible subtotal is below minimum order value", async () => {
    mocks.prisma.coupon.findFirst.mockResolvedValue(
      buildCoupon({ minOrderValueCents: 50000 }),
    );

    const result = await validateCouponForItems({
      code: "DESCONTO10",
      items: BASE_ITEMS, // 2 × 5000 = 10000 cents
      now: NOW,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/valor minimo/i);
  });

  it("returns ok with correct discount for a percentage coupon", async () => {
    mocks.prisma.coupon.findFirst.mockResolvedValue(
      buildCoupon({ discountType: CouponDiscountType.PERCENTAGE, discountValue: 20 }),
    );

    const result = await validateCouponForItems({
      code: "DESCONTO10",
      items: BASE_ITEMS, // 2 × 5000 = 10000 cents
      now: NOW,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.discountCents).toBe(2000); // 20% of 10000
      expect(result.eligibleSubtotalCents).toBe(10000);
    }
  });

  it("returns ok with correct discount for a fixed-value coupon", async () => {
    mocks.prisma.coupon.findFirst.mockResolvedValue(
      buildCoupon({
        discountType: CouponDiscountType.FIXED_AMOUNT,
        discountValue: 300, // 300 cents = R$ 3,00 stored as integer
      }),
    );

    const result = await validateCouponForItems({
      code: "DESCONTO10",
      items: BASE_ITEMS, // subtotal = 10000
      now: NOW,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.discountCents).toBe(300);
    }
  });

  it("caps discount at eligible subtotal so it never goes negative", async () => {
    mocks.prisma.coupon.findFirst.mockResolvedValue(
      buildCoupon({
        discountType: CouponDiscountType.FIXED_AMOUNT,
        discountValue: 999999, // absurdly large fixed discount
      }),
    );

    const result = await validateCouponForItems({
      code: "DESCONTO10",
      items: BASE_ITEMS,
      now: NOW,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.discountCents).toBe(10000); // capped at subtotal
    }
  });

  it("applies coupon only to eligible category items when filter is set", async () => {
    mocks.prisma.coupon.findFirst.mockResolvedValue(
      buildCoupon({
        discountType: CouponDiscountType.PERCENTAGE,
        discountValue: 50,
        eligibleCategories: ["luvas"],
      }),
    );

    const mixedItems = [
      { productId: "p1", category: "luvas", quantity: 1, unitPriceCents: 8000 },
      { productId: "p2", category: "shorts", quantity: 1, unitPriceCents: 4000 },
    ];

    const result = await validateCouponForItems({
      code: "DESCONTO10",
      items: mixedItems,
      now: NOW,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.eligibleSubtotalCents).toBe(8000);
      expect(result.discountCents).toBe(4000); // 50% of 8000 only
    }
  });

  it("uses injected db transaction instead of global prisma client", async () => {
    mocks.db.coupon.findFirst.mockResolvedValue(buildCoupon());
    mocks.db.couponRedemption.count.mockResolvedValue(0);

    const result = await validateCouponForItems({
      code: "DESCONTO10",
      items: BASE_ITEMS,
      now: NOW,
      db: mocks.db as unknown as typeof import("@/lib/prisma").prisma,
    });

    expect(result.ok).toBe(true);
    expect(mocks.db.coupon.findFirst).toHaveBeenCalled();
    expect(mocks.prisma.coupon.findFirst).not.toHaveBeenCalled();
  });

  it("normalizes coupon code to uppercase before lookup", async () => {
    mocks.prisma.coupon.findFirst.mockResolvedValue(buildCoupon({ code: "DESCONTO10" }));

    await validateCouponForItems({
      code: "desconto10",
      items: BASE_ITEMS,
      now: NOW,
    });

    expect(mocks.prisma.coupon.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ code: "DESCONTO10" }),
      }),
    );
  });
});
