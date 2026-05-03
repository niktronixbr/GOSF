"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coordinatorApi } from "@/lib/api/coordinator";
import { ApiError } from "@/lib/api/client";
import { EvaluationCycle } from "@/lib/api/evaluations";
import { Plus, Play, Square, CalendarDays, ClipboardList, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

function cycleStatusVariant(status: string): "success" | "warning" | "neutral" | "danger" {
  if (status === "OPEN") return "success";
  if (status === "DRAFT") return "warning";
  if (status === "CLOSED") return "neutral";
  return "neutral";
}

const cycleStatusLabel: Record<string, string> = {
  OPEN: "Aberto",
  DRAFT: "Rascunho",
  CLOSED: "Encerrado",
};

function CycleCard({
  cycle,
  onOpen,
  onClose,
}: {
  cycle: EvaluationCycle;
  onOpen: (id: string) => void;
  onClose: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-start justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{cycle.title}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <CalendarDays size={12} />
          {new Date(cycle.startsAt).toLocaleDateString("pt-BR")} –{" "}
          {new Date(cycle.endsAt).toLocaleDateString("pt-BR")}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Chip variant={cycleStatusVariant(cycle.status)}>
          {cycleStatusLabel[cycle.status] ?? cycle.status}
        </Chip>
        {cycle.status === "DRAFT" && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpen(cycle.id)}
          >
            <Play size={11} />
            Abrir
          </Button>
        )}
        {cycle.status === "OPEN" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onClose(cycle.id)}
          >
            <Square size={11} />
            Encerrar
          </Button>
        )}
      </div>
    </div>
  );
}

function FormsCard() {
  const qc = useQueryClient();
  const { data: forms, isLoading } = useQuery({
    queryKey: ["coordinator-forms"],
    queryFn: () => coordinatorApi.getForms(),
  });

  const seedMutation = useMutation({
    mutationFn: () => coordinatorApi.seedDefaultForms(),
    onSuccess: () => {
      toast.success("Formulários padrão criados com sucesso.");
      qc.invalidateQueries({ queryKey: ["coordinator-forms"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Erro ao criar formulários."),
  });

  if (isLoading) return <div className="h-16 rounded-xl bg-muted animate-pulse" />;

  const hasForms = (forms ?? []).length > 0;

  if (hasForms) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 p-4 flex items-center gap-3">
        <CheckCircle2 size={18} className="text-success shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-success">Formulários configurados</p>
          <p className="text-xs text-success">{forms!.length} formulário(s) disponível(is) para avaliação.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <AlertCircle size={18} className="text-warning shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-warning">Formulários não configurados</p>
          <p className="text-xs text-warning mt-0.5">
            Sem formulários, alunos e professores não conseguem realizar avaliações.
          </p>
        </div>
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={() => seedMutation.mutate()}
        disabled={seedMutation.isPending}
        className="shrink-0"
      >
        <ClipboardList size={13} />
        {seedMutation.isPending ? "Criando..." : "Usar formulários padrão"}
      </Button>
    </div>
  );
}

export default function CoordinatorCyclesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", startsAt: "", endsAt: "" });
  const { data: cycles, isLoading } = useQuery({
    queryKey: ["coordinator-cycles"],
    queryFn: () => coordinatorApi.getCycles(),
  });

  const createMutation = useMutation({
    mutationFn: () => coordinatorApi.createCycle(form),
    onSuccess: () => {
      toast.success("Ciclo criado com sucesso.");
      qc.invalidateQueries({ queryKey: ["coordinator-cycles"] });
      setShowForm(false);
      setForm({ title: "", startsAt: "", endsAt: "" });
    },
    onError: () => toast.error("Erro ao criar ciclo."),
  });

  const openMutation = useMutation({
    mutationFn: (id: string) => coordinatorApi.openCycle(id),
    onSuccess: () => {
      toast.success("Ciclo aberto.");
      qc.invalidateQueries({ queryKey: ["coordinator-cycles"] });
      qc.invalidateQueries({ queryKey: ["active-cycle"] });
    },
    onError: () => toast.error("Erro ao abrir ciclo."),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => coordinatorApi.closeCycle(id),
    onSuccess: () => {
      toast.success("Ciclo encerrado.");
      qc.invalidateQueries({ queryKey: ["coordinator-cycles"] });
      qc.invalidateQueries({ queryKey: ["active-cycle"] });
    },
    onError: () => toast.error("Erro ao encerrar ciclo."),
  });

  const canSubmit = form.title.length >= 3 && form.startsAt && form.endsAt;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ciclos de avaliação</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os ciclos da instituição.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowForm((v) => !v)}
          className="shrink-0"
        >
          <Plus size={15} />
          Novo ciclo
        </Button>
      </div>

      <FormsCard />

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-foreground">Novo ciclo</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Título</label>
              <input
                className="w-full rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Ex: 2025/1 — 1º Semestre"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Início</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.startsAt}
                  onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Fim</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.endsAt}
                  onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => createMutation.mutate()}
              disabled={!canSubmit || createMutation.isPending}
            >
              Criar
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted" />
          ))}
        </div>
      ) : (cycles ?? []).length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Nenhum ciclo cadastrado. Crie o primeiro ciclo de avaliação.
        </div>
      ) : (
        <div className="space-y-3">
          {(cycles ?? []).map((c) => (
            <CycleCard
              key={c.id}
              cycle={c}
              onOpen={(id) => openMutation.mutate(id)}
              onClose={(id) => closeMutation.mutate(id)}
            />
          ))}
        </div>
      )}

    </div>
  );
}
