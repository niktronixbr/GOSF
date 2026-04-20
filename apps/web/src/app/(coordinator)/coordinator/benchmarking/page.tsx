"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { evaluationsApi } from "@/lib/api/evaluations";
import { coordinatorApi, ClassBenchmark } from "@/lib/api/coordinator";
import { Users, TrendingUp, AlertTriangle, BarChart2 } from "lucide-react";

function scoreColor(score: number | null): string {
  if (score === null) return "#94a3b8";
  if (score < 50) return "#ef4444";
  if (score < 70) return "#f59e0b";
  return "#22c55e";
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null)
    return <span className="text-xs text-muted-foreground">Sem dados</span>;
  const color =
    score < 50
      ? "text-destructive"
      : score < 70
      ? "text-yellow-600"
      : "text-green-600";
  return <span className={`font-semibold text-sm ${color}`}>{score.toFixed(1)}</span>;
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: ClassBenchmark }[];
  label?: string;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-md text-sm space-y-1">
      <p className="font-semibold text-foreground">{d.className}</p>
      <p className="text-muted-foreground">{d.academicPeriod}</p>
      <p className="text-foreground">
        Média:{" "}
        <span className="font-bold" style={{ color: scoreColor(d.avgScore) }}>
          {d.avgScore !== null ? d.avgScore.toFixed(1) : "—"}
        </span>
      </p>
      <p className="text-muted-foreground">{d.studentCount} aluno(s)</p>
    </div>
  );
}

export default function BenchmarkingPage() {
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");

  const { data: cycles } = useQuery({
    queryKey: ["cycles"],
    queryFn: () => coordinatorApi.getCycles(),
  });

  const { data: benchmarking, isLoading } = useQuery({
    queryKey: ["benchmarking", selectedCycleId],
    queryFn: () => coordinatorApi.getBenchmarking(selectedCycleId || undefined),
  });

  const withScores = benchmarking?.filter((c) => c.avgScore !== null) ?? [];
  const best = withScores.length
    ? withScores.reduce((a, b) => (a.avgScore! > b.avgScore! ? a : b))
    : null;
  const worst = withScores.length
    ? withScores.reduce((a, b) => (a.avgScore! < b.avgScore! ? a : b))
    : null;
  const atRisk = withScores.filter((c) => c.avgScore! < 50).length;
  const globalAvg = withScores.length
    ? (withScores.reduce((a, c) => a + c.avgScore!, 0) / withScores.length).toFixed(1)
    : null;

  const chartData = (benchmarking ?? []).map((c) => ({
    ...c,
    name:
      c.className.length > 14 ? c.className.slice(0, 12) + "…" : c.className,
    score: c.avgScore ?? 0,
  }));

  const allDimensions = Array.from(
    new Set(benchmarking?.flatMap((c) => c.dimensions.map((d) => d.dimension)) ?? [])
  ).sort();

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Benchmarking de Turmas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare o desempenho médio dos alunos entre as turmas da instituição.
          </p>
        </div>

        <select
          value={selectedCycleId}
          onChange={(e) => setSelectedCycleId(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos os ciclos</option>
          {cycles?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={14} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Média geral</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {isLoading ? "—" : globalAvg ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-green-600" />
            <p className="text-xs text-muted-foreground">Melhor turma</p>
          </div>
          <p className="text-sm font-bold text-foreground truncate">
            {isLoading ? "—" : best?.className ?? "—"}
          </p>
          {best && (
            <p className="text-xs text-green-600 font-semibold">{best.avgScore!.toFixed(1)}</p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-destructive rotate-180" />
            <p className="text-xs text-muted-foreground">Pior turma</p>
          </div>
          <p className="text-sm font-bold text-foreground truncate">
            {isLoading ? "—" : worst?.className ?? "—"}
          </p>
          {worst && (
            <p className="text-xs text-destructive font-semibold">{worst.avgScore!.toFixed(1)}</p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-destructive" />
            <p className="text-xs text-muted-foreground">Turmas em risco</p>
          </div>
          <p className="text-2xl font-bold text-destructive">
            {isLoading ? "—" : atRisk}
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Score médio por turma
        </h2>
        {isLoading ? (
          <div className="h-64 animate-pulse bg-muted rounded-lg" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Nenhuma turma encontrada.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, left: -10, bottom: 8 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--accent)", opacity: 0.4 }} />
              <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={scoreColor(entry.avgScore)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-500" /> ≥ 70
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-500" /> 50–69
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-red-500" /> &lt; 50
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-slate-400" /> Sem dados
          </span>
        </div>
      </div>

      {/* Dimension breakdown table */}
      {allDimensions.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Detalhamento por dimensão</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                    Turma
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground">
                    <Users size={12} className="inline mr-1" />
                    Alunos
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground">
                    Média geral
                  </th>
                  {allDimensions.map((dim) => (
                    <th
                      key={dim}
                      className="text-center px-3 py-3 text-xs font-medium text-muted-foreground capitalize"
                    >
                      {dim}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td colSpan={3 + allDimensions.length} className="px-5 py-3">
                        <div className="h-4 rounded bg-muted animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : (
                  benchmarking?.map((c) => (
                    <tr
                      key={c.classId}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium text-foreground">{c.className}</p>
                        <p className="text-xs text-muted-foreground">{c.academicPeriod}</p>
                      </td>
                      <td className="px-3 py-3 text-center text-muted-foreground">
                        {c.studentCount}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <ScoreBadge score={c.avgScore} />
                      </td>
                      {allDimensions.map((dim) => {
                        const d = c.dimensions.find((x) => x.dimension === dim);
                        return (
                          <td key={dim} className="px-3 py-3 text-center">
                            <ScoreBadge score={d?.avg ?? null} />
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
