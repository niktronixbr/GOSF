"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, StudentInsight } from "@/lib/api/analytics";
import {
  AlertTriangle,
  CheckCircle2,
  Users,
  TrendingUp,
  Search,
  BarChart2,
} from "lucide-react";
import { clsx } from "clsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useChartColors } from "@/lib/chart-colors";
import { ProgressBar } from "@/components/ui/progress-bar";
import { scoreVariant } from "@/lib/score-color";
import { Chip } from "@/components/ui/chip";

type Filter = "all" | "atRisk" | "regular" | "noData";

function StudentCard({ student }: { student: StudentInsight }) {
  return (
    <div
      className={clsx(
        "rounded-xl border bg-card p-5 shadow-sm transition-colors",
        student.atRisk ? "border-error/40" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-semibold text-foreground">{student.fullName}</p>
          {student.avgScore !== null ? (
            <p className="text-sm text-muted-foreground mt-0.5">
              Score médio:{" "}
              <span className="font-semibold">
                {student.avgScore}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">Sem dados no ciclo atual</p>
          )}
        </div>

        {student.atRisk ? (
          <Chip variant="danger" className="shrink-0">
            <AlertTriangle size={12} />
            Risco
          </Chip>
        ) : student.avgScore !== null ? (
          <Chip variant="success" className="shrink-0">
            <CheckCircle2 size={12} />
            Regular
          </Chip>
        ) : null}
      </div>

      {student.scores.length > 0 && (
        <div className="space-y-2">
          {student.scores.map((s) => (
            <div key={s.dimension}>
              <p className="text-xs text-muted-foreground mb-1 capitalize">{s.dimension}</p>
              <ProgressBar value={s.score} max={100} variant={scoreVariant(s.score)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeacherInsightsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const chartColors = useChartColors();

  const { data: students, isLoading } = useQuery({
    queryKey: ["teacher-student-insights"],
    queryFn: () => analyticsApi.teacherStudentInsights(),
  });

  const atRiskCount = students?.filter((s) => s.atRisk).length ?? 0;
  const regularCount = students?.filter((s) => !s.atRisk && s.avgScore !== null).length ?? 0;
  const noDataCount = students?.filter((s) => s.avgScore === null).length ?? 0;

  const dimensionChart = useMemo(() => {
    if (!students) return [];
    const withData = students.filter((s) => s.scores.length > 0);
    if (withData.length === 0) return [];

    const map: Record<string, { total: number; count: number }> = {};
    for (const s of withData) {
      for (const sc of s.scores) {
        if (!map[sc.dimension]) map[sc.dimension] = { total: 0, count: 0 };
        map[sc.dimension].total += sc.score;
        map[sc.dimension].count += 1;
      }
    }

    return Object.entries(map).map(([dimension, { total, count }]) => ({
      dimension,
      avg: Math.round(total / count),
    }));
  }, [students]);

  const filtered = useMemo(() => {
    if (!students) return [];
    let list = students;
    if (filter === "atRisk") list = list.filter((s) => s.atRisk);
    else if (filter === "regular") list = list.filter((s) => !s.atRisk && s.avgScore !== null);
    else if (filter === "noData") list = list.filter((s) => s.avgScore === null);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.fullName.toLowerCase().includes(q));
    }
    return list;
  }, [students, filter, search]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 rounded-xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const filterBtns: { label: string; value: Filter; count: number }[] = [
    { label: "Todos", value: "all", count: students?.length ?? 0 },
    { label: "Em risco", value: "atRisk", count: atRiskCount },
    { label: "Regular", value: "regular", count: regularCount },
    { label: "Sem dados", value: "noData", count: noDataCount },
  ];

  function barFill(score: number) {
    if (score >= 70) return chartColors.success;
    if (score >= 50) return chartColors.warning;
    return chartColors.danger;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Insights dos alunos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão analítica dos alunos que você avaliou no ciclo atual.
        </p>
      </div>

      {students && students.length > 0 && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
              <Users size={20} className="mx-auto text-muted-foreground mb-1" />
              <p className="text-2xl font-bold text-foreground">{students.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Alunos avaliados</p>
            </div>
            <div className="rounded-xl border border-error/40 bg-error/5 p-4 text-center shadow-sm">
              <AlertTriangle size={20} className="mx-auto text-error mb-1" />
              <p className="text-2xl font-bold text-error">{atRiskCount}</p>
              <p className="text-xs text-error mt-0.5">Em risco (score &lt; 50)</p>
            </div>
            <div className="rounded-xl border border-success/40 bg-success/5 p-4 text-center shadow-sm">
              <TrendingUp size={20} className="mx-auto text-success mb-1" />
              <p className="text-2xl font-bold text-success">{regularCount}</p>
              <p className="text-xs text-success mt-0.5">Em dia</p>
            </div>
          </div>

          {/* Gráfico: score médio por dimensão */}
          {dimensionChart.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} className="text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">
                  Score médio por dimensão — turma
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dimensionChart} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridLine} vertical={false} />
                  <XAxis
                    dataKey="dimension"
                    tick={{ fontSize: 11, fill: chartColors.muted }}
                    tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: chartColors.muted }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}`, "Média"]}
                    labelFormatter={(label: string) =>
                      label.charAt(0).toUpperCase() + label.slice(1)
                    }
                    contentStyle={{
                      borderRadius: "8px",
                      border: `1px solid ${chartColors.gridLine}`,
                      background: "var(--surface)",
                      color: "var(--foreground)",
                      fontSize: "13px",
                    }}
                  />
                  <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                    {dimensionChart.map((entry, i) => (
                      <Cell key={i} fill={barFill(entry.avg)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Busca + filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Buscar aluno..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {filterBtns.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setFilter(btn.value)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    filter === btn.value
                      ? "bg-primary text-on-primary"
                      : "text-muted-foreground hover:bg-surface-container"
                  )}
                >
                  {btn.label}
                  {btn.count > 0 && (
                    <span className="ml-1.5 opacity-70">{btn.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {!students || students.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          <Users size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-foreground">Nenhum aluno avaliado ainda.</p>
          <p className="text-sm mt-1">
            Os insights aparecerão após você submeter avaliações para os alunos.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          <Search size={28} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-foreground">Nenhum aluno encontrado.</p>
          <p className="text-sm mt-1">Tente ajustar a busca ou o filtro selecionado.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filter === "all" ? (
            <>
              {atRiskCount > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-error uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    Alunos em risco — precisam de atenção
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered
                      .filter((s) => s.atRisk)
                      .map((s) => (
                        <StudentCard key={s.studentId} student={s} />
                      ))}
                  </div>
                </section>
              )}

              {regularCount > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Acompanhamento regular
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered
                      .filter((s) => !s.atRisk && s.avgScore !== null)
                      .map((s) => (
                        <StudentCard key={s.studentId} student={s} />
                      ))}
                  </div>
                </section>
              )}

              {noDataCount > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Sem dados no ciclo atual
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered
                      .filter((s) => s.avgScore === null)
                      .map((s) => (
                        <StudentCard key={s.studentId} student={s} />
                      ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <StudentCard key={s.studentId} student={s} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
