"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi, CycleScores } from "@/lib/api/analytics";
import { gradesApi, GradeHistoryCycle } from "@/lib/api/grades";
import { dimensionLabel } from "@/lib/dimension-labels";
import {
  LineChart, Line,
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { useChartColors } from "@/lib/chart-colors";
import { Chip } from "@/components/ui/chip";
import { scoreVariant } from "@/lib/score-color";
import { SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const DIM_COLORS: Record<string, string> = {
  participacao: "#703e0e",
  consistencia: "#0061a5",
  desempenho:   "#1a6b3c",
  evolucao:     "#7c3aed",
  entrega:      "#b45309",
};
const FALLBACK_COLORS = ["#703e0e", "#0061a5", "#1a6b3c", "#7c3aed", "#b45309", "#be185d"];

function allDimensions(history: CycleScores[]): string[] {
  const set = new Set<string>();
  for (const c of history) for (const s of c.scores) set.add(s.dimension);
  return Array.from(set);
}

function scoreLabel(score: number) {
  if (score >= 70) return { text: "Ótimo", color: "text-success" };
  if (score >= 50) return { text: "Regular", color: "text-warning" };
  return { text: "Atenção", color: "text-error" };
}

function SingleCycleChart({ cycle }: { cycle: CycleScores }) {
  const chartColors = useChartColors();
  const data = cycle.scores.map((s) => ({
    name: dimensionLabel(s.dimension),
    score: s.score,
    raw: s.dimension,
  }));

  function barFill(score: number) {
    if (score >= 70) return chartColors.success;
    if (score >= 50) return chartColors.warning;
    return chartColors.danger;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridLine} horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: chartColors.muted }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 12, fill: chartColors.foreground }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value: number) => [`${value}`, "Score"]}
          contentStyle={{
            borderRadius: "8px",
            border: `1px solid ${chartColors.gridLine}`,
            background: "var(--surface)",
            color: "var(--foreground)",
            fontSize: "13px",
          }}
        />
        <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={18}>
          {data.map((entry, i) => (
            <Cell key={i} fill={barFill(entry.score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function MultiCycleChart({ history, dimensions }: { history: CycleScores[]; dimensions: string[] }) {
  const chartColors = useChartColors();
  const chartData = history.map((c) => {
    const row: Record<string, string | number> = { cycle: c.cycleTitle };
    for (const s of c.scores) row[s.dimension] = s.score;
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 8, right: 32, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridLine} />
        <XAxis
          dataKey="cycle"
          tick={{ fontSize: 12, fill: chartColors.muted }}
          tickLine={false}
          axisLine={false}
          padding={{ left: 32, right: 32 }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12, fill: chartColors.muted }}
          tickLine={false}
          axisLine={false}
          width={30}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: `1px solid ${chartColors.gridLine}`,
            background: "var(--surface)",
            color: "var(--foreground)",
            fontSize: "13px",
          }}
          formatter={(value: number, name: string) => [`${value}`, dimensionLabel(name)]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(val: string) => (
            <span style={{ fontSize: 12 }}>{dimensionLabel(val)}</span>
          )}
        />
        {dimensions.map((dim, idx) => (
          <Line
            key={dim}
            type="monotone"
            dataKey={dim}
            name={dim}
            stroke={DIM_COLORS[dim] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length]}
            strokeWidth={2.5}
            dot={{ r: 5 }}
            activeDot={{ r: 7 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function GradeHistorySection({ history }: { history: GradeHistoryCycle[] }) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Histórico de notas</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Notas por disciplina em cada ciclo de avaliação</p>
      </div>
      {history.map((cycle) => (
        <div key={cycle.cycleId} className="rounded-2xl border border-outline-variant bg-surface p-5">
          <p className="text-sm font-semibold text-foreground mb-3">{cycle.cycleTitle}</p>
          <div className="space-y-3">
            {cycle.subjects.map((subject) => (
              <div key={subject.subjectId}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">{subject.subjectName}</span>
                  {subject.weightedAverage !== null && (
                    <Chip variant={subject.weightedAverage >= 7 ? "success" : subject.weightedAverage >= 5 ? "warning" : "danger"}>
                      Média {subject.weightedAverage.toFixed(1)}
                    </Chip>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {subject.grades.map((g) => (
                    <div
                      key={g.id}
                      className="flex flex-col items-center rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 min-w-[72px]"
                    >
                      <span className="text-xs text-muted-foreground truncate max-w-[80px]" title={g.title}>{g.title}</span>
                      <span className="text-base font-bold text-foreground">{g.value.toFixed(1)}</span>
                      <span className="text-[10px] text-muted-foreground">peso {g.weight}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StudentProgressPage() {
  const { data: history, isLoading } = useQuery({
    queryKey: ["student-history"],
    queryFn: () => analyticsApi.studentHistory(),
  });

  const { data: gradeHistory, isLoading: gradesLoading } = useQuery({
    queryKey: ["student-grades-history"],
    queryFn: () => gradesApi.getMyGradesHistory(),
  });

  if (isLoading || gradesLoading) return <SkeletonTable rows={5} />;

  if (!history || history.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu progresso</h1>
          <p className="text-sm text-muted-foreground mt-1">Evolução por ciclo de avaliação</p>
        </div>
        <EmptyState
          title="Nenhum histórico encontrado"
          description="Complete avaliações de pelo menos um ciclo para visualizar sua evolução."
        />
      </div>
    );
  }

  const dimensions = allDimensions(history);
  const latestCycle = history[history.length - 1];
  const prevCycle = history.length >= 2 ? history[history.length - 2] : null;

  const avg = (cycle: CycleScores) =>
    cycle.scores.length
      ? Math.round(cycle.scores.reduce((a, s) => a + s.score, 0) / cycle.scores.length)
      : null;

  const latestAvg = avg(latestCycle);
  const prevAvg = prevCycle ? avg(prevCycle) : null;
  const trend = latestAvg !== null && prevAvg !== null ? latestAvg - prevAvg : null;
  const isSingleCycle = history.length === 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu progresso</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Evolução por ciclo · {history.length} ciclo{history.length !== 1 ? "s" : ""} registrado{history.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant bg-surface p-5">
          <p className="text-sm text-muted-foreground">Ciclo atual</p>
          <p className="mt-1 text-lg font-bold text-foreground truncate">{latestCycle.cycleTitle}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant bg-surface p-5">
          <p className="text-sm text-muted-foreground">Score médio</p>
          {latestAvg !== null ? (
            <>
              <p className="mt-1 text-3xl font-bold text-foreground">{latestAvg}</p>
              <p className={`text-xs font-medium mt-1 ${scoreLabel(latestAvg).color}`}>
                {scoreLabel(latestAvg).text}
              </p>
            </>
          ) : (
            <p className="mt-1 text-2xl font-bold text-muted-foreground">—</p>
          )}
        </div>
        <div className="rounded-2xl border border-outline-variant bg-surface p-5">
          <p className="text-sm text-muted-foreground">Variação vs. ciclo anterior</p>
          {trend !== null ? (
            <p className={`mt-1 text-3xl font-bold ${trend >= 0 ? "text-success" : "text-error"}`}>
              {trend >= 0 ? "+" : ""}{trend}
            </p>
          ) : (
            <p className="mt-1 text-2xl font-bold text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {/* Gráfico */}
      <div className="rounded-2xl border border-outline-variant bg-surface p-5">
        <h2 className="font-semibold text-foreground mb-1">
          {isSingleCycle ? "Score por critério" : "Evolução por critério"}
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          {isSingleCycle
            ? "Pontuação obtida em cada critério de avaliação neste ciclo."
            : "Como cada critério de avaliação evoluiu ao longo dos ciclos."}
        </p>
        {isSingleCycle
          ? <SingleCycleChart cycle={latestCycle} />
          : <MultiCycleChart history={history} dimensions={dimensions} />}
      </div>

      {/* Tabela de scores */}
      <div className="rounded-2xl border border-outline-variant bg-surface p-5">
        <h2 className="font-semibold text-foreground mb-4">Scores por ciclo</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="pb-2 text-left text-muted-foreground font-medium pr-4">Critério</th>
                {history.map((c) => (
                  <th key={c.cycleId} className="pb-2 text-right text-muted-foreground font-medium px-2">
                    {c.cycleTitle}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dimensions.map((dim) => (
                <tr key={dim} className="border-b border-outline-variant/50 last:border-0">
                  <td className="py-2 text-foreground pr-4">{dimensionLabel(dim)}</td>
                  {history.map((c) => {
                    const s = c.scores.find((x) => x.dimension === dim);
                    return (
                      <td key={c.cycleId} className="py-2 text-right px-2">
                        {s ? (
                          <Chip variant={scoreVariant(s.score)}>{s.score.toFixed(0)}</Chip>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {gradeHistory && gradeHistory.length > 0 && (
        <GradeHistorySection history={gradeHistory} />
      )}
    </div>
  );
}
