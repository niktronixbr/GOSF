"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { billingApi } from "@/lib/api/billing";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SkeletonStatCard } from "@/components/ui/skeleton";

const billingStatusVariant: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  TRIAL: "warning",
  ACTIVE: "success",
  SUSPENDED: "danger",
  INACTIVE: "neutral",
};

const billingStatusLabel: Record<string, string> = {
  TRIAL: "Em trial",
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
  INACTIVE: "Cancelado",
};

const planLabels: Record<string, string> = {
  starter: "Starter",
  escola: "Escola",
  enterprise: "Enterprise",
};

export default function AdminBillingPage() {
  const [portalLoading, setPortalLoading] = useState(false);

  const { data: billing, isLoading } = useQuery({
    queryKey: ["billing-status"],
    queryFn: () => billingApi.getStatus(),
  });

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const { url } = await billingApi.createPortalSession();
      window.location.href = url;
    } catch (err) {
      const detail = err instanceof ApiError ? err.message : null;
      toast.error(
        detail ?? "Não foi possível abrir o portal de assinatura.",
        { duration: 8000 },
      );
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assinatura</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Plano contratado e informações de cobrança.
        </p>
      </div>

      {isLoading ? (
        <SkeletonStatCard />
      ) : !billing ? (
        <div className="rounded-2xl border border-outline-variant bg-surface p-6 text-sm text-muted-foreground">
          Não foi possível carregar as informações de assinatura.
        </div>
      ) : (
        <div className="rounded-2xl border border-outline-variant bg-surface p-6 space-y-4">
          {billing.status === "SUSPENDED" && (
            <div className="rounded-lg bg-error/10 border border-error/30 px-4 py-3 text-sm text-error">
              Assinatura suspensa por falha no pagamento. Acesse o portal para atualizar o método de pagamento.
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Plano atual</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {billing.planName ? (planLabels[billing.planName] ?? billing.planName) : "Trial"}
              </p>
            </div>
            <Chip variant={billingStatusVariant[billing.status] ?? "neutral"}>
              {billingStatusLabel[billing.status] ?? billing.status}
            </Chip>
          </div>

          {billing.billingInterval && (
            <p className="text-sm text-muted-foreground">
              Cobrança {billing.billingInterval === "month" ? "mensal" : "anual"}
            </p>
          )}

          {billing.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              Renova em{" "}
              <span className="font-medium text-foreground">
                {new Date(billing.currentPeriodEnd).toLocaleDateString("pt-BR")}
              </span>
            </p>
          )}

          {billing.status === "TRIAL" && billing.trialEndsAt && (
            <p className="text-sm text-warning font-medium">
              Trial encerra em {new Date(billing.trialEndsAt).toLocaleDateString("pt-BR")}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {billing.stripeSubscriptionId ? (
              <Button variant="secondary" onClick={handlePortal} disabled={portalLoading}>
                <CreditCard size={15} />
                {portalLoading ? "Abrindo..." : "Gerenciar assinatura"}
              </Button>
            ) : (
              <Button variant="primary" onClick={() => (window.location.href = "/pricing")}>
                Ver planos
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
