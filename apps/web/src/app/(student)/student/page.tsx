"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { analyticsApi } from "@/lib/api/analytics";
import { StatCard } from "@/components/ui/stat-card";
import { InsightCard } from "@/components/ui/insight-card";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Chip } from "@/components/ui/chip";
import { TrendingUp, BookOpen, Target, Sparkles } from "lucide-react";

function scoreVariant(score: number): "success" | "warning" | "danger" {
  if (score >= 70) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

export default function StudentDashboardPage() {
  const { user } = useAuthStore();
  const firstName = user?.fullName?.split(" ")[0] ?? "Aluno";

  const { data, isLoading } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: () => analyticsApi.studentDashboard(),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 rounded-lg bg-surface-container animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-surface-container animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-48 rounded-xl bg-surface-container animate-pulse" />
          <div className="h-48 rounded-xl bg-surface-container animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data || !data.cycle) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Bem-vindo, {firstName}.
        </h1>
        <p className="text-muted-foreground">
          Nenhum ciclo ativo. Aguarde seu coordenador abrir um ciclo.
        </p>
      </div>
    );
  }

  const scores = data.scores ?? [];
  const avgScore = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
    : 0;

  const plan = data.plan;
  const aiPlan = plan?.aiOutputJson ?? null;

  // InsightCard subItems shape: { label: string; text: string }[]
  const insightSubItems = [
    ...(aiPlan?.strengths?.slice(0, 2).map((s: string) => ({
      label: "Ponto forte",
      text: s,
    })) ?? []),
    ...(aiPlan?.attention_points?.slice(0, 1).map((a: string) => ({
      label: "Atenção",
      text: a,
    })) ?? []),
  ];

  const avgVariant = scoreVariant(avgScore);

  return (
    <div className="p-6 space-y-6 max-w-[1280px]">
      {/* Hero */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Bem-vindo, {firstName}.
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe sua evolução acadêmica — {data.cycle.title}.
        </p>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Score geral"
          value={`${avgScore}`}
          trend={
            scores.length > 0
              ? {
                  value:
                    avgVariant === "success"
                      ? "Acima da meta"
                      : avgVariant === "warning"
                        ? "Em desenvolvimento"
                        : "Precisa de atenção",
                  direction:
                    avgVariant === "success"
                      ? "up"
                      : avgVariant === "warning"
                        ? "neutral"
                        : "down",
                }
              : undefined
          }
        />
        <StatCard
          icon={<BookOpen size={20} />}
          label="Dimensões avaliadas"
          value={`${scores.length}`}
        />
        <StatCard
          icon={<Target size={20} />}
          label="Plano IA"
          value={plan ? (plan.status === "READY" ? "Ativo" : "Gerando...") : "Pendente"}
          badge={
            plan?.status === "READY"
              ? { text: "Disponível", variant: "success" }
              : plan
                ? { text: "Processando", variant: "warning" }
                : undefined
          }
        />
      </div>

      {/* 2-column grid: InsightCard + Mapa de Habilidades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {aiPlan && insightSubItems.length > 0 ? (
          <InsightCard
            variant="primary"
            label="DESTAQUES DA SEMANA"
            icon={<Sparkles size={16} />}
            title="Seu progresso em foco"
            description="Baseado no seu plano de desenvolvimento IA."
            subItems={insightSubItems}
          />
        ) : (
          <Card className="flex items-center justify-center min-h-[160px]">
            <p className="text-sm text-muted-foreground text-center">
              {plan ? "Plano IA sendo gerado. Volte em breve." : "Plano IA ainda não disponível."}
            </p>
          </Card>
        )}

        <Card>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Mapa de Habilidades
          </h2>
          {scores.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada.</p>
          ) : (
            <div className="space-y-3">
              {scores.map((s) => {
                const variant = scoreVariant(s.score);
                return (
                  <div key={s.dimension}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-foreground capitalize">
                        {s.dimension.replace(/_/g, " ")}
                      </span>
                      <Chip variant={variant}>{s.score.toFixed(1)}</Chip>
                    </div>
                    <ProgressBar value={s.score} max={100} variant={variant} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Plano 7 Dias */}
      {aiPlan?.seven_day_plan && aiPlan.seven_day_plan.length > 0 && (
        <Card>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Plano 7 Dias
          </h2>
          <ul className="space-y-2">
            {aiPlan.seven_day_plan.map((item: string, i: number) => (
              <li key={i} className="flex gap-3 text-sm text-foreground">
                <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {aiPlan.motivation_message && (
            <p className="mt-4 text-sm italic text-muted-foreground border-t border-outline-variant pt-3">
              {aiPlan.motivation_message}
            </p>
          )}
        </Card>
      )}

      {/* Pontos de Atenção */}
      {aiPlan?.attention_points && aiPlan.attention_points.length > 0 && (
        <Card>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Pontos de Atenção
          </h2>
          <ul className="space-y-2">
            {aiPlan.attention_points.map((item: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm text-foreground">
                <span className="text-error shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
