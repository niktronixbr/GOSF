"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, KeyRound, ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { NotificationsBell } from "./notifications-bell";
import { useAuthStore } from "@/store/auth.store";
import { usersApi } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Obrigatório"),
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(1, "Obrigatório"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function TopBar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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
    reset();
    setModalOpen(true);
  }

  async function onSubmit(data: FormData) {
    try {
      await usersApi.changePassword(data.currentPassword, data.newPassword);
      toast.success("Senha alterada com sucesso. Faça login novamente.");
      setModalOpen(false);
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Trocar senha</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Senha atual</label>
                <input
                  type="password"
                  {...register("currentPassword")}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.currentPassword && (
                  <p className="mt-1 text-xs text-destructive">{errors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Nova senha</label>
                <input
                  type="password"
                  {...register("newPassword")}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.newPassword && (
                  <p className="mt-1 text-xs text-destructive">{errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Confirmar nova senha</label>
                <input
                  type="password"
                  {...register("confirmPassword")}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
