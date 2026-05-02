"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsApi, TeacherPlanOutput } from "@/lib/api/analytics";
import { Sparkles, CheckCircle2, Star, TrendingUp, Lightbulb, Target, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function PlanSection({
  title,
  icon: Icon,
  items,
  color = "bg-primary",
}: {
  title: string;
  icon: React.ElementType;
  items: string[];
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-muted-foreground" />
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
            <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${color}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FullPlan({ plan }: { plan: TeacherPlanOutput }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground leading-relaxed">{plan.summary}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PlanSection
          title="Pontos fortes"
          icon={Star}
          items={plan.strengths}
          color="bg-green-500"
        />
        <PlanSection
          title="Pontos de desenvolvimento"
          icon={TrendingUp}
          items={plan.development_points}
          color="bg-yellow-500"
        />
      </div>

      <PlanSection
        title="Ações recomendadas"
        icon={ArrowRight}
        items={plan.recommended_actions}
        color="bg-primary"
      />

      {plan.classroom_experiments?.length > 0 && (
        <PlanSection
          title="Experimentos em sala"
          icon={Lightbulb}
          items={plan.classroom_experiments}
          color="bg-purple-500"
        />
      )}

      {plan.next_cycle_focus?.length > 0 && (
        <PlanSection
          title="Foco no próximo ciclo"
          icon={Target}
          items={plan.next_cycle_focus}
          color="bg-blue-500"
        />
      )}
    </div>
  );
}

export default function TeacherDevelopmentPage() {
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading: loadingDash } = useQuery({
    queryKey: ["teacher-dashboard"],
    queryFn: () => analyticsApi.teacherDashboard(),
  });

  const cycleId = dashboard?.cycle?.id ?? "";

  const { data: plan, isLoading: loadingPlan, refetch } = useQuery({
    queryKey: ["teacher-plan", cycleId],
    queryFn: () => analyticsApi.getTeacherPlan(cycleId),
    enabled: !!cycleId,
    refetchInterval: (query) =>
      query.state.data?.status === "GENERATING" ? 4000 : false,
  });

  const generateMutation = useMutation({
    mutationFn: () => analyticsApi.generateTeacherPlan(cycleId),
    onSuccess: () => {
      toast.success("Plano em geração! Aguarde alguns segundos.");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] });
    },
    onError: () => toast.error("Erro ao gerar plano. Tente novamente."),
  });

  const isLoading = loadingDash || loadingPlan;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-3xl">
        <div className="h-20 rounded-xl bg-muted" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu desenvolvimento</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {dashboard?.cycle
              ? `Ciclo: ${dashboard.cycle.title}`
              : "Nenhum ciclo ativo."}
          </p>
        </div>

        {dashboard?.cycle && (
          <Button
            variant="primary"
            size="md"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || plan?.status === "GENERATING"}
            className="shrink-0"
          >
            <Sparkles size={15} />
            {plan ? "Regenerar" : "Gerar plano"}
          </Button>
        )}
      </div>

      {!dashboard?.cycle && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Nenhum ciclo de avaliação ativo. Aguarde a abertura do próximo ciclo.
        </div>
      )}

      {dashboard?.cycle && !plan && (
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
          <Sparkles size={32} className="mx-auto text-muted-foreground" />
          <p className="font-medium text-foreground">Nenhum plano gerado ainda.</p>
          <p className="text-sm text-muted-foreground">
            Clique em &ldquo;Gerar plano&rdquo; para que a IA crie seu plano de desenvolvimento com base nas avaliações deste ciclo.
          </p>
        </div>
      )}

      {plan?.status === "GENERATING" && (
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3 animate-pulse">
          <Sparkles size={32} className="mx-auto text-primary" />
          <p className="font-medium text-foreground">Gerando seu plano...</p>
          <p className="text-sm text-muted-foreground">
            A IA está analisando seus dados pedagógicos. Isso pode levar alguns segundos.
          </p>
        </div>
      )}

      {plan?.status === "READY" && plan.aiOutputJson && (
        <>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 size={15} />
            <span>
              Plano gerado em{" "}
              {plan.generatedAt
                ? new Date(plan.generatedAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
              {plan.version > 1 && ` · versão ${plan.version}`}
            </span>
          </div>
          <FullPlan plan={plan.aiOutputJson} />
        </>
      )}

      {plan?.status === "FAILED" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center">
          <p className="text-sm text-destructive font-medium">
            A geração falhou. Tente novamente ou contate o suporte.
          </p>
        </div>
      )}
    </div>
  );
}
