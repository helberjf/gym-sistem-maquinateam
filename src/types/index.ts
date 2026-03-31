// ============================================================
// Tipos globais do sistema Maquina Team
// ============================================================

// --- Usuários / Auth ---
export type UserRole = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
}

// --- Planos ---
export type PlanPeriod = 'MONTHLY' | 'SEMIANNUAL' | 'ANNUAL' | 'FULL';
export type PlanFrequency = '1x' | '2x' | '3x' | 'UNLIMITED';

export interface Plan {
  id: string;            // ex: "plan_1"
  name: string;          // ex: "Mensal 1x"
  period: PlanPeriod;
  frequency: PlanFrequency;
  priceMonthly: number;  // preço mensal de referência
  totalPrice: number;    // total a cobrar
  featured?: boolean;
  badge?: string;
}

// --- Matrícula / Assinatura ---
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'OVERDUE' | 'CANCELLED';

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

// --- Pagamento ---
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED';

export interface Payment {
  id: string;
  subscriptionId: string;
  amount: number;
  status: PaymentStatus;
  mpPaymentId?: string;
  paidAt?: Date;
  createdAt: Date;
}

// --- Check-in ---
export interface CheckIn {
  id: string;
  studentId: string;
  checkInAt: Date;
  checkOutAt?: Date;
  notes?: string;
}

// --- API responses ---
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
