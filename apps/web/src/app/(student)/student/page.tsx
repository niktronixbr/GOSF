"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/cn";

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.min(score, 100);
  const fillColor =
    score < 50 ? "bg-destructive" : score < 70 ? "bg-[oklch(0.72_0.14_75)]" : "bg-teal";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-muted-foreground capitalize font-medium">
          {label.replace(/_/g, " ")}
        </span>
        <span className="font-bold text-foreground tabular-nums">{score.toFixed(0)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-teal-soft overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", fillColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  delta?: string;
  deltaVariant?: "positive" | "warning";
  delayClass?: string;
}

function StatCard({ label, value, delta, deltaVariant = "positive", delayClass }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm",
        "animate-slide-up",
        "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md",
        delayClass,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-[28px] font-extrabold text-foreground leading-none tracking-tight">
        {value}
      </p>
      {delta && (
        <p
          className={cn(
            "mt-1.5 text-[11px] font-semibold",
            deltaVariant === "positive"
              ? "text-[oklch(0.62_0.13_150)]"
              : "text-[oklch(0.72_0.14_75)]",
          )}
        >
          {delta}
        </p>
      )}
    </div>
  );
}

export default function StudentHomePage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: () => analyticsApi.studentDashboard(),
    enabled: !!user,
  });

  const firstName = user?.fullName?.split(" ")[0] ?? "aluno(a)";
  const avgScore =
    data?.scores.length
      ? Math.round(data.scores.reduce((a, s) => a + s.score, 0) / data.scores.length)
      : null;
  const plan = data?.plan?.aiOutputJson;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">
          Olá, {firstName}!
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          {data?.cycle ? `Ciclo: ${data.cycle.title}` : "Nenhum ciclo ativo no momento."}
        </p>
      </div>

      {/* Stat cards */}
      {avgScore !== null && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Nota de evolução"
            value={<span className="text-teal-fg">{avgScore}</span>}
            delta="↑ média geral do ciclo"
            delayClass="animate-delay-75"
          />
          <StatCard
            label="Dimensões avaliadas"
            value={data?.scores.length ?? 0}
            delayClass="animate-delay-150"
          />
          <StatCard
            label="Status do plano"
            value={
              data?.plan?.status === "READY"
                ? "Pronto"
                : data?.plan
                ? "Gerando..."
                : "—"
            }
            delta={data?.plan?.status === "READY" ? "↑ Disponível" : undefined}
            delayClass="animate-delay-200"
          />
        </div>
      )}

      {/* Desempenho por dimensão */}
      {data?.scores.length ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm animate-slide-up animate-delay-250">
          <h2 className="text-[14px] font-bold text-foreground mb-4">Desempenho por dimensão</h2>
          <div className="space-y-3.5">
            {data.scores.map((s) => (
              <ScoreBar key={s.dimension} label={s.dimension} score={s.score} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Plano de IA */}
      {plan && (
        <div className="grid gap-4 lg:grid-cols-2 animate-slide-up animate-delay-300">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-[14px] font-bold text-foreground mb-3">Pontos fortes</h2>
            <ul className="space-y-2">
              {plan.strengths.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-muted-foreground">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[oklch(0.62_0.13_150)]" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-[14px] font-bold text-foreground mb-3">Pontos de atenção</h2>
            <ul className="space-y-2">
              {plan.attention_points.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-muted-foreground">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Plano da semana */}
      {plan?.seven_day_plan && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm animate-slide-up animate-delay-300">
          <h2 className="text-[14px] font-bold text-foreground mb-3">Plano desta semana</h2>
          <ul className="space-y-2">
            {plan.seven_day_plan.map((item, i) => (
              <li key={item} className="flex items-start gap-3 text-[13px] text-muted-foreground">
                <input type="checkbox" className="mt-0.5 rounded accent-teal" readOnly />
                {item}
              </li>
            ))}
          </ul>
          {plan.motivation_message && (
            <p className="mt-4 text-[13px] italic text-muted-foreground border-t border-border pt-3">
              {plan.motivation_message}
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && data && !data.cycle && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-[13px] text-muted-foreground">
          Nenhum ciclo de avaliação ativo. Aguarde a abertura do próximo ciclo.
        </div>
      )}
    </div>
  );
}
