import {
  CouponDiscountType,
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
} from "@prisma/client";
import { z } from "zod";
import { CATALOG_SORT_OPTIONS } from "@/lib/store/constants";

const optionalTrimmedString = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim().length === 0 ? undefined : value,
  z.string().trim().max(255).optional(),
);

const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim().length === 0 ? undefined : value,
  z.string().trim().max(4000).optional(),
);

const optionalInteger = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") {
      return undefined;
    }

    if (typeof value === "string") {
      return Number(value);
    }

    return value;
  },
  z.number().int().optional(),
);

const optionalBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }
  }

  return value;
}, z.boolean().optional());

const currencyField = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") {
      return undefined;
    }

    if (typeof value === "number") {
      return Math.round(value * 100);
    }

    if (typeof value === "string") {
      const normalized = Number(value.replace(",", "."));
      if (Number.isNaN(normalized)) {
        return Number.NaN;
      }

      return Math.round(normalized * 100);
    }

    return value;
  },
  z.number().int("Informe um valor monetario valido.").nonnegative(),
);

export const catalogFiltersSchema = z.object({
  q: optionalTrimmedString,
  category: optionalTrimmedString,
  availability: z.enum(["all", "in_stock", "low_stock"]).optional().default("all"),
  sort: z
    .enum(CATALOG_SORT_OPTIONS.map((option) => option.value) as [string, ...string[]])
    .optional()
    .default("featured"),
  priceMin: optionalInteger
    .refine((value) => value === undefined || value >= 0, "Valor minimo invalido.")
    .optional(),
  priceMax: optionalInteger
    .refine((value) => value === undefined || value >= 0, "Valor maximo invalido.")
    .optional(),
});

export const cartItemMutationSchema = z.object({
  productId: z.string().min(1, "Produto obrigatorio."),
  quantity: z.preprocess(
    (value) => {
      if (typeof value === "string") {
        return Number(value);
      }

      return value;
    },
    z.number().int().positive("Quantidade invalida."),
  ),
});

export const wishlistMutationSchema = z.object({
  productId: z.string().min(1, "Produto obrigatorio."),
});

export const updateCartItemSchema = z.object({
  quantity: z.preprocess(
    (value) => {
      if (typeof value === "string") {
        return Number(value);
      }

      return value;
    },
    z.number().int().positive("Quantidade invalida."),
  ),
});

export const shippingAddressInputSchema = z.object({
  label: optionalTrimmedString,
  recipientName: z.string().trim().min(2, "Informe o destinatario."),
  recipientPhone: z.string().trim().min(8, "Informe um telefone valido."),
  zipCode: z.string().trim().min(8, "Informe um CEP valido."),
  state: z.string().trim().min(2, "Informe o estado."),
  city: z.string().trim().min(2, "Informe a cidade."),
  district: z.string().trim().min(2, "Informe o bairro."),
  street: z.string().trim().min(2, "Informe a rua."),
  number: z.string().trim().min(1, "Informe o numero."),
  complement: optionalTrimmedString,
  reference: optionalTrimmedString,
});

export const shippingQuoteSchema = z.object({
  address: shippingAddressInputSchema,
});

export const applyCouponSchema = z.object({
  code: z.string().trim().min(3, "Informe um cupom valido.").max(50),
});

export const checkoutSchema = z.object({
  deliveryMethod: z.nativeEnum(DeliveryMethod),
  address: shippingAddressInputSchema.optional(),
  shippingAddressId: optionalTrimmedString,
  saveAddress: optionalBoolean.default(true),
  couponCode: optionalTrimmedString,
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.PIX),
  notes: optionalText,
});

export const couponFiltersSchema = z.object({
  q: optionalTrimmedString,
  active: z.enum(["all", "true", "false"]).optional().default("all"),
});

export const couponSchema = z.object({
  code: z.string().trim().min(3, "Informe um codigo valido.").max(32),
  description: optionalText,
  discountType: z.nativeEnum(CouponDiscountType),
  discountValue: z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") {
        return undefined;
      }

      if (typeof value === "number") {
        return value;
      }

      if (typeof value === "string") {
        const normalized = Number(value.replace(",", "."));
        return normalized;
      }

      return value;
    },
    z.number().positive("Informe um valor de desconto valido."),
  ),
  active: optionalBoolean.default(true),
  usageLimit: optionalInteger
    .refine((value) => value === undefined || value > 0, "Limite invalido.")
    .optional(),
  perUserLimit: optionalInteger
    .refine((value) => value === undefined || value > 0, "Limite por usuario invalido.")
    .optional(),
  minOrderValueCents: currencyField.optional(),
  eligibleCategories: z.array(z.string().trim().min(2)).default([]),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const createCouponSchema = couponSchema;

export const updateCouponSchema = couponSchema.extend({
  id: z.string().min(1),
});

export const orderFiltersSchema = z.object({
  q: optionalTrimmedString,
  status: z.union([z.literal("all"), z.nativeEnum(OrderStatus)]).optional().default("all"),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: optionalText,
  trackingCode: optionalTrimmedString,
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED"]).optional(),
});
