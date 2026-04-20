"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi, CycleScores } from "@/lib/api/analytics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const DIMENSION_COLORS: Record<string, string> = {
  participacao: "#6366f1",
  consistencia: "#f59e0b",
  desempenho: "#10b981",
  evolucao: "#3b82f6",
  entrega: "#ec4899",
};

const FALLBACK_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6"];

function buildChartData(history: CycleScores[]) {
  return history.map((c) => {
    const row: Record<string, string | number> = { cycle: c.cycleTitle };
    for (const s of c.scores) {
      row[s.dimension] = s.score;
    }
    return row;
  });
}

function allDimensions(history: CycleScores[]): string[] {
  const set = new Set<string>();
  for (const c of history) {
    for (const s of c.scores) set.add(s.dimension);
  }
  return Array.from(set);
}

function scoreLabel(score: number) {
  if (score >= 70) return { text: "Ótimo", color: "text-green-600" };
  if (score >= 50) return { text: "Regular", color: "text-yellow-600" };
  return { text: "Atenção", color: "text-destructive" };
}

export default function StudentProgressPage() {
  const { data: history, isLoading } = useQuery({
    queryKey: ["student-history"],
    queryFn: () => analyticsApi.studentHistory(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-72 rounded-xl bg-muted" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu progresso</h1>
          <p className="text-sm text-muted-foreground mt-1">Evolução por ciclo de avaliação</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          Nenhum histórico de avaliações encontrado. Complete avaliações de pelo menos um ciclo para visualizar sua evolução.
        </div>
      </div>
    );
  }

  const chartData = buildChartData(history);
  const dimensions = allDimensions(history);

  const latestCycle = history[history.length - 1];
  const latestAvg =
    latestCycle.scores.length
      ? Math.round(latestCycle.scores.reduce((a, s) => a + s.score, 0) / latestCycle.scores.length)
      : null;

  const prevCycle = history.length >= 2 ? history[history.length - 2] : null;
  const prevAvg =
    prevCycle && prevCycle.scores.length
      ? Math.round(prevCycle.scores.reduce((a, s) => a + s.score, 0) / prevCycle.scores.length)
      : null;

  const trend =
    latestAvg !== null && prevAvg !== null ? latestAvg - prevAvg : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu progresso</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Evolução por ciclo · {history.length} ciclo{history.length !== 1 ? "s" : ""} registrado{history.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Ciclo atual</p>
          <p className="mt-1 text-lg font-bold text-foreground truncate">{latestCycle.cycleTitle}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Média atual</p>
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
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Variação vs. ciclo anterior</p>
          {trend !== null ? (
            <p className={`mt-1 text-3xl font-bold ${trend >= 0 ? "text-green-600" : "text-destructive"}`}>
              {trend >= 0 ? "+" : ""}{trend}
            </p>
          ) : (
            <p className="mt-1 text-2xl font-bold text-muted-foreground">—</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-semibold text-foreground mb-4">Evolução por dimensão</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="cycle"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              formatter={(value: number, name: string) => [
                `${value.toFixed(0)}`,
                name.replace(/_/g, " "),
              ]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(val: string) => (
                <span style={{ fontSize: 12 }}>{val.replace(/_/g, " ")}</span>
              )}
            />
            {dimensions.map((dim, idx) => (
              <Line
                key={dim}
                type="monotone"
                dataKey={dim}
                stroke={DIMENSION_COLORS[dim] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-semibold text-foreground mb-4">Scores por ciclo</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left text-muted-foreground font-medium pr-4">Dimensão</th>
                {history.map((c) => (
                  <th key={c.cycleId} className="pb-2 text-right text-muted-foreground font-medium px-2">
                    {c.cycleTitle}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dimensions.map((dim) => (
                <tr key={dim} className="border-b border-border/50 last:border-0">
                  <td className="py-2 text-foreground capitalize pr-4">{dim.replace(/_/g, " ")}</td>
                  {history.map((c) => {
                    const s = c.scores.find((x) => x.dimension === dim);
                    return (
                      <td key={c.cycleId} className="py-2 text-right px-2">
                        {s ? (
                          <span className={`font-medium ${scoreLabel(s.score).color}`}>
                            {s.score.toFixed(0)}
                          </span>
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
    </div>
  );
}
