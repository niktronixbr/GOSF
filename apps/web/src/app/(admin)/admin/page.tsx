"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Search,
  X,
  Pencil,
  PowerOff,
  Power,
  ShieldCheck,
} from "lucide-react";
import { adminApi, type AdminUser, type UserRole, type UserStatus } from "@/lib/api/admin";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const roleLabels: Record<UserRole, string> = {
  STUDENT: "Aluno",
  TEACHER: "Professor",
  COORDINATOR: "Coordenador",
  ADMIN: "Admin",
};

const statusLabels: Record<UserStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  SUSPENDED: "Suspenso",
  PENDING_VERIFICATION: "Pendente",
};

const roleColors: Record<UserRole, string> = {
  STUDENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  TEACHER: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  COORDINATOR: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ADMIN: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

const statusColors: Record<UserStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  INACTIVE: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  SUSPENDED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PENDING_VERIFICATION: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createSchema = z.object({
  fullName: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  role: z.enum(["STUDENT", "TEACHER", "COORDINATOR", "ADMIN"] as const),
});
type CreateForm = z.infer<typeof createSchema>;

const editSchema = z.object({
  fullName: z.string().min(2, "Mínimo 2 caracteres"),
  role: z.enum(["STUDENT", "TEACHER", "COORDINATOR", "ADMIN"] as const),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"] as const),
});
type EditForm = z.infer<typeof editSchema>;

// ─── Modal ────────────────────────────────────────────────────────────────────

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
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateUserModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: "STUDENT" },
  });

  const mutation = useMutation({
    mutationFn: adminApi.createUser,
    onSuccess: () => {
      toast.success("Usuário criado com sucesso");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      reset();
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao criar usuário"),
  });

  return (
    <Modal open={open} onClose={onClose} title="Novo usuário">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nome completo</label>
          <input
            {...register("fullName")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ex: João da Silva"
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">E-mail</label>
          <input
            {...register("email")}
            type="email"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="usuario@escola.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Senha inicial</label>
          <input
            {...register("password")}
            type="password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Mínimo 6 caracteres"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Papel</label>
          <select
            {...register("role")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="STUDENT">Aluno</option>
            <option value="TEACHER">Professor</option>
            <option value="COORDINATOR">Coordenador</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {mutation.isPending ? "Criando..." : "Criar usuário"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditUserModal({
  user,
  onClose,
}: {
  user: AdminUser | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    values: user
      ? { fullName: user.fullName, role: user.role, status: user.status }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (data: EditForm) => adminApi.updateUser(user!.id, data),
    onSuccess: () => {
      toast.success("Usuário atualizado");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao atualizar"),
  });

  return (
    <Modal open={!!user} onClose={onClose} title="Editar usuário">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nome completo</label>
          <input
            {...register("fullName")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">E-mail</label>
          <input
            value={user?.email ?? ""}
            readOnly
            className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Papel</label>
          <select
            {...register("role")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="STUDENT">Aluno</option>
            <option value="TEACHER">Professor</option>
            <option value="COORDINATOR">Coordenador</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select
            {...register("status")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="SUSPENDED">Suspenso</option>
            <option value="PENDING_VERIFICATION">Pendente</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.listUsers,
  });

  const toggleStatus = useMutation({
    mutationFn: (id: string) => adminApi.toggleStatus(id),
    onSuccess: (updated) => {
      toast.success(
        updated.status === "ACTIVE" ? "Usuário ativado" : "Usuário desativado",
      );
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Erro ao alterar status"),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        (roleFilter === "ALL" || u.role === roleFilter) &&
        (u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    );
  }, [users, search, roleFilter]);

  const counts = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === "ACTIVE").length,
      students: users.filter((u) => u.role === "STUDENT").length,
      teachers: users.filter((u) => u.role === "TEACHER").length,
    }),
    [users],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-indigo-100 p-3 dark:bg-indigo-900/30">
          <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Gestão de usuários</h1>
          <p className="text-sm text-muted-foreground">
            Crie, edite e gerencie os usuários da instituição
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Novo usuário
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: counts.total, color: "text-foreground" },
          { label: "Ativos", value: counts.active, color: "text-emerald-600" },
          { label: "Alunos", value: counts.students, color: "text-blue-600" },
          { label: "Professores", value: counts.teachers, color: "text-green-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "ALL")}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="ALL">Todos os papéis</option>
          <option value="STUDENT">Alunos</option>
          <option value="TEACHER">Professores</option>
          <option value="COORDINATOR">Coordenadores</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum usuário encontrado
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuário</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Papel</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                  Criado em
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[user.role]}`}
                    >
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[user.status]}`}
                    >
                      {statusLabels[user.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditUser(user)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => toggleStatus.mutate(user.id)}
                        disabled={toggleStatus.isPending}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
                          user.status === "ACTIVE"
                            ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
                        }`}
                        title={user.status === "ACTIVE" ? "Desativar" : "Ativar"}
                      >
                        {user.status === "ACTIVE" ? <PowerOff size={14} /> : <Power size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} />
      <EditUserModal user={editUser} onClose={() => setEditUser(null)} />
    </div>
  );
}
