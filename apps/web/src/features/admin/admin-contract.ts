
export type Days = "7" | "30" | "90";
export type Currency = "RUB" | "USD";
type PaidPlan = "pro" | "team";
type PaymentState = "pending" | "paid";
type ClientStatus = "active" | "blocked";

export type ClientModerationAction = "block" | "unblock" | "revoke-sessions";

export interface ClientModerationResult {
  id: string;
  status: ClientStatus;
  revoked_session_count: number;
}

export interface Client {
  id: string;
  email: string;
  created_at: number;
  status: ClientStatus;
  manageable: boolean;
  plan: "starter" | PaidPlan;
  expires_at: number | null;
  available_credits: number;
}

export interface Payment {
  id: string;
  pack_id: string;
  state: PaymentState;
  currency: Currency;
  amount_minor: number;
  plan_id: PaidPlan | null;
  duration_days: number;
  credits: number;
  created_at: number;
  paid_at: number | null;
}

export interface ListPage<T> {
  items: T[];
  page: number;
  has_next: boolean;
}

export interface Usage {
  as_of: number;
  days: number;
  ai: {
    succeeded: number;
    failed: number;
    provider_unknown: number;
    pending: number;
    running: number;
    deleted: number;
  };
  saved_audits: number;
  monitoring: { passed: number; changed: number; failed: number };
}

export interface Overview {
  as_of: number;
  days: number;
  users_total: number;
  registrations: Record<Days, number>;
  paid_access: Record<PaidPlan, number>;
  expiring_soon: number;
  payments: Array<{ currency: Currency; count: number; amount_minor: number }>;
  payments_without_date: number;
  available_credits: number;
  usage: Usage;
}

export type ClientFilters = { days: Days | ""; segment: "" | PaidPlan | "expiring"; email: string };
export type PaymentFilters = {
  days: Days | "";
  date_basis: "created" | "paid" | "unknown";
  state: PaymentState | "";
  currency: Currency | "";
  kind: PaidPlan | "credits" | "";
};
