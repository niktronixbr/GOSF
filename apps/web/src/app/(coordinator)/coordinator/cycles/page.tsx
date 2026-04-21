"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coordinatorApi } from "@/lib/api/coordinator";
import { EvaluationCycle } from "@/lib/api/evaluations";
import { Plus, Play, Square, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { PaginationControls } from "@/components/ui/pagination-controls";

const LIMIT = 20;

function statusLabel(status: string) {
  if (status === "OPEN") return { label: "Aberto", cls: "bg-green-100 text-green-700" };
  if (status === "CLOSED") return { label: "Encerrado", cls: "bg-muted text-muted-foreground" };
  return { label: "Rascunho", cls: "bg-yellow-100 text-yellow-700" };
}

function CycleCard({
  cycle,
  onOpen,
  onClose,
}: {
  cycle: EvaluationCycle;
  onOpen: (id: string) => void;
  onClose: (id: string) => void;
}) {
  const { label, cls } = statusLabel(cycle.status);
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
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
        {cycle.status === "DRAFT" && (
          <button
            onClick={() => onOpen(cycle.id)}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Play size={11} />
            Abrir
          </button>
        )}
        {cycle.status === "OPEN" && (
          <button
            onClick={() => onClose(cycle.id)}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            <Square size={11} />
            Encerrar
          </button>
        )}
      </div>
    </div>
  );
}

export default function CoordinatorCyclesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", startsAt: "", endsAt: "" });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["coordinator-cycles", page],
    queryFn: () => coordinatorApi.getCycles({ page, limit: LIMIT }),
    placeholderData: (prev) => prev,
  });

  const cycles = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const createMutation = useMutation({
    mutationFn: () => coordinatorApi.createCycle(form),
    onSuccess: () => {
      toast.success("Ciclo criado com sucesso.");
      qc.invalidateQueries({ queryKey: ["coordinator-cycles"] });
      setShowForm(false);
      setForm({ title: "", startsAt: "", endsAt: "" });
      setPage(1);
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
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus size={15} />
          Novo ciclo
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-foreground">Novo ciclo</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Título</label>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.startsAt}
                  onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Fim</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.endsAt}
                  onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!canSubmit || createMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Criar
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted" />
          ))}
        </div>
      ) : cycles.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Nenhum ciclo cadastrado. Crie o primeiro ciclo de avaliação.
        </div>
      ) : (
        <div className="space-y-3">
          {cycles.map((c) => (
            <CycleCard
              key={c.id}
              cycle={c}
              onOpen={(id) => openMutation.mutate(id)}
              onClose={(id) => closeMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      <PaginationControls
        page={page}
        totalPages={totalPages}
        total={total}
        limit={LIMIT}
        onPage={setPage}
      />
    </div>
  );
}
