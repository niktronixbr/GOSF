"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { coordinatorApi } from "@/lib/api/coordinator";
import {
  ArrowLeft,
  User,
  Mail,
  Briefcase,
  BookOpen,
  ClipboardList,
  TrendingUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function scoreColor(score: number): string {
  if (score < 50) return "#ef4444";
  if (score < 70) return "#f59e0b";
  return "#22c55e";
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
      }`}
    >
      {active ? <CheckCircle size={11} /> : <XCircle size={11} />}
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function PlanBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    READY: { label: "Pronto", cls: "bg-green-100 text-green-700" },
    GENERATING: { label: "Gerando", cls: "bg-blue-100 text-blue-700" },
    FAILED: { label: "Falhou", cls: "bg-destructive/10 text-destructive" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
  );
}

interface LineTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function LineTooltip({ active, payload, label }: LineTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-md text-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-bold" style={{ color: scoreColor(payload[0].value) }}>
        {payload[0].value.toFixed(1)}
      </p>
    </div>
  );
}

export default function TeacherProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: teacherId } = use(params);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["teacher-profile", teacherId],
    queryFn: () => coordinatorApi.getTeacherProfile(teacherId),
    enabled: !!teacherId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl">
        <Link
          href="/coordinator/teachers"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Voltar para professores
        </Link>
        <p className="text-sm text-muted-foreground">Professor não encontrado.</p>
      </div>
    );
  }

  const latestCycle =
    profile.cycleHistory.length > 0
      ? profile.cycleHistory[profile.cycleHistory.length - 1]
      : null;

  const chartData = profile.cycleHistory.map((c) => ({
    name: c.cycleTitle.length > 14 ? c.cycleTitle.slice(0, 12) + "…" : c.cycleTitle,
    avg: c.avg,
  }));

  const dimensionData = latestCycle?.scores
    .map((s) => ({ dimension: s.dimension, score: s.score }))
    .sort((a, b) => b.score - a.score) ?? [];

  const allDimensions = Array.from(
    new Set(profile.cycleHistory.flatMap((c) => c.scores.map((s) => s.dimension)))
  ).sort();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back link */}
      <Link
        href="/coordinator/teachers"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Voltar para professores
      </Link>

      {/* Header card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center shrink-0">
            <User size={28} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{profile.fullName}</h1>
              <StatusBadge status={profile.status} />
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail size={14} /> {profile.email}
              </p>
              {profile.department && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Briefcase size={14} /> {profile.department}
                  {profile.specialty && ` — ${profile.specialty}`}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Membro desde{" "}
                {format(new Date(profile.createdAt), "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">Ciclos avaliados</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {profile.cycleHistory.length}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">Total de avaliações</p>
            <p className="text-2xl font-bold text-foreground mt-1">{profile.evaluationCount}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">Turmas atribuídas</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {profile.classAssignments.length}
            </p>
          </div>
        </div>
      </div>

      {/* Charts row */}
      {profile.cycleHistory.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Line chart — evolução histórica */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Evolução histórica</h2>
            </div>
            {chartData.length === 1 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Apenas 1 ciclo — gráfico disponível com 2 ou mais ciclos.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
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
                  <Tooltip content={<LineTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar chart — dimensões do último ciclo */}
          {dimensionData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList size={16} className="text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Scores por dimensão</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Último ciclo: {latestCycle?.cycleTitle}
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={dimensionData}
                  margin={{ top: 4, right: 8, left: -10, bottom: 4 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="dimension"
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
                  <Tooltip
                    formatter={(v: number) => [v.toFixed(1), "Score"]}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {dimensionData.map((entry, i) => (
                      <Cell key={i} fill={scoreColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Cycle history table */}
      {profile.cycleHistory.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Histórico de ciclos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                    Ciclo
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
                {[...profile.cycleHistory].reverse().map((c) => (
                  <tr
                    key={c.cycleId}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{c.cycleTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(c.startsAt), "MMM yyyy", { locale: ptBR })}
                        {c.endsAt &&
                          ` — ${format(new Date(c.endsAt), "MMM yyyy", { locale: ptBR })}`}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className="font-semibold text-sm"
                        style={{ color: scoreColor(c.avg) }}
                      >
                        {c.avg.toFixed(1)}
                      </span>
                    </td>
                    {allDimensions.map((dim) => {
                      const s = c.scores.find((x) => x.dimension === dim);
                      return (
                        <td key={dim} className="px-3 py-3 text-center">
                          {s ? (
                            <span
                              className="font-semibold text-sm"
                              style={{ color: scoreColor(s.score) }}
                            >
                              {s.score.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
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
      )}

      {/* Classes */}
      {profile.classAssignments.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <BookOpen size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Turmas atribuídas</h2>
          </div>
          <div className="divide-y divide-border">
            {profile.classAssignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.classGroup.name}</p>
                  <p className="text-xs text-muted-foreground">{a.classGroup.academicPeriod}</p>
                </div>
                <span className="text-xs rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                  {a.subject.name}
                  {a.subject.code && ` (${a.subject.code})`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Development plans */}
      {profile.developmentPlans.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <ClipboardList size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Planos de desenvolvimento</h2>
          </div>
          <div className="divide-y divide-border">
            {profile.developmentPlans.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.cycle.title}</p>
                  <p className="text-xs text-muted-foreground">
                    v{p.version} ·{" "}
                    {format(new Date(p.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <PlanBadge status={p.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.cycleHistory.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Nenhuma avaliação registrada para este professor.
          </p>
        </div>
      )}
    </div>
  );
}
