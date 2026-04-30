"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart2, Users, RefreshCw, BookOpen, Brain, Activity } from "lucide-react";
import { adminApi, type AdminMetrics } from "@/lib/api/admin";

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
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function RoleBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
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
      <div className="h-2 w-full rounded-full bg-muted">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CycleBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
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
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="ml-auto flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          Atualizar
        </button>
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

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Distribuição por papel</h2>
        <div className="space-y-3">
          <RoleBar label="Alunos" value={data.users.byRole.STUDENT} total={totalRoleUsers} color="bg-blue-500" />
          <RoleBar label="Professores" value={data.users.byRole.TEACHER} total={totalRoleUsers} color="bg-green-500" />
          <RoleBar label="Coordenadores" value={data.users.byRole.COORDINATOR} total={totalRoleUsers} color="bg-purple-500" />
          <RoleBar label="Admins" value={data.users.byRole.ADMIN} total={totalRoleUsers} color="bg-orange-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Ciclos de avaliação</h2>
          </div>
          <p className="mb-4 text-3xl font-bold">{data.cycles.total}</p>
          <div className="space-y-3">
            <CycleBar label="Rascunho" value={data.cycles.byStatus.DRAFT} total={totalCycles} color="bg-zinc-400" />
            <CycleBar label="Aberto" value={data.cycles.byStatus.OPEN} total={totalCycles} color="bg-emerald-500" />
            <CycleBar label="Fechado" value={data.cycles.byStatus.CLOSED} total={totalCycles} color="bg-blue-500" />
            <CycleBar label="Arquivado" value={data.cycles.byStatus.ARCHIVED} total={totalCycles} color="bg-slate-400" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Activity size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold">Submissões de avaliação</h2>
            </div>
            <p className="text-3xl font-bold text-indigo-600">{data.evaluations.totalSubmissions}</p>
            <p className="mt-1 text-xs text-muted-foreground">alunos avaliando professores + professores avaliando alunos</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
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
          </div>
        </div>
      </div>
    </div>
  );
}
