"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import { useAuthStore } from "@/store/auth.store";

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.min(score, 100);
  const color = score < 50 ? "bg-destructive" : score < 70 ? "bg-yellow-500" : "bg-primary";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground capitalize">{label.replace(/_/g, " ")}</span>
        <span className="font-medium">{score.toFixed(0)}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function TeacherHomePage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ["teacher-dashboard"],
    queryFn: () => analyticsApi.teacherDashboard(),
    enabled: !!user,
  });

  const firstName = user?.fullName?.split(" ")[0] ?? "professor(a)";
  const avgScore = data?.scores.length
    ? (data.scores.reduce((a, s) => a + s.score, 0) / data.scores.length).toFixed(1)
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olá, {firstName}!</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data?.cycle ? `Ciclo: ${data.cycle.title}` : "Nenhum ciclo ativo no momento."}
        </p>
      </div>

      {avgScore && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Média geral</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{avgScore}</p>
            <p className="mt-1 text-xs text-muted-foreground">de 100</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Dimensões</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{data?.scores.length ?? 0}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Plano de desenvolvimento</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {data?.plan?.status === "READY" ? "Pronto" : data?.plan ? "Gerando..." : "—"}
            </p>
          </div>
        </div>
      )}

      {data?.scores.length ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-4 text-foreground">Dimensões pedagógicas</h2>
          <div className="space-y-3">
            {data.scores.map((s) => (
              <ScoreBar key={s.dimension} label={s.dimension} score={s.score} />
            ))}
          </div>
        </div>
      ) : null}

      {plan && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-semibold mb-3 text-foreground">Pontos fortes</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {plan.strengths.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-semibold mb-3 text-foreground">Ações recomendadas pela IA</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {plan.recommended_actions.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!data?.cycle && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Nenhum ciclo de avaliação ativo no momento.
        </div>
      )}
    </div>
  );
}
