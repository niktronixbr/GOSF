import { api } from "./client";

export interface BillingStatus {
  slug: string;
  status: "TRIAL" | "ACTIVE" | "SUSPENDED" | "INACTIVE";
  planName: string | null;
  billingInterval: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
}

export const billingApi = {
  getStatus: () => api.get<BillingStatus>("/billing/status"),
  createCheckoutSession: (planName: string, interval: string) =>
    api.post<{ url: string }>("/billing/checkout", { planName, interval }),
  createPortalSession: () =>
    api.post<{ url: string }>("/billing/portal", {}),
};
