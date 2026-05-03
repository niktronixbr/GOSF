"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { analyticsApi } from "@/lib/api/analytics";
import { StatCard } from "@/components/ui/stat-card";
import { InsightCard } from "@/components/ui/insight-card";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Chip } from "@/components/ui/chip";
import { TrendingUp, BookOpen, Users, Sparkles } from "lucide-react";

export default function TeacherDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const firstName = user?.fullName?.split(" ")[0] ?? "Professor";

  const { data, isLoading } = useQuery({
    queryKey: ["teacher-dashboard"],
    queryFn: () => analyticsApi.teacherDashboard(),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-56 rounded-lg bg-surface-container animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-surface-container animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Olá, Prof. {firstName}.</h1>
        <p className="text-muted-foreground">Nenhum ciclo ativo no momento.</p>
      </div>
    );
  }

  const scores = data.scores ?? [];
  const avgScore = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
    : 0;

  // plan.aiOutputJson matches TeacherPlanOutput interface
  const aiPlan = data.plan?.aiOutputJson ?? null;

  function scoreVariant(score: number): "success" | "warning" | "danger" {
    if (score >= 70) return "success";
    if (score >= 50) return "warning";
    return "danger";
  }

  // subItems shape: { label: string; text: string }[]
  const insightSubItems = [
    ...(aiPlan?.strengths?.slice(0, 2).map((s: string) => ({ label: "Ponto forte", text: s })) ?? []),
    ...(aiPlan?.development_points?.slice(0, 1).map((d: string) => ({ label: "Desenvolvimento", text: d })) ?? []),
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1280px]">
      {/* Hero */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Olá, Prof. {firstName}.</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.cycle ? `Ciclo: ${data.cycle.title}` : "Acompanhe o desempenho dos seus alunos."}
          </p>
        </div>
        <button
          onClick={() => router.push("/teacher/evaluations")}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
        >
          Avaliar alunos
        </button>
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Score médio"
          value={`${avgScore}`}
          trend={{
            value: `${avgScore}`,
            direction: avgScore >= 70 ? "up" : avgScore >= 50 ? "neutral" : "down",
          }}
        />
        <StatCard
          icon={<BookOpen size={20} />}
          label="Dimensões avaliadas"
          value={`${scores.length}`}
        />
        <StatCard
          icon={<Users size={20} />}
          label="Plano IA"
          value={data.plan?.status === "READY" ? "Ativo" : data.plan ? "Gerando..." : "Pendente"}
        />
      </div>

      {/* Skills + InsightCard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Desempenho por Dimensão
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

        {aiPlan && insightSubItems.length > 0 ? (
          <InsightCard
            variant="primary"
            label="AI INSIGHTS"
            icon={<Sparkles size={16} />}
            title="Seu plano de desenvolvimento"
            description="Baseado nas avaliações dos seus alunos e no seu perfil docente."
            subItems={insightSubItems}
            cta={{ text: "Ver plano completo", onClick: () => router.push("/teacher/development") }}
          />
        ) : (
          <Card className="flex items-center justify-center min-h-[160px]">
            <p className="text-sm text-muted-foreground text-center">
              Gere seu plano IA para ver insights aqui.
            </p>
          </Card>
        )}
      </div>

      {/* Ações Recomendadas */}
      {aiPlan?.recommended_actions && aiPlan.recommended_actions.length > 0 && (
        <Card>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Ações Recomendadas
          </h2>
          <ul className="space-y-2">
            {aiPlan.recommended_actions.map((item: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm text-foreground">
                <span className="text-secondary shrink-0">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
