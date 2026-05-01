"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import { useAuthStore } from "@/store/auth.store";
import { Stat } from "@/components/ui/stat";
import { Badge } from "@/components/ui/badge";
import { BarChart2, BookOpen } from "lucide-react";

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.min(score, 100);
  const color = score < 50 ? "bg-destructive" : score < 70 ? "bg-yellow-500" : "bg-primary";
  const displayLabel = label.replace(/_/g, " ");
  return (
    <div>
      <div className="flex justify-between items-center mb-1 gap-2">
        <Badge variant="amber" className="capitalize">{displayLabel}</Badge>
        <span className="text-sm font-medium tabular-nums">{score.toFixed(0)}</span>
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
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">Olá, {firstName}!</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data?.cycle ? `Ciclo: ${data.cycle.title}` : "Nenhum ciclo ativo no momento."}
        </p>
      </div>

      {avgScore && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={<BarChart2 size={18} />} label="Média geral" value={avgScore} />
          <Stat icon={<BookOpen size={18} />} label="Dimensões" value={data?.scores.length ?? 0} />
          <Stat
            label="Plano de desenvolvimento"
            value={data?.plan?.status === "READY" ? "Pronto" : data?.plan ? "Gerando..." : "—"}
          />
        </div>
      )}

      {data?.scores.length ? (
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <h2 className="font-semibold mb-4 text-foreground text-[15px]">Dimensões pedagógicas</h2>
          <div className="space-y-4">
            {data.scores.map((s) => (
              <ScoreBar key={s.dimension} label={s.dimension} score={s.score} />
            ))}
          </div>
        </div>
      ) : null}

      {plan && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h2 className="font-semibold mb-3 text-foreground text-[15px]">Pontos fortes</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {plan.strengths.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h2 className="font-semibold mb-3 text-foreground text-[15px]">Ações recomendadas pela IA</h2>
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
        <div className="rounded-lg border border-border bg-white p-8 text-center text-muted-foreground">
          Nenhum ciclo de avaliação ativo no momento.
        </div>
      )}
    </div>
  );
}
