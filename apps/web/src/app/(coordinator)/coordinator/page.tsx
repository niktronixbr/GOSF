"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { evaluationsApi } from "@/lib/api/evaluations";
import { coordinatorApi } from "@/lib/api/coordinator";
import { gradesApi } from "@/lib/api/grades";
import { AlertTriangle, Users, GraduationCap, BarChart2, BookOpen } from "lucide-react";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { BillingSuccessBanner } from "@/components/billing/BillingSuccessBanner";
import { Stat } from "@/components/ui/stat";

function scoreColor(score: number): string {
  if (score < 50) return "#ef4444";
  if (score < 70) return "#f59e0b";
  return "#22c55e";
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-muted-foreground">—</span>;
  const cls =
    score < 50
      ? "bg-red-100 text-red-700"
      : score < 70
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {score.toFixed(1)}
    </span>
  );
}

export default function CoordinatorHomePage() {
  const { data: cycle } = useQuery({
    queryKey: ["active-cycle"],
    queryFn: () => evaluationsApi.getActiveCycle(),
  });

  const { data: cycles } = useQuery({
    queryKey: ["coordinator-cycles"],
    queryFn: () => coordinatorApi.getCycles(),
  });

  const { data: teachers } = useQuery({
    queryKey: ["coordinator-teachers", cycle?.id],
    queryFn: () => coordinatorApi.getTeachers({ cycleId: cycle?.id, limit: 100 }),
    enabled: !!cycle?.id,
  });

  const { data: overview } = useQuery({
    queryKey: ["institution-overview", cycle?.id],
    queryFn: () => coordinatorApi.getOverview(cycle!.id),
    enabled: !!cycle?.id,
  });

  const { data: reports } = useQuery({
    queryKey: ["coordinator-reports", cycle?.id],
    queryFn: () => coordinatorApi.getReports(cycle!.id),
    enabled: !!cycle?.id,
  });

  const { data: gradesOverview } = useQuery({
    queryKey: ["coordinator-grades-overview"],
    queryFn: () => gradesApi.getOverview(),
  });

  // Dimensão médias para o gráfico
  const dimensionData = useMemo(() => {
    if (!overview) return [];

    const teacherDimMap: Record<string, number[]> = {};
    for (const s of overview.teacherScores) {
      if (!teacherDimMap[s.dimension]) teacherDimMap[s.dimension] = [];
      teacherDimMap[s.dimension].push(s.score);
    }

    const studentDimMap: Record<string, number[]> = {};
    for (const s of overview.studentScores) {
      if (!studentDimMap[s.dimension]) studentDimMap[s.dimension] = [];
      studentDimMap[s.dimension].push(s.score);
    }

    const allDims = new Set([
      ...Object.keys(teacherDimMap),
      ...Object.keys(studentDimMap),
    ]);

    return Array.from(allDims)
      .map((dim) => {
        const tVals = teacherDimMap[dim] ?? [];
        const sVals = studentDimMap[dim] ?? [];
        return {
          dimension: dim.charAt(0).toUpperCase() + dim.slice(1),
          professores:
            tVals.length
              ? Math.round((tVals.reduce((a, v) => a + v, 0) / tVals.length) * 10) / 10
              : null,
          alunos:
            sVals.length
              ? Math.round((sVals.reduce((a, v) => a + v, 0) / sVals.length) * 10) / 10
              : null,
        };
      })
      .sort((a, b) => a.dimension.localeCompare(b.dimension));
  }, [overview]);

  // KPIs
  const uniqueTeacherIds = new Set(overview?.teacherScores.map((s) => s.targetId) ?? []);
  const uniqueStudentIds = new Set(overview?.studentScores.map((s) => s.targetId) ?? []);
  const atRiskTeacherIds = new Set(overview?.atRiskTeachers.map((s) => s.targetId) ?? []);
  const atRiskStudentIds = new Set(overview?.atRiskStudents.map((s) => s.targetId) ?? []);

  const atRiskStudents = reports?.filter((r) => r.type === "STUDENT" && r.atRisk) ?? [];
  const atRiskTeachersList = (teachers?.data ?? []).filter((t) => t.avgScore !== null && t.avgScore < 50);
  const topTeachers = [...(teachers?.data ?? [])]
    .filter((t) => t.avgScore !== null)
    .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))
    .slice(0, 5);
  const lowTeachers = [...(teachers?.data ?? [])]
    .filter((t) => t.avgScore !== null && t.avgScore < 70)
    .sort((a, b) => (a.avgScore ?? 0) - (b.avgScore ?? 0))
    .slice(0, 5);

  const hasCycleData = !!cycle && (uniqueTeacherIds.size > 0 || uniqueStudentIds.size > 0);

  return (
    <div className="space-y-6">
      <BillingSuccessBanner />
      <OnboardingCard />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Visão Geral</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {cycle
            ? `Ciclo ativo: ${cycle.title}`
            : "Nenhum ciclo ativo. Abra um ciclo para ver dados de avaliação."}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat icon={<Users size={18} />} label="Professores avaliados" value={uniqueTeacherIds.size || (cycle ? 0 : "—")} />
        <Stat icon={<GraduationCap size={18} />} label="Alunos avaliados" value={uniqueStudentIds.size || (cycle ? 0 : "—")} />
        <Stat
          icon={<AlertTriangle size={18} />}
          label="Professores em risco"
          value={atRiskTeacherIds.size || (cycle ? 0 : "—")}
        />
        <Stat
          icon={<AlertTriangle size={18} />}
          label="Alunos em risco"
          value={atRiskStudentIds.size || (cycle ? 0 : "—")}
        />
        <Stat icon={<BookOpen size={18} />} label="Ciclos cadastrados" value={cycles?.length ?? "—"} />
        <Stat icon={<BarChart2 size={18} />} label="Status do ciclo" value={cycle ? "Aberto" : "Nenhum"} />
      </div>

      {gradesOverview?.atRiskSubjects && gradesOverview.atRiskSubjects.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {gradesOverview.atRiskSubjects.length} disciplina(s) com média abaixo de 6.0
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {gradesOverview.atRiskSubjects
                  .map((s) => `${s.subjectName} (${s.avg.toFixed(1)})`)
                  .join(" · ")}
              </p>
            </div>
          </div>
          <a
            href="/coordinator/reports"
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline shrink-0"
          >
            Ver relatório →
          </a>
        </div>
      )}

      {/* Gráfico de dimensões */}
      {hasCycleData && dimensionData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-1">Score médio por dimensão</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Média institucional no ciclo atual — escala 0–100
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={dimensionData}
              layout="vertical"
              margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="dimension"
                tick={{ fontSize: 12, fill: "#374151" }}
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}`, ""]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "13px",
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) =>
                  value === "professores" ? "Professores" : "Alunos"
                }
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              />
              <Bar
                dataKey="professores"
                name="professores"
                fill="#6366f1"
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
              />
              <Bar
                dataKey="alunos"
                name="alunos"
                fill="#22c55e"
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {cycle && !hasCycleData && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
          Nenhuma avaliação computada para este ciclo ainda. Feche o ciclo para calcular os scores.
        </div>
      )}

      {/* Rankings */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-3 text-foreground">Professores em atenção</h2>
          {lowTeachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {cycle ? "Nenhum professor abaixo de 70." : "Aguardando ciclo ativo."}
            </p>
          ) : (
            <div className="space-y-2">
              {lowTeachers.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate">{t.fullName}</span>
                  <ScoreBadge score={t.avgScore} />
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
            <div className="space-y-2">
              {topTeachers.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate">{t.fullName}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className="h-1.5 rounded-full bg-muted"
                      style={{ width: "60px" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${t.avgScore ?? 0}%`,
                          backgroundColor: scoreColor(t.avgScore ?? 0),
                        }}
                      />
                    </div>
                    <ScoreBadge score={t.avgScore} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alunos em risco */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-3 text-foreground">Alunos em risco</h2>
          {atRiskStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {cycle ? "Nenhum aluno em risco neste ciclo." : "Aguardando ciclo ativo."}
            </p>
          ) : (
            <div className="space-y-2">
              {atRiskStudents.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate">{s.fullName}</span>
                  <ScoreBadge score={s.avgScore} />
                </div>
              ))}
              {atRiskStudents.length > 5 && (
                <p className="text-xs text-muted-foreground pt-1">
                  +{atRiskStudents.length - 5} mais em risco — veja Relatórios
                </p>
              )}
            </div>
          )}
        </div>

        {/* Professores em risco */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-3 text-foreground">Professores em risco</h2>
          {atRiskTeachersList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {cycle ? "Nenhum professor em risco neste ciclo." : "Aguardando ciclo ativo."}
            </p>
          ) : (
            <div className="space-y-2">
              {atRiskTeachersList.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate">{t.fullName}</span>
                  <ScoreBadge score={t.avgScore} />
                </div>
              ))}
              {atRiskTeachersList.length > 5 && (
                <p className="text-xs text-muted-foreground pt-1">
                  +{atRiskTeachersList.length - 5} mais em risco — veja Relatórios
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
