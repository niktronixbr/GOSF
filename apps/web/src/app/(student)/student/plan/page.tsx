"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsApi, StudentPlanOutput } from "@/lib/api/analytics";
import { gradesApi } from "@/lib/api/grades";
import { Sparkles, CheckCircle2, AlertCircle, Calendar, Star, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";

function gradesBarVariant(avg: number | null): "success" | "warning" | "danger" | "primary" {
  if (avg === null) return "primary";
  if (avg >= 8) return "success";
  if (avg >= 6) return "warning";
  return "danger";
}

function gradesTextColor(avg: number | null) {
  if (avg === null) return "text-muted-foreground";
  if (avg >= 8) return "text-green-600";
  if (avg >= 6) return "text-yellow-600";
  return "text-red-600";
}

function GradesSection() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["student-my-grades"],
    queryFn: () => gradesApi.getMyGrades(),
  });

  if (isLoading) return <div className="h-24 rounded-xl bg-muted animate-pulse" />;

  if (!data?.subjects?.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Notas ainda não disponíveis para este ciclo.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
      <h2 className="font-semibold text-foreground">
        Minhas notas {data.cycleTitle ? `— ${data.cycleTitle}` : ""}
      </h2>
      <div className="space-y-2">
        {data.subjects.map((subject) => (
          <div key={subject.subjectId}>
            <button
              onClick={() => setExpanded(expanded === subject.subjectId ? null : subject.subjectId)}
              className="w-full flex items-center gap-3 text-sm"
            >
              <span className="w-28 text-left text-muted-foreground truncate shrink-0">
                {subject.subjectName}
              </span>
              <div className="flex-1">
                <ProgressBar
                  value={subject.weightedAverage ?? 0}
                  max={10}
                  variant={gradesBarVariant(subject.weightedAverage)}
                />
              </div>
              <span
                className={`w-8 text-right font-bold shrink-0 ${gradesTextColor(
                  subject.weightedAverage,
                )}`}
              >
                {subject.weightedAverage !== null ? subject.weightedAverage.toFixed(1) : "—"}
              </span>
            </button>
            {expanded === subject.subjectId && subject.grades.length > 0 && (
              <div className="ml-28 mt-1 space-y-1 pl-3 border-l-2 border-muted">
                {subject.grades.map((g) => (
                  <div key={g.id} className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {g.title}{" "}
                      <span className="opacity-60">({(g.weight * 100).toFixed(0)}%)</span>
                    </span>
                    <span className={gradesTextColor(g.value)}>{g.value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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

function ChecklistSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={16} className="text-muted-foreground" />
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
            <input type="checkbox" className="mt-0.5 rounded flex-shrink-0" readOnly />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FullPlan({ plan }: { plan: StudentPlanOutput }) {
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
          title="Pontos de atenção"
          icon={AlertCircle}
          items={plan.attention_points}
          color="bg-yellow-500"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChecklistSection title="Plano desta semana (7 dias)" items={plan.seven_day_plan} />
        <ChecklistSection title="Plano do mês (30 dias)" items={plan.thirty_day_plan} />
      </div>

      {plan.confidence_notes?.length > 0 && (
        <PlanSection
          title="Notas de confiança"
          icon={Info}
          items={plan.confidence_notes}
          color="bg-blue-400"
        />
      )}

      {plan.motivation_message && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm italic text-muted-foreground text-center leading-relaxed">
            &ldquo;{plan.motivation_message}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}

export default function StudentPlanPage() {
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading: loadingDash } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: () => analyticsApi.studentDashboard(),
  });

  const cycleId = dashboard?.cycle?.id ?? "";

  const { data: plan, isLoading: loadingPlan, refetch } = useQuery({
    queryKey: ["student-plan", cycleId],
    queryFn: () => analyticsApi.getStudentPlan(cycleId),
    enabled: !!cycleId,
    refetchInterval: (query) =>
      query.state.data?.status === "GENERATING" ? 4000 : false,
  });

  const generateMutation = useMutation({
    mutationFn: () => analyticsApi.generateStudentPlan(cycleId),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
    },
    onError: () => toast.error("Erro ao gerar plano. Tente novamente."),
  });

  const isGenerating = generateMutation.isPending || plan?.status === "GENERATING";

  const prevPlanStatus = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevPlanStatus.current === "GENERATING" && plan?.status === "READY") {
      toast.success("Plano de estudo pronto!", {
        description: "A IA concluiu a análise. Confira seu plano abaixo.",
      });
    }
    prevPlanStatus.current = plan?.status;
  }, [plan?.status]);

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
          <h1 className="text-2xl font-bold text-foreground">Meu plano de estudo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {dashboard?.cycle
              ? `Ciclo: ${dashboard.cycle.title}`
              : "Nenhum ciclo ativo."}
          </p>
        </div>

        {dashboard?.cycle && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={isGenerating}
            className={`shrink-0 ${isGenerating ? "cursor-wait" : ""}`}
          >
            {isGenerating
              ? <Loader2 size={15} className="animate-spin" />
              : <Sparkles size={15} />}
            {isGenerating ? "Gerando..." : plan ? "Regenerar" : "Gerar plano"}
          </Button>
        )}
      </div>

      <GradesSection />

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
            Clique em &ldquo;Gerar plano&rdquo; para que a IA crie seu plano personalizado com base nas avaliações deste ciclo.
          </p>
        </div>
      )}

      {plan?.status === "GENERATING" && (
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3 animate-pulse">
          <Sparkles size={32} className="mx-auto text-primary" />
          <p className="font-medium text-foreground">Gerando seu plano...</p>
          <p className="text-sm text-muted-foreground">
            A IA está analisando seus dados. Isso pode levar alguns segundos.
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
