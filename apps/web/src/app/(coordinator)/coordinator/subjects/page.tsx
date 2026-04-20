"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coordinatorApi, SubjectInfo } from "@/lib/api/coordinator";
import { toast } from "sonner";
import { BookMarked, Plus, Trash2, X, Search } from "lucide-react";

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
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
          <h2 className="font-semibold text-foreground">Nova disciplina</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function CreateForm({
  onSubmit,
  loading,
  onCancel,
}: {
  onSubmit: (data: { name: string; code: string }) => void;
  loading: boolean;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), code: code.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Nome *</label>
        <input
          className={inputClass}
          placeholder="Ex: Matemática"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Código</label>
        <input
          className={inputClass}
          placeholder="Ex: MAT101"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={20}
        />
        <p className="text-xs text-muted-foreground">Opcional. Usado para identificação rápida.</p>
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
          disabled={loading || !name.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Criando..." : "Criar"}
        </button>
      </div>
    </form>
  );
}

function ConfirmDeleteDialog({
  subject,
  onConfirm,
  onCancel,
  loading,
}: {
  subject: SubjectInfo;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl p-6 flex flex-col gap-4">
        <div>
          <h2 className="font-semibold text-foreground">Excluir disciplina?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            A disciplina <span className="font-medium text-foreground">{subject.name}</span> será
            removida. Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CoordinatorSubjectsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubjectInfo | null>(null);
  const [search, setSearch] = useState("");

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["coordinator-subjects"],
    queryFn: coordinatorApi.getSubjects,
  });

  const createMut = useMutation({
    mutationFn: coordinatorApi.createSubject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coordinator-subjects"] });
      toast.success("Disciplina criada!");
      setCreateOpen(false);
    },
    onError: () => toast.error("Erro ao criar disciplina"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => coordinatorApi.deleteSubject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coordinator-subjects"] });
      toast.success("Disciplina excluída");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Erro ao excluir disciplina. Verifique se não há turmas vinculadas."),
  });

  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.code ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
            <BookMarked size={20} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Disciplinas</h1>
            <p className="text-xs text-muted-foreground">
              Gerencie as disciplinas da instituição
            </p>
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Nova disciplina
        </button>
      </div>

      {subjects.length > 0 && (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Buscar disciplina ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && subjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <BookMarked size={28} className="text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">Nenhuma disciplina cadastrada</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Crie disciplinas para vinculá-las às turmas e professores.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-1 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus size={15} />
            Criar primeira disciplina
          </button>
        </div>
      )}

      {!isLoading && filtered.length === 0 && subjects.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum resultado para &ldquo;{search}&rdquo;
        </p>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "disciplina" : "disciplinas"}
          </p>
          {filtered.map((subject) => (
            <div
              key={subject.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/20 shrink-0">
                  <BookMarked size={15} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{subject.name}</p>
                  {subject.code && (
                    <p className="text-xs text-muted-foreground">{subject.code}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setDeleteTarget(subject)}
                className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-muted transition-colors"
                title="Excluir disciplina"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)}>
        <CreateForm
          onSubmit={createMut.mutate}
          loading={createMut.isPending}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      {deleteTarget && (
        <ConfirmDeleteDialog
          subject={deleteTarget}
          onConfirm={() => deleteMut.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteMut.isPending}
        />
      )}
    </div>
  );
}
