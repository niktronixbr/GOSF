"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { goalsApi, StudentGoal, GoalStatus } from "@/lib/api/goals";
import { toast } from "sonner";
import { Target, Plus, CheckCircle2, Circle, Clock, Pencil, Trash2, X } from "lucide-react";

const STATUS_LABELS: Record<GoalStatus, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
};

const STATUS_COLORS: Record<GoalStatus, string> = {
  PENDING: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DONE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const STATUS_ICONS: Record<GoalStatus, React.ReactNode> = {
  PENDING: <Circle size={18} className="text-slate-400" />,
  IN_PROGRESS: <Clock size={18} className="text-blue-500" />,
  DONE: <CheckCircle2 size={18} className="text-green-500" />,
};

const STATUS_CYCLE: Record<GoalStatus, GoalStatus> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "PENDING",
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(dueDate: string | null, status: GoalStatus) {
  if (!dueDate || status === "DONE") return false;
  return new Date(dueDate).getTime() < Date.now();
}

function isDueSoon(dueDate: string | null, status: GoalStatus) {
  if (!dueDate || status === "DONE") return false;
  const diff = new Date(dueDate).getTime() - Date.now();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
}

interface GoalFormData {
  title: string;
  description: string;
  dueDate: string;
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function GoalForm({
  initial,
  onSubmit,
  loading,
  onCancel,
}: {
  initial?: GoalFormData;
  onSubmit: (data: GoalFormData) => void;
  loading: boolean;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<GoalFormData>(
    initial ?? { title: "", description: "", dueDate: "" }
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit(form);
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Título *</label>
        <input
          className={inputClass}
          placeholder="Ex: Melhorar nota em matemática"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          maxLength={200}
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Descrição</label>
        <textarea
          className={`${inputClass} resize-none`}
          placeholder="Descreva sua meta com mais detalhes..."
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          maxLength={1000}
          rows={3}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Prazo</label>
        <input
          type="date"
          className={inputClass}
          value={form.dueDate}
          onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
          min={new Date().toISOString().split("T")[0]}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !form.title.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

function GoalCard({
  goal,
  onStatusToggle,
  onEdit,
  onDelete,
}: {
  goal: StudentGoal;
  onStatusToggle: (goal: StudentGoal) => void;
  onEdit: (goal: StudentGoal) => void;
  onDelete: (id: string) => void;
}) {
  const overdue = isOverdue(goal.dueDate, goal.status);
  const dueSoon = isDueSoon(goal.dueDate, goal.status);

  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 flex gap-3 items-start transition-opacity ${
        goal.status === "DONE" ? "opacity-60" : ""
      }`}
    >
      <button
        onClick={() => onStatusToggle(goal)}
        className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
        title={`Alterar para: ${STATUS_LABELS[STATUS_CYCLE[goal.status]]}`}
      >
        {STATUS_ICONS[goal.status]}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`font-medium text-sm leading-snug ${
              goal.status === "DONE" ? "line-through text-muted-foreground" : "text-foreground"
            }`}
          >
            {goal.title}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(goal)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
              title="Editar"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-muted transition-colors"
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {goal.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{goal.description}</p>
        )}

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[goal.status]}`}
          >
            {STATUS_LABELS[goal.status]}
          </span>

          {goal.dueDate && (
            <span
              className={`text-xs ${
                overdue
                  ? "text-destructive font-medium"
                  : dueSoon
                    ? "text-yellow-600 dark:text-yellow-400 font-medium"
                    : "text-muted-foreground"
              }`}
            >
              {overdue ? "Vencida: " : dueSoon ? "Vence em breve: " : "Prazo: "}
              {formatDate(goal.dueDate)}
            </span>
          )}

          {goal.completedAt && (
            <span className="text-xs text-muted-foreground">
              Concluída em {formatDate(goal.completedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudentGoalsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<StudentGoal | null>(null);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["student-goals"],
    queryFn: goalsApi.list,
  });

  const createMut = useMutation({
    mutationFn: (data: { title: string; description?: string; dueDate?: string }) =>
      goalsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-goals"] });
      toast.success("Meta criada!");
      setCreateOpen(false);
    },
    onError: () => toast.error("Erro ao criar meta"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof goalsApi.update>[1] }) =>
      goalsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-goals"] });
      setEditingGoal(null);
    },
    onError: () => toast.error("Erro ao atualizar meta"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => goalsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-goals"] });
      toast.success("Meta excluída");
    },
    onError: () => toast.error("Erro ao excluir meta"),
  });

  function handleCreate(form: GoalFormData) {
    createMut.mutate({
      title: form.title,
      description: form.description || undefined,
      dueDate: form.dueDate || undefined,
    });
  }

  function handleEdit(form: GoalFormData) {
    if (!editingGoal) return;
    updateMut.mutate({
      id: editingGoal.id,
      data: {
        title: form.title,
        description: form.description || undefined,
        dueDate: form.dueDate || undefined,
      },
    });
  }

  function handleStatusToggle(goal: StudentGoal) {
    updateMut.mutate({ id: goal.id, data: { status: STATUS_CYCLE[goal.status] } });
  }

  const pending = goals.filter((g) => g.status === "PENDING");
  const inProgress = goals.filter((g) => g.status === "IN_PROGRESS");
  const done = goals.filter((g) => g.status === "DONE");

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <Target size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Minhas Metas</h1>
            <p className="text-xs text-muted-foreground">Acompanhe seus objetivos acadêmicos</p>
          </div>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Nova meta
        </button>
      </div>

      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: goals.length, color: "text-foreground" },
            { label: "Em andamento", value: inProgress.length, color: "text-blue-600 dark:text-blue-400" },
            { label: "Concluídas", value: done.length, color: "text-green-600 dark:text-green-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-12 text-muted-foreground text-sm">
          Carregando metas...
        </div>
      )}

      {!isLoading && goals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Target size={28} className="text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">Nenhuma meta ainda</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Crie sua primeira meta para acompanhar seus objetivos acadêmicos.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-1 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus size={15} />
            Criar primeira meta
          </button>
        </div>
      )}

      {inProgress.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Em andamento ({inProgress.length})
          </h2>
          {inProgress.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onStatusToggle={handleStatusToggle}
              onEdit={setEditingGoal}
              onDelete={(id) => deleteMut.mutate(id)}
            />
          ))}
        </section>
      )}

      {pending.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pendentes ({pending.length})
          </h2>
          {pending.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onStatusToggle={handleStatusToggle}
              onEdit={setEditingGoal}
              onDelete={(id) => deleteMut.mutate(id)}
            />
          ))}
        </section>
      )}

      {done.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Concluídas ({done.length})
          </h2>
          {done.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onStatusToggle={handleStatusToggle}
              onEdit={setEditingGoal}
              onDelete={(id) => deleteMut.mutate(id)}
            />
          ))}
        </section>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nova meta">
        <GoalForm
          onSubmit={handleCreate}
          loading={createMut.isPending}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal
        open={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        title="Editar meta"
      >
        {editingGoal && (
          <GoalForm
            initial={{
              title: editingGoal.title,
              description: editingGoal.description ?? "",
              dueDate: editingGoal.dueDate ? editingGoal.dueDate.split("T")[0] : "",
            }}
            onSubmit={handleEdit}
            loading={updateMut.isPending}
            onCancel={() => setEditingGoal(null)}
          />
        )}
      </Modal>
    </div>
  );
}
