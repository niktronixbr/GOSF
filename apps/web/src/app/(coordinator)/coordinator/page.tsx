"use client";

import { useQuery } from "@tanstack/react-query";
import { evaluationsApi } from "@/lib/api/evaluations";
import { coordinatorApi } from "@/lib/api/coordinator";

function StatusBadge({ score }: { score: number }) {
  if (score < 50) return <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive">Risco</span>;
  if (score < 70) return <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700">Atenção</span>;
  return <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">Bom</span>;
}

export default function CoordinatorHomePage() {
  const { data: cycle } = useQuery({
    queryKey: ["active-cycle"],
    queryFn: () => evaluationsApi.getActiveCycle(),
  });

  const { data: teachers } = useQuery({
    queryKey: ["coordinator-teachers", cycle?.id],
    queryFn: () => coordinatorApi.getTeachers({ cycleId: cycle?.id }),
    enabled: !!cycle?.id,
  });

  const { data: cycles } = useQuery({
    queryKey: ["coordinator-cycles"],
    queryFn: () => coordinatorApi.getCycles(),
  });

  const totalTeachers = teachers?.data?.length ?? 0;
  const atRisk = teachers?.data?.filter((t) => t.avgScore !== null && t.avgScore < 50) ?? [];
  const topTeachers = [...(teachers?.data ?? [])]
    .filter((t) => t.avgScore !== null)
    .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))
    .slice(0, 5);
  const lowTeachers = [...(teachers?.data ?? [])]
    .filter((t) => t.avgScore !== null && t.avgScore < 70)
    .sort((a, b) => (a.avgScore ?? 0) - (b.avgScore ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Visão Geral</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {cycle ? `Ciclo ativo: ${cycle.title}` : "Nenhum ciclo ativo no momento."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Professores</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{totalTeachers || "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Em risco</p>
          <p className="mt-1 text-3xl font-bold text-destructive">{atRisk.length || "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Ciclos cadastrados</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{cycles?.length ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Ciclo atual</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {cycle ? "Aberto" : "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-3 text-foreground">Professores em atenção</h2>
          {lowTeachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {cycle ? "Nenhum professor abaixo de 70." : "Aguardando ciclo ativo."}
            </p>
          ) : (
            <div className="space-y-3">
              {lowTeachers.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate">{t.fullName}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-medium">{t.avgScore?.toFixed(0)}</span>
                    <StatusBadge score={t.avgScore!} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-3 text-foreground">Professores em destaque</h2>
          {topTeachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {cycle ? "Nenhum dado disponível ainda." : "Aguardando ciclo ativo."}
            </p>
          ) : (
            <div className="space-y-3">
              {topTeachers.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate">{t.fullName}</span>
                  <span className="font-medium text-green-600 shrink-0">
                    {t.avgScore?.toFixed(1)} / 100
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
