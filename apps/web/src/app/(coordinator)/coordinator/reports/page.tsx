"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { coordinatorApi, ReportEntry } from "@/lib/api/coordinator";
import { Download, AlertTriangle, Users, GraduationCap, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { ExportPdfButton } from "@/components/reports/ExportPdfButton";

type FilterType = "ALL" | "STUDENT" | "TEACHER";

function exportCsv(rows: ReportEntry[], cycleTitle: string) {
  const allDimensions = Array.from(new Set(rows.flatMap((r) => r.scores.map((s) => s.dimension)))).sort();

  const header = ["Tipo", "Nome", "Score médio", "Em risco", ...allDimensions];
  const lines = rows.map((r) => {
    const dimMap = Object.fromEntries(r.scores.map((s) => [s.dimension, s.score]));
    return [
      r.type === "STUDENT" ? "Aluno" : "Professor",
      r.fullName,
      r.avgScore ?? "",
      r.atRisk ? "Sim" : "Não",
      ...allDimensions.map((d) => dimMap[d] ?? ""),
    ].join(";");
  });

  const csv = [header.join(";"), ...lines].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-${cycleTitle.replace(/\s+/g, "-").toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ScoreCell({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-xs">—</span>;
  const color = score >= 70 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";
  return <span className={clsx("font-semibold text-sm", color)}>{score.toFixed(1)}</span>;
}

export default function CoordinatorReportsPage() {
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [filterType, setFilterType] = useState<FilterType>("ALL");

  const { data: cycles, isLoading: loadingCycles } = useQuery({
    queryKey: ["all-cycles"],
    queryFn: () => coordinatorApi.getCycles(),
  });

  useEffect(() => {
    if (cycles?.length && !selectedCycleId) {
      const open = cycles.find((c) => c.status === "OPEN");
      setSelectedCycleId(open?.id ?? cycles[0].id);
    }
  }, [cycles, selectedCycleId]);

  const selectedCycle = cycles?.find((c) => c.id === selectedCycleId);

  const { data: report, isLoading: loadingReport } = useQuery({
    queryKey: ["coordinator-reports", selectedCycleId],
    queryFn: () => coordinatorApi.getReports(selectedCycleId),
    enabled: !!selectedCycleId,
  });

  const filtered = useMemo(() => {
    if (!report) return [];
    if (filterType === "ALL") return report;
    return report.filter((r) => r.type === filterType);
  }, [report, filterType]);

  const allDimensions = useMemo(
    () =>
      Array.from(new Set((report ?? []).flatMap((r) => r.scores.map((s) => s.dimension)))).sort(),
    [report]
  );

  const atRiskCount = report?.filter((r) => r.atRisk).length ?? 0;
  const studentCount = report?.filter((r) => r.type === "STUDENT").length ?? 0;
  const teacherCount = report?.filter((r) => r.type === "TEACHER").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tabela completa de scores por ciclo com exportação CSV.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportPdfButton
            rows={filtered}
            allDimensions={allDimensions}
            cycleTitle={selectedCycle?.title ?? "relatorio"}
            studentCount={studentCount}
            teacherCount={teacherCount}
            atRiskCount={atRiskCount}
            disabled={!report || filtered.length === 0}
          />
          <button
            onClick={() => report && selectedCycle && exportCsv(filtered, selectedCycle.title)}
            disabled={!report || filtered.length === 0}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-40 transition-colors shrink-0"
          >
            <Download size={15} />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={selectedCycleId}
            onChange={(e) => setSelectedCycleId(e.target.value)}
            disabled={loadingCycles}
            className="appearance-none rounded-lg border border-border bg-card px-4 py-2 pr-9 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {!cycles?.length && <option value="">Sem ciclos disponíveis</option>}
            {cycles?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.title}
                {c.status === "OPEN" ? " (aberto)" : c.status === "CLOSED" ? " (fechado)" : ""}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        <div className="flex rounded-lg border border-border bg-card shadow-sm overflow-hidden text-sm">
          {(["ALL", "STUDENT", "TEACHER"] as FilterType[]).map((type) => {
            const labels: Record<FilterType, string> = {
              ALL: "Todos",
              STUDENT: "Alunos",
              TEACHER: "Professores",
            };
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={clsx(
                  "px-4 py-2 font-medium transition-colors",
                  filterType === type
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                {labels[type]}
              </button>
            );
          })}
        </div>
      </div>

      {selectedCycleId && report && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
            <GraduationCap size={20} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Alunos</p>
              <p className="text-xl font-bold text-foreground">{studentCount}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
            <Users size={20} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Professores</p>
              <p className="text-xl font-bold text-foreground">{teacherCount}</p>
            </div>
          </div>
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 shadow-sm flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500 shrink-0" />
            <div>
              <p className="text-xs text-red-500">Em risco</p>
              <p className="text-xl font-bold text-red-600">{atRiskCount}</p>
            </div>
          </div>
        </div>
      )}

      {!selectedCycleId && !loadingCycles && (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          Selecione um ciclo para visualizar o relatório.
        </div>
      )}

      {selectedCycleId && (loadingReport ? (
        <div className="rounded-xl border border-border bg-card p-6 animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          Nenhum dado para o ciclo selecionado.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
                  Nome
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
                  Tipo
                </th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
                  Score médio
                </th>
                {allDimensions.map((d) => (
                  <th
                    key={d}
                    className="text-right px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap capitalize"
                  >
                    {d}
                  </th>
                ))}
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
                  Risco
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const dimMap = Object.fromEntries(row.scores.map((s) => [s.dimension, s.score]));
                return (
                  <tr
                    key={`${row.type}-${row.id}`}
                    className={clsx(
                      "border-b border-border last:border-0 hover:bg-muted/30 transition-colors",
                      row.atRisk && "bg-red-50/50 dark:bg-red-900/10"
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      {row.fullName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          row.type === "STUDENT"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        )}
                      >
                        {row.type === "STUDENT" ? "Aluno" : "Professor"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ScoreCell score={row.avgScore} />
                    </td>
                    {allDimensions.map((d) => (
                      <td key={d} className="px-4 py-3 text-right">
                        <ScoreCell score={dimMap[d] ?? null} />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      {row.atRisk ? (
                        <AlertTriangle size={14} className="inline text-red-500" />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
