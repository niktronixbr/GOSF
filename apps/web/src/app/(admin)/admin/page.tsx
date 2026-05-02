"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  PowerOff,
  Power,
  ShieldCheck,
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { adminApi, type AdminUser, type UserRole, type UserStatus } from "@/lib/api/admin";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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

function roleChipVariant(role: UserRole): "info" | "success" | "warning" | "neutral" {
  if (role === "STUDENT") return "info";
  if (role === "TEACHER") return "success";
  if (role === "COORDINATOR") return "warning";
  return "neutral";
}

function statusChipVariant(status: UserStatus): "success" | "neutral" | "danger" | "warning" {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "danger";
  if (status === "PENDING_VERIFICATION") return "warning";
  return "neutral";
}

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

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
    onError: (e: Error) => toast.error(e.message ?? "Erro ao criar usuário"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent title="Novo usuário" className="max-w-md">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="mt-4 space-y-4">
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
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Criando..." : "Criar usuário"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditUserModal({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
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
    onError: (e: Error) => toast.error(e.message ?? "Erro ao atualizar"),
  });

  return (
    <Dialog open={!!user} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent title="Editar usuário" className="max-w-md">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="mt-4 space-y-4">
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
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LIMIT = 20;

export default function AdminPage() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 350);
  }

  useEffect(() => {
    setPage(1);
  }, [roleFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", { page, search, role: roleFilter }],
    queryFn: () =>
      adminApi.listUsers({ page, limit: LIMIT, search: search || undefined, role: roleFilter }),
    placeholderData: (prev) => prev,
  });

  const users = useMemo(() => data?.data ?? [], [data]);
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const toggleStatus = useMutation({
    mutationFn: (id: string) => adminApi.toggleStatus(id),
    onSuccess: (updated) => {
      toast.success(updated.status === "ACTIVE" ? "Usuário ativado" : "Usuário desativado");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Erro ao alterar status"),
  });

  const counts = useMemo(
    () => ({
      total: data?.total ?? 0,
      active: users.filter((u) => u.status === "ACTIVE").length,
      students: users.filter((u) => u.role === "STUDENT").length,
      teachers: users.filter((u) => u.role === "TEACHER").length,
    }),
    [data, users],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-surface-container p-3">
          <ShieldCheck className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Gestão de usuários</h1>
          <p className="text-sm text-muted-foreground">
            Crie, edite e gerencie os usuários da instituição
          </p>
        </div>
        <Button
          variant="primary"
          className="ml-auto"
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} />
          Novo usuário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Users size={20} />} label="Total de usuários" value={`${counts.total}`} />
        <StatCard icon={<UserCheck size={20} />} label="Usuários ativos" value={`${counts.active}`} />
        <StatCard icon={<GraduationCap size={20} />} label="Alunos" value={`${counts.students}`} />
        <StatCard icon={<BookOpen size={20} />} label="Professores" value={`${counts.teachers}`} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
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
      <Card noPadding>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : users.length === 0 ? (
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
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Chip variant={roleChipVariant(user.role)}>
                      {roleLabels[user.role]}
                    </Chip>
                  </td>
                  <td className="px-4 py-3">
                    <Chip variant={statusChipVariant(user.status)}>
                      {statusLabels[user.status]}
                    </Chip>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditUser(user)}
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus.mutate(user.id)}
                        disabled={toggleStatus.isPending}
                        title={user.status === "ACTIVE" ? "Desativar" : "Ativar"}
                      >
                        {user.status === "ACTIVE" ? <PowerOff size={14} /> : <Power size={14} />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Pagination */}
      <PaginationControls
        page={page}
        totalPages={totalPages}
        total={total}
        limit={LIMIT}
        onPage={setPage}
      />

      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} />
      <EditUserModal user={editUser} onClose={() => setEditUser(null)} />
    </div>
  );
}
