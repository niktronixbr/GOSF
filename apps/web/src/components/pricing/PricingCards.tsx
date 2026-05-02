"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { billingApi } from "@/lib/api/billing";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

const plans = [
  {
    name: "Starter",
    key: "starter",
    description: "Ideal para escolas em crescimento",
    limit: "até 50 usuários",
    priceMonth: 97,
    priceYear: 77,
    features: ["Avaliações colaborativas", "Planos de IA", "Análise por dimensão", "Suporte por e-mail"],
    popular: false,
    cta: "Começar agora",
  },
  {
    name: "Escola",
    key: "escola",
    description: "Para escolas estabelecidas",
    limit: "até 300 usuários",
    priceMonth: 297,
    priceYear: 237,
    features: ["Tudo do Starter", "Múltiplas turmas", "Relatórios avançados", "Benchmarking", "Suporte prioritário"],
    popular: true,
    cta: "Assinar Escola",
  },
  {
    name: "Enterprise",
    key: "enterprise",
    description: "Redes e grandes instituições",
    limit: "usuários ilimitados",
    priceMonth: 797,
    priceYear: 637,
    features: ["Tudo do Escola", "Multi-unidades", "SLA garantido", "Onboarding dedicado", "API personalizada"],
    popular: false,
    cta: "Falar com vendas",
  },
];

const CAN_SUBSCRIBE_ROLES = ["COORDINATOR", "ADMIN"] as const;

export function PricingCards() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [loading, setLoading] = useState<string | null>(null);

  const canSubscribe =
    !user || CAN_SUBSCRIBE_ROLES.includes(user.role as (typeof CAN_SUBSCRIBE_ROLES)[number]);

  async function handleSubscribe(planKey: string) {
    if (planKey === "enterprise") {
      window.location.href = "mailto:contato@gosf.com.br?subject=Plano Enterprise GOSF";
      return;
    }
    setLoading(planKey);
    try {
      const { url } = await billingApi.createCheckoutSession(planKey, interval);
      window.location.href = url;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/register?plan=${planKey}&interval=${interval}`);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Interval toggle */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setInterval("month")}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
            interval === "month"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Mensal
        </button>
        <button
          type="button"
          onClick={() => setInterval("year")}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
            interval === "year"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Anual
          <span className="ml-1.5 text-xs font-semibold text-success">-20%</span>
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.key}
            noPadding
            className={`relative flex flex-col p-8 ${
              plan.popular ? "bg-primary-container border-primary/30 shadow-lg" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Chip variant="warning">Mais popular</Chip>
              </div>
            )}

            {/* Header */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5 opacity-75">{plan.limit}</p>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold text-foreground">
                  R$ {interval === "month" ? plan.priceMonth : plan.priceYear}
                </span>
                <span className="text-sm text-muted-foreground mb-1">/mês</span>
              </div>
              {interval === "year" && (
                <p className="text-xs text-success mt-1 font-medium">
                  R$ {plan.priceYear * 12}/ano — economia de R$ {(plan.priceMonth - plan.priceYear) * 12}/ano
                </p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            {canSubscribe ? (
              <Button
                variant={plan.popular ? "primary" : "secondary"}
                onClick={() => handleSubscribe(plan.key)}
                disabled={loading === plan.key}
                className="w-full"
              >
                {loading === plan.key ? "Aguarde..." : plan.cta}
              </Button>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                Contratação disponível apenas para coordenadores.
              </p>
            )}
          </Card>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        14 dias grátis no plano Starter. Sem cartão para começar.
      </p>
    </div>
  );
}
