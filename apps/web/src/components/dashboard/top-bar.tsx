"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, KeyRound, ChevronDown, UserPen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { NotificationsBell } from "./notifications-bell";
import { useAuthStore } from "@/store/auth.store";
import { usersApi } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";

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
  const { user, logout, updateUser } = useAuthStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });
  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  function openPasswordModal() {
    setMenuOpen(false);
    passwordForm.reset();
    setPasswordModalOpen(true);
  }

  function openProfileModal() {
    setMenuOpen(false);
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

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-end border-b border-border bg-card px-6 gap-3">
        <NotificationsBell />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </span>
            <span className="hidden sm:block text-sm font-medium max-w-[140px] truncate">
              {user?.fullName}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-card shadow-md z-50 py-1">
              <button
                onClick={openProfileModal}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                <UserPen className="h-4 w-4" />
                Editar perfil
              </button>
              <button
                onClick={openPasswordModal}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                <KeyRound className="h-4 w-4" />
                Trocar senha
              </button>
              <hr className="my-1 border-border" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Modal: Editar perfil */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Editar perfil</h2>

            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nome completo</label>
                <input
                  type="text"
                  {...profileForm.register("fullName")}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {profileForm.formState.errors.fullName && (
                  <p className="mt-1 text-xs text-destructive">
                    {profileForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  URL do avatar{" "}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  {...profileForm.register("avatarUrl")}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {profileForm.formState.errors.avatarUrl && (
                  <p className="mt-1 text-xs text-destructive">
                    {profileForm.formState.errors.avatarUrl.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={profileForm.formState.isSubmitting}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Trocar senha</h2>

            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Senha atual</label>
                <input
                  type="password"
                  {...passwordForm.register("currentPassword")}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="mt-1 text-xs text-destructive">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Nova senha</label>
                <input
                  type="password"
                  {...passwordForm.register("newPassword")}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="mt-1 text-xs text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Confirmar nova senha</label>
                <input
                  type="password"
                  {...passwordForm.register("confirmPassword")}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-xs text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={passwordForm.formState.isSubmitting}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
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
