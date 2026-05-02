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
import { AlertTriangle, Users, GraduationCap, BarChart2, BookOpen, Lightbulb } from "lucide-react";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { BillingSuccessBanner } from "@/components/billing/BillingSuccessBanner";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { InsightCard } from "@/components/ui/insight-card";
import { useChartColors } from "@/lib/chart-colors";

function scoreVariant(score: number): "success" | "warning" | "danger" {
  if (score >= 70) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

export default function CoordinatorHomePage() {
  const chartColors = useChartColors();

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
        <StatCard icon={<Users size={18} />} label="Professores avaliados" value={uniqueTeacherIds.size || (cycle ? 0 : "—")} />
        <StatCard icon={<GraduationCap size={18} />} label="Alunos avaliados" value={uniqueStudentIds.size || (cycle ? 0 : "—")} />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Professores em risco"
          value={atRiskTeacherIds.size || (cycle ? 0 : "—")}
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Alunos em risco"
          value={atRiskStudentIds.size || (cycle ? 0 : "—")}
        />
        <StatCard icon={<BookOpen size={18} />} label="Ciclos cadastrados" value={cycles?.length ?? "—"} />
        <StatCard icon={<BarChart2 size={18} />} label="Status do ciclo" value={cycle ? "Aberto" : "Nenhum"} />
      </div>

      {/* at-risk subjects */}
      {gradesOverview?.atRiskSubjects && gradesOverview.atRiskSubjects.length > 0 && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-warning" />
            <span className="text-sm font-semibold text-warning uppercase tracking-wide">
              Disciplinas em risco
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {gradesOverview.atRiskSubjects.map((s) => (
              <Chip key={s.subjectId} variant="warning">
                {s.subjectName} — média {s.avg.toFixed(1)}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Gráfico de dimensões */}
      {hasCycleData && dimensionData.length > 0 && (
        <Card>
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
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartColors.gridLine} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: chartColors.muted }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="dimension"
                tick={{ fontSize: 12, fill: chartColors.foreground }}
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}`, ""]}
                contentStyle={{
                  borderRadius: "8px",
                  border: `1px solid ${chartColors.gridLine}`,
                  fontSize: "13px",
                  background: "var(--surface)",
                  color: "var(--foreground)",
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
                fill={chartColors.primary}
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
              />
              <Bar
                dataKey="alunos"
                name="alunos"
                fill={chartColors.secondary}
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {cycle && !hasCycleData && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
          Nenhuma avaliação computada para este ciclo ainda. Feche o ciclo para calcular os scores.
        </div>
      )}

      {/* Rankings */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
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
                  {t.avgScore !== null ? (
                    <Chip variant={scoreVariant(t.avgScore)}>{t.avgScore.toFixed(1)}</Chip>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
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
                          backgroundColor:
                            t.avgScore !== null
                              ? t.avgScore >= 70
                                ? chartColors.success
                                : t.avgScore >= 50
                                ? chartColors.warning
                                : chartColors.danger
                              : chartColors.muted,
                        }}
                      />
                    </div>
                    {t.avgScore !== null ? (
                      <Chip variant={scoreVariant(t.avgScore)}>{t.avgScore.toFixed(1)}</Chip>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Alunos em risco */}
        <Card>
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
                  {s.avgScore !== null ? (
                    <Chip variant={scoreVariant(s.avgScore)}>{s.avgScore.toFixed(1)}</Chip>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              ))}
              {atRiskStudents.length > 5 && (
                <p className="text-xs text-muted-foreground pt-1">
                  +{atRiskStudents.length - 5} mais em risco — veja Relatórios
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Professores em risco */}
        <Card>
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
                  {t.avgScore !== null ? (
                    <Chip variant={scoreVariant(t.avgScore)}>{t.avgScore.toFixed(1)}</Chip>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              ))}
              {atRiskTeachersList.length > 5 && (
                <p className="text-xs text-muted-foreground pt-1">
                  +{atRiskTeachersList.length - 5} mais em risco — veja Relatórios
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      <InsightCard
        variant="tertiary"
        label="AÇÕES RECOMENDADAS"
        icon={<Lightbulb size={16} />}
        title="Próximos passos"
        description="Com base nos dados do ciclo atual."
        subItems={[
          { label: "Alunos em risco", text: "Acompanhe os alunos abaixo de 50 pontos e agende intervenções." },
          { label: "Benchmarking", text: "Compare o desempenho das turmas para identificar melhores práticas." },
          { label: "Relatórios", text: "Exporte os dados do ciclo para compartilhar com a direção." },
        ]}
      />
    </div>
  );
}
