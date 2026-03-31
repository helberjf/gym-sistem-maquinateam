export type UserRole = "ADMIN" | "INSTRUCTOR" | "STUDENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
}

export type PlanPeriod = "MONTHLY" | "SEMIANNUAL" | "ANNUAL" | "FULL";
export type PlanFrequency = "1x" | "2x" | "3x" | "UNLIMITED";

export interface Plan {
  id: string;
  name: string;
  period: PlanPeriod;
  frequency: PlanFrequency;
  priceMonthly: number;
  totalPrice: number;
  featured?: boolean;
  badge?: string;
  description?: string;
  benefits?: string[];
}

export type SubscriptionStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "OVERDUE"
  | "CANCELLED";

export interface Subscription {
  id: string;
  studentId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  paymentMethod?: string;
  mpPreferenceId?: string;
}

export type PaymentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "REFUNDED";

export interface Payment {
  id: string;
  subscriptionId: string;
  amount: number;
  status: PaymentStatus;
  mpPaymentId?: string;
  paidAt?: Date;
  createdAt: Date;
}

export interface CheckIn {
  id: string;
  studentId: string;
  checkInAt: Date;
  checkOutAt?: Date;
  notes?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
