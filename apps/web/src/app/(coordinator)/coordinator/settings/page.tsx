"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coordinatorApi } from "@/lib/api/coordinator";
import { billingApi, BillingStatus } from "@/lib/api/billing";
import { toast } from "sonner";
import { Save, Building2, CreditCard } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  status: z.enum(["ACTIVE", "INACTIVE", "TRIAL", "SUSPENDED"]),
});

type FormValues = z.infer<typeof schema>;

const statusLabels: Record<string, string> = {
  ACTIVE: "Ativa",
  INACTIVE: "Inativa",
  TRIAL: "Período de teste",
  SUSPENDED: "Suspensa",
};

const billingStatusConfig: Record<string, { label: string; className: string }> = {
  TRIAL: { label: "Em trial", className: "bg-yellow-100 text-yellow-800" },
  ACTIVE: { label: "Ativo", className: "bg-emerald-100 text-emerald-800" },
  SUSPENDED: { label: "Suspenso", className: "bg-red-100 text-red-800" },
  INACTIVE: { label: "Cancelado", className: "bg-gray-100 text-gray-600" },
};

const planLabels: Record<string, string> = {
  starter: "Starter",
  escola: "Escola",
  enterprise: "Enterprise",
};

function SkeletonForm() {
  return (
    <div className="animate-pulse space-y-5 max-w-lg">
      <div className="h-9 rounded-lg bg-muted w-2/3" />
      <div className="h-9 rounded-lg bg-muted" />
      <div className="h-9 rounded-lg bg-muted w-1/2" />
      <div className="h-9 rounded-lg bg-muted w-1/3" />
    </div>
  );
}

function InstitutionForm() {
  const qc = useQueryClient();
  const { data: institution, isLoading } = useQuery({
    queryKey: ["institution-settings"],
    queryFn: () => coordinatorApi.getInstitution(),
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", status: "TRIAL" },
  });

  useEffect(() => {
    if (institution) reset({ name: institution.name, status: institution.status as FormValues["status"] });
  }, [institution, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => coordinatorApi.updateInstitution(values),
    onSuccess: (updated) => {
      toast.success("Configurações salvas com sucesso.");
      qc.setQueryData(["institution-settings"], updated);
      reset({ name: updated.name, status: updated.status as FormValues["status"] });
    },
    onError: () => toast.error("Erro ao salvar configurações."),
  });

  if (isLoading) return <SkeletonForm />;

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground block">Nome da instituição</label>
          <input
            {...register("name")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Nome da instituição"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground block">Slug</label>
          <input
            value={institution?.slug ?? ""}
            readOnly
            disabled
            className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">O slug é gerado automaticamente e não pode ser alterado.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground block">Status</label>
          <select
            {...register("status")}
            className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isDirty || mutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Save size={15} />
          {mutation.isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

function BillingTab() {
  const [portalLoading, setPortalLoading] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["billing-status"],
    queryFn: () => billingApi.getStatus(),
  });

  async function handleManage() {
    setPortalLoading(true);
    try {
      const { url } = await billingApi.createPortalSession();
      window.location.href = url;
    } catch {
      toast.error("Erro ao abrir portal de gerenciamento.");
    } finally {
      setPortalLoading(false);
    }
  }

  if (isLoading) return <SkeletonForm />;

  const billing = data as BillingStatus;
  const statusCfg = billingStatusConfig[billing.status] ?? billingStatusConfig.INACTIVE;

  return (
    <div className="space-y-4 max-w-lg">
      {billing.status === "SUSPENDED" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          Sua assinatura está suspensa por falha no pagamento. Atualize seu método de pagamento para continuar usando o GOSF.
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Plano atual</p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {billing.planName ? planLabels[billing.planName] ?? billing.planName : "Trial"}
            </p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.className}`}>
            {statusCfg.label}
          </span>
        </div>

        {billing.billingInterval && (
          <p className="text-sm text-muted-foreground">
            Cobrança {billing.billingInterval === "month" ? "mensal" : "anual"}
          </p>
        )}

        {billing.currentPeriodEnd && (
          <p className="text-sm text-muted-foreground">
            Renova em {new Date(billing.currentPeriodEnd).toLocaleDateString("pt-BR")}
          </p>
        )}

        {billing.status === "TRIAL" && billing.trialEndsAt && (
          <p className="text-sm text-amber-700 font-medium">
            Trial encerra em {new Date(billing.trialEndsAt).toLocaleDateString("pt-BR")}
          </p>
        )}

        {billing.stripeSubscriptionId ? (
          <button
            onClick={handleManage}
            disabled={portalLoading}
            className="flex items-center gap-2 rounded-lg border border-primary text-primary px-4 py-2 text-sm font-semibold hover:bg-primary/5 disabled:opacity-50 transition-colors"
          >
            <CreditCard size={15} />
            {portalLoading ? "Abrindo..." : "Gerenciar assinatura"}
          </button>
        ) : (
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Ver planos
          </a>
        )}
      </div>
    </div>
  );
}

export default function CoordinatorSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"geral" | "assinatura">(
    searchParams.get("tab") === "assinatura" ? "assinatura" : "geral"
  );

  function selectTab(tab: "geral" | "assinatura") {
    setActiveTab(tab);
    router.replace(`/coordinator/settings?tab=${tab}`, { scroll: false });
  }

  const tabs = [
    { key: "geral" as const, label: "Geral", icon: Building2 },
    { key: "assinatura" as const, label: "Assinatura", icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Building2 size={24} className="text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie sua instituição e assinatura.</p>
        </div>
      </div>

      <div className="border-b border-border flex gap-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => selectTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "geral" ? <InstitutionForm /> : <BillingTab />}
    </div>
  );
}
