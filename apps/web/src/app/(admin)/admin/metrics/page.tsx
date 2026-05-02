"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart2, Users, RefreshCw, BookOpen, Brain, Activity } from "lucide-react";
import { adminApi, type AdminMetrics } from "@/lib/api/admin";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function StatCard({
  label,
  value,
  sub,
  color = "text-foreground",
}: {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <Card>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function RoleBar({
  label,
  value,
  total,
  variant,
}: {
  label: string;
  value: number;
  total: number;
  variant: "primary" | "secondary" | "success" | "warning" | "danger";
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">
          {value} <span className="text-muted-foreground">({pct}%)</span>
        </span>
      </div>
      <ProgressBar value={value} max={total} variant={variant} />
    </div>
  );
}

function CycleBar({
  label,
  value,
  total,
  variant,
}: {
  label: string;
  value: number;
  total: number;
  variant: "primary" | "secondary" | "success" | "warning" | "danger";
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}</span>
      </div>
      <ProgressBar value={value} max={total} variant={variant} />
    </div>
  );
}

export default function AdminMetricsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<AdminMetrics>({
    queryKey: ["admin-metrics"],
    queryFn: adminApi.fetchMetrics,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        Carregando métricas...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Erro ao carregar métricas. Verifique sua conexão e tente novamente.
      </div>
    );
  }

  const totalRoleUsers =
    data.users.byRole.STUDENT +
    data.users.byRole.TEACHER +
    data.users.byRole.COORDINATOR +
    data.users.byRole.ADMIN;

  const totalCycles = data.cycles.total;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-indigo-100 p-3 dark:bg-indigo-900/30">
          <BarChart2 className="text-indigo-600 dark:text-indigo-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Métricas da instituição</h1>
          <p className="text-sm text-muted-foreground">Visão geral operacional</p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isFetching}
          variant="ghost"
          size="sm"
          className="ml-auto gap-2"
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          Atualizar
        </Button>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Users size={16} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Usuários</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total" value={data.users.total} />
          <StatCard label="Ativos" value={data.users.active} color="text-emerald-600" />
          <StatCard label="Alunos" value={data.users.byRole.STUDENT} color="text-blue-600" />
          <StatCard label="Professores" value={data.users.byRole.TEACHER} color="text-green-600" />
        </div>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold">Distribuição por papel</h2>
        <div className="space-y-3">
          <RoleBar label="Alunos" value={data.users.byRole.STUDENT} total={totalRoleUsers} variant="primary" />
          <RoleBar label="Professores" value={data.users.byRole.TEACHER} total={totalRoleUsers} variant="success" />
          <RoleBar label="Coordenadores" value={data.users.byRole.COORDINATOR} total={totalRoleUsers} variant="secondary" />
          <RoleBar label="Admins" value={data.users.byRole.ADMIN} total={totalRoleUsers} variant="warning" />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Ciclos de avaliação</h2>
          </div>
          <p className="mb-4 text-3xl font-bold">{data.cycles.total}</p>
          <div className="space-y-3">
            <CycleBar label="Rascunho" value={data.cycles.byStatus.DRAFT} total={totalCycles} variant="secondary" />
            <CycleBar label="Aberto" value={data.cycles.byStatus.OPEN} total={totalCycles} variant="success" />
            <CycleBar label="Fechado" value={data.cycles.byStatus.CLOSED} total={totalCycles} variant="primary" />
            <CycleBar label="Arquivado" value={data.cycles.byStatus.ARCHIVED} total={totalCycles} variant="secondary" />
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Activity size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold">Submissões de avaliação</h2>
            </div>
            <p className="text-3xl font-bold text-indigo-600">{data.evaluations.totalSubmissions}</p>
            <p className="mt-1 text-xs text-muted-foreground">alunos avaliando professores + professores avaliando alunos</p>
          </Card>

          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Brain size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold">Planos de IA gerados</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold text-violet-600">{data.aiPlans.studentPlans}</p>
                <p className="text-xs text-muted-foreground">para alunos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-600">{data.aiPlans.teacherPlans}</p>
                <p className="text-xs text-muted-foreground">para professores</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
