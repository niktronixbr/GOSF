"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, KeyRound, UserPen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { usersApi } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsBell } from "./notifications-bell";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Obrigatório"),
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(1, "Obrigatório"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

const profileSchema = z.object({
  fullName: z.string().min(2, "Mínimo 2 caracteres"),
  avatarUrl: z.union([z.string().url("URL inválida"), z.literal("")]).optional(),
});

type PasswordForm = z.infer<typeof passwordSchema>;
type ProfileForm = z.infer<typeof profileSchema>;

export function TopBar() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });
  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  if (!user) return null;

  const firstName = user.fullName?.split(" ")[0] ?? "Usuário";

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  function openPasswordModal() {
    passwordForm.reset();
    setPasswordModalOpen(true);
  }

  function openProfileModal() {
    profileForm.reset({ fullName: user?.fullName ?? "", avatarUrl: "" });
    setProfileModalOpen(true);
  }

  async function onPasswordSubmit(data: PasswordForm) {
    try {
      await usersApi.changePassword(data.currentPassword, data.newPassword);
      toast.success("Senha alterada com sucesso. Faça login novamente.");
      setPasswordModalOpen(false);
      await logout();
      router.push("/login");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toast.error("Senha atual incorreta");
      } else {
        toast.error("Erro ao alterar senha");
      }
    }
  }

  async function onProfileSubmit(data: ProfileForm) {
    try {
      const updated = await usersApi.updateProfile({
        fullName: data.fullName,
        ...(data.avatarUrl ? { avatarUrl: data.avatarUrl } : {}),
      });
      updateUser({ fullName: updated.fullName });
      toast.success("Perfil atualizado com sucesso.");
      setProfileModalOpen(false);
    } catch {
      toast.error("Erro ao atualizar perfil");
    }
  }

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Olá, {firstName}
          </h1>
          <p className="text-xs text-muted-foreground">
            {/* mensagem secundária dinâmica - deixar vazia por ora */}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <NotificationsBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
                <Avatar
                  name={user.fullName}
                  src={null}
                  size="md"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={openProfileModal}>
                <UserPen size={14} />
                Editar perfil
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={openPasswordModal}>
                <KeyRound size={14} />
                Trocar senha
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} danger>
                <LogOut size={14} />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Modal: Editar perfil */}
      {profileModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => e.target === e.currentTarget && setProfileModalOpen(false)}
        >
          <div className="w-full max-w-sm rounded-xl border border-outline-variant bg-surface p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Editar perfil</h2>

            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Nome completo</label>
                <input
                  type="text"
                  {...profileForm.register("fullName")}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {profileForm.formState.errors.fullName && (
                  <p className="mt-1 text-xs text-error">
                    {profileForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  URL do avatar{" "}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  {...profileForm.register("avatarUrl")}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {profileForm.formState.errors.avatarUrl && (
                  <p className="mt-1 text-xs text-error">
                    {profileForm.formState.errors.avatarUrl.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="flex-1 rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-container transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={profileForm.formState.isSubmitting}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {profileForm.formState.isSubmitting ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Trocar senha */}
      {passwordModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => e.target === e.currentTarget && setPasswordModalOpen(false)}
        >
          <div className="w-full max-w-sm rounded-xl border border-outline-variant bg-surface p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Trocar senha</h2>

            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Senha atual</label>
                <input
                  type="password"
                  {...passwordForm.register("currentPassword")}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="mt-1 text-xs text-error">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Nova senha</label>
                <input
                  type="password"
                  {...passwordForm.register("newPassword")}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="mt-1 text-xs text-error">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Confirmar nova senha</label>
                <input
                  type="password"
                  {...passwordForm.register("confirmPassword")}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-xs text-error">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="flex-1 rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-container transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={passwordForm.formState.isSubmitting}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {passwordForm.formState.isSubmitting ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
