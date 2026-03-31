import {
  CouponDiscountType,
  DeliveryMethod,
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

export const STORE_CART_COOKIE = "maquinateam-store-cart";
export const STORE_CART_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const CATALOG_SORT_OPTIONS = [
  { value: "featured", label: "Destaques" },
  { value: "newest", label: "Mais recentes" },
  { value: "price_asc", label: "Menor preco" },
  { value: "price_desc", label: "Maior preco" },
  { value: "name_asc", label: "Nome A-Z" },
] as const;

export type CatalogSortValue = (typeof CATALOG_SORT_OPTIONS)[number]["value"];

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  [DeliveryMethod.PICKUP]: "Retirada na academia",
  [DeliveryMethod.LOCAL_DELIVERY]: "Entrega local",
  [DeliveryMethod.STANDARD_SHIPPING]: "Envio padrao",
};

export const DELIVERY_METHOD_DESCRIPTIONS: Record<DeliveryMethod, string> = {
  [DeliveryMethod.PICKUP]:
    "Retire diretamente na recepcao da Maquina Team, sem custo de frete.",
  [DeliveryMethod.LOCAL_DELIVERY]:
    "Entrega local para Juiz de Fora e arredores, com prazo curto.",
  [DeliveryMethod.STANDARD_SHIPPING]:
    "Envio padrao para outras cidades com valor calculado por regra interna.",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "Pendente",
  [OrderStatus.CONFIRMED]: "Confirmado",
  [OrderStatus.PAID]: "Pago",
  [OrderStatus.PROCESSING]: "Em separacao",
  [OrderStatus.SHIPPED]: "Enviado",
  [OrderStatus.DELIVERED]: "Entregue",
  [OrderStatus.CANCELLED]: "Cancelado",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: "Pendente",
  [PaymentStatus.PAID]: "Pago",
  [PaymentStatus.FAILED]: "Falhou",
  [PaymentStatus.CANCELLED]: "Cancelado",
  [PaymentStatus.REFUNDED]: "Estornado",
};

export const COUPON_DISCOUNT_TYPE_LABELS: Record<CouponDiscountType, string> = {
  [CouponDiscountType.PERCENTAGE]: "Percentual",
  [CouponDiscountType.FIXED_AMOUNT]: "Valor fixo",
};

export function getOrderStatusLabel(status: OrderStatus) {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function getPaymentStatusLabel(status: PaymentStatus) {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

export function getDeliveryMethodLabel(method: DeliveryMethod) {
  return DELIVERY_METHOD_LABELS[method] ?? method;
}

export function getCouponDiscountTypeLabel(type: CouponDiscountType) {
  return COUPON_DISCOUNT_TYPE_LABELS[type] ?? type;
}

export function getOrderStatusTone(status: OrderStatus) {
  switch (status) {
    case OrderStatus.PAID:
    case OrderStatus.DELIVERED:
      return "success" as const;
    case OrderStatus.CONFIRMED:
    case OrderStatus.PROCESSING:
    case OrderStatus.SHIPPED:
      return "info" as const;
    case OrderStatus.CANCELLED:
      return "danger" as const;
    case OrderStatus.PENDING:
    default:
      return "warning" as const;
  }
}

export function getPaymentStatusTone(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.PAID:
      return "success" as const;
    case PaymentStatus.REFUNDED:
    case PaymentStatus.CANCELLED:
      return "neutral" as const;
    case PaymentStatus.FAILED:
      return "danger" as const;
    case PaymentStatus.PENDING:
    default:
      return "warning" as const;
  }
}

export function formatCouponValue(input: {
  discountType: CouponDiscountType;
  discountValue: number;
}) {
  if (input.discountType === CouponDiscountType.PERCENTAGE) {
    return `${input.discountValue}%`;
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(input.discountValue / 100);
}
