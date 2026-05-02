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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Editar perfil</DialogTitle>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 mt-4">
            <div>
              <label htmlFor="profile-fullName" className="mb-1 block text-sm font-medium text-foreground">
                Nome completo
              </label>
              <input
                id="profile-fullName"
                type="text"
                {...profileForm.register("fullName")}
                className="w-full rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-card focus:border-primary"
              />
              {profileForm.formState.errors.fullName && (
                <p className="mt-1 text-xs text-error">
                  {profileForm.formState.errors.fullName.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="profile-avatarUrl" className="mb-1 block text-sm font-medium text-foreground">
                URL do avatar{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <input
                id="profile-avatarUrl"
                type="text"
                placeholder="https://..."
                {...profileForm.register("avatarUrl")}
                className="w-full rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-card focus:border-primary"
              />
              {profileForm.formState.errors.avatarUrl && (
                <p className="mt-1 text-xs text-error">
                  {profileForm.formState.errors.avatarUrl.message}
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setProfileModalOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={profileForm.formState.isSubmitting} className="flex-1">
                {profileForm.formState.isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Trocar senha */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Trocar senha</DialogTitle>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 mt-4">
            <div>
              <label htmlFor="currentPassword" className="mb-1 block text-sm font-medium text-foreground">
                Senha atual
              </label>
              <input
                id="currentPassword"
                type="password"
                {...passwordForm.register("currentPassword")}
                className="w-full rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-card focus:border-primary"
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="mt-1 text-xs text-error">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-foreground">
                Nova senha
              </label>
              <input
                id="newPassword"
                type="password"
                {...passwordForm.register("newPassword")}
                className="w-full rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-card focus:border-primary"
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="mt-1 text-xs text-error">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-foreground">
                Confirmar nova senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...passwordForm.register("confirmPassword")}
                className="w-full rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-card focus:border-primary"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-xs text-error">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setPasswordModalOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={passwordForm.formState.isSubmitting} className="flex-1">
                {passwordForm.formState.isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
