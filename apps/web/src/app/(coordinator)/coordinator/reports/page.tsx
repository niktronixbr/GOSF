"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { coordinatorApi, ReportEntry } from "@/lib/api/coordinator";
import { gradesApi } from "@/lib/api/grades";
import { Download, AlertTriangle, Users, GraduationCap, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { ExportPdfButton } from "@/components/reports/ExportPdfButton";
import { Chip } from "@/components/ui/chip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { scoreVariant } from "@/lib/score-color";

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
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-${cycleTitle.replace(/\s+/g, "-").toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CoordinatorReportsPage() {
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [activeTab, setActiveTab] = useState<"evaluations" | "grades">("evaluations");

  const { data: gradesOverview, isLoading: loadingGrades } = useQuery({
    queryKey: ["coordinator-grades-overview"],
    queryFn: () => gradesApi.getOverview(),
  });

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
          <Button
            variant="secondary"
            size="md"
            onClick={() => report && selectedCycle && exportCsv(filtered, selectedCycle.title)}
            disabled={!report || filtered.length === 0}
          >
            <Download size={15} />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="flex rounded-lg border border-border bg-card shadow-sm overflow-hidden text-sm w-fit">
        <button
          onClick={() => setActiveTab("evaluations")}
          className={clsx(
            "px-4 py-2 font-medium transition-colors",
            activeTab === "evaluations"
              ? "bg-primary text-on-primary"
              : "text-muted-foreground hover:bg-surface-container",
          )}
        >
          Avaliações
        </button>
        <button
          onClick={() => setActiveTab("grades")}
          className={clsx(
            "px-4 py-2 font-medium transition-colors",
            activeTab === "grades"
              ? "bg-primary text-on-primary"
              : "text-muted-foreground hover:bg-surface-container",
          )}
        >
          Notas
        </button>
      </div>

      {activeTab === "evaluations" && <>
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={selectedCycleId}
            onChange={(e) => setSelectedCycleId(e.target.value)}
            disabled={loadingCycles}
            className="appearance-none rounded-lg border border-border bg-card px-4 py-2 pr-9 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {!cycles?.length && <option value="">Sem ciclos disponíveis</option>}
            {cycles?.map((c) => (
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
                    ? "bg-primary text-on-primary"
                    : "text-muted-foreground hover:bg-surface-container"
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
          <Card className="p-4 flex items-center gap-3">
            <GraduationCap size={20} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Alunos</p>
              <p className="text-xl font-bold text-foreground">{studentCount}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <Users size={20} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Professores</p>
              <p className="text-xl font-bold text-foreground">{teacherCount}</p>
            </div>
          </Card>
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
        <Card className="p-10 text-center text-muted-foreground">
          Selecione um ciclo para visualizar o relatório.
        </Card>
      )}

      {selectedCycleId && (loadingReport ? (
        <Card className="p-6 animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded bg-muted" />)}
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          Nenhum dado para o ciclo selecionado.
        </Card>
      ) : (
        <Card noPadding className="overflow-x-auto">
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
                      <Chip variant={row.type === "STUDENT" ? "info" : "neutral"}>
                        {row.type === "STUDENT" ? "Aluno" : "Professor"}
                      </Chip>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.avgScore === null ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        <Chip variant={scoreVariant(row.avgScore)}>{row.avgScore.toFixed(1)}</Chip>
                      )}
                    </td>
                    {allDimensions.map((d) => {
                      const score = dimMap[d] ?? null;
                      return (
                        <td key={d} className="px-4 py-3 text-right">
                          {score === null ? (
                            <span className="text-muted-foreground text-xs">—</span>
                          ) : (
                            <Chip variant={scoreVariant(score)}>{score.toFixed(1)}</Chip>
                          )}
                        </td>
                      );
                    })}
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
        </Card>
      ))}
      </>}

      {activeTab === "grades" && (
        <div className="space-y-4">
          {loadingGrades ? (
            <Card className="p-6 animate-pulse space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded bg-muted" />
              ))}
            </Card>
          ) : !gradesOverview?.bySubject?.length ? (
            <Card className="p-10 text-center text-muted-foreground">
              Nenhuma nota lançada no ciclo ativo.
            </Card>
          ) : (
            <Card noPadding className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                      Disciplina
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                      Média
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                      Alunos
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                      Em risco
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                      Distribuição
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gradesOverview.bySubject
                    .slice()
                    .sort((a, b) => a.avg - b.avg)
                    .map((s) => (
                      <tr
                        key={s.subjectId}
                        className={clsx(
                          "border-b border-border last:border-0 hover:bg-muted/30 transition-colors",
                          s.avg < 6 && "bg-red-50/50 dark:bg-red-900/10",
                        )}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">{s.subjectName}</td>
                        <td
                          className={clsx(
                            "px-4 py-3 text-right font-bold",
                            s.avg >= 8
                              ? "text-green-600"
                              : s.avg >= 6
                              ? "text-yellow-600"
                              : "text-red-600",
                          )}
                        >
                          {s.avg.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {s.studentCount}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {s.atRiskCount > 0 ? (
                            <span className="text-red-600 font-semibold">{s.atRiskCount}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className={clsx(
                                "h-2 rounded-full",
                                s.avg >= 8
                                  ? "bg-green-500"
                                  : s.avg >= 6
                                  ? "bg-yellow-500"
                                  : "bg-red-500",
                              )}
                              style={{ width: `${(s.avg / 10) * 100}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
