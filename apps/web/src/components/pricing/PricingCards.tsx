"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { billingApi } from "@/lib/api/billing";
import { ApiError } from "@/lib/api/client";

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

export function PricingCards() {
  const router = useRouter();
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [loading, setLoading] = useState<string | null>(null);

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
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setInterval("month")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            interval === "month"
              ? "bg-indigo-600 text-white"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Mensal
        </button>
        <button
          onClick={() => setInterval("year")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            interval === "year"
              ? "bg-indigo-600 text-white"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Anual
          <span className="ml-1.5 text-xs font-semibold text-emerald-600">-20%</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`relative rounded-2xl border p-8 flex flex-col ${
              plan.popular
                ? "border-indigo-500 bg-indigo-50 shadow-lg"
                : "border-gray-200 bg-white shadow-sm"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Mais popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              <p className="text-xs text-gray-400 mt-0.5">{plan.limit}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold text-gray-900">
                  R$ {interval === "month" ? plan.priceMonth : plan.priceYear}
                </span>
                <span className="text-sm text-gray-500 mb-1">/mês</span>
              </div>
              {interval === "year" && (
                <p className="text-xs text-emerald-600 mt-1 font-medium">
                  R$ {plan.priceYear * 12}/ano — economia de R$ {(plan.priceMonth - plan.priceYear) * 12}/ano
                </p>
              )}
            </div>

            <ul className="space-y-2 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-indigo-500 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.key)}
              disabled={loading === plan.key}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${
                plan.popular
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "border border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              {loading === plan.key ? "Aguarde..." : plan.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-gray-400">
        14 dias grátis no plano Starter. Sem cartão para começar.
      </p>
    </div>
  );
}
