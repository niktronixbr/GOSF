"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coordinatorApi, SubjectInfo } from "@/lib/api/coordinator";
import { toast } from "sonner";
import { BookMarked, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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
    "w-full rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

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
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={loading || !name.trim()}>
          {loading ? "Criando..." : "Criar"}
        </Button>
      </div>
    </form>
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
        <Button
          variant="primary"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={16} />
          Nova disciplina
        </Button>
      </div>

      {subjects.length > 0 && (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-lg border border-outline-variant bg-input pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
          <Button
            variant="primary"
            className="mt-1"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={15} />
            Criar primeira disciplina
          </Button>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(subject)}
                title="Excluir disciplina"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={15} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={(open) => !open && setCreateOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogTitle>Nova disciplina</DialogTitle>
          <div className="mt-4">
            <CreateForm
              onSubmit={createMut.mutate}
              loading={createMut.isPending}
              onCancel={() => setCreateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Excluir disciplina</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            A disciplina <span className="font-medium text-foreground">{deleteTarget?.name}</span> será
            removida. Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} className="flex-1">
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
              disabled={deleteMut.isPending}
              className="flex-1"
            >
              {deleteMut.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
