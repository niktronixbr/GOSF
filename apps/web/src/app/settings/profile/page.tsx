"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserCircle, KeyRound } from "lucide-react";
import { usersApi } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function AvatarPreview({ avatarUrl, fullName }: { avatarUrl: string; fullName: string }) {
  if (avatarUrl.startsWith("http")) {
    return (
      <img
        src={avatarUrl}
        alt={fullName}
        className="h-20 w-20 rounded-full object-cover border border-border"
      />
    );
  }
  return (
    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border border-border">
      <span className="text-xl font-bold text-primary">
        {fullName ? getInitials(fullName) : "?"}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: usersApi.getMe,
  });

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (data && !initialized) {
      setFullName(data.fullName ?? "");
      setAvatarUrl(data.avatarUrl ?? "");
      setInitialized(true);
    }
  }, [data, initialized]);

  const profileDirty =
    fullName !== (data?.fullName ?? "") ||
    avatarUrl !== (data?.avatarUrl ?? "");

  const updateMut = useMutation({
    mutationFn: () =>
      usersApi.updateProfile({
        ...(fullName !== data?.fullName && { fullName }),
        ...(avatarUrl !== (data?.avatarUrl ?? "") && { avatarUrl: avatarUrl || undefined }),
      }),
    onSuccess: (updated) => {
      qc.setQueryData(["me"], updated);
      toast.success("Perfil atualizado");
    },
    onError: (err: ApiError) => {
      toast.error(err.message);
    },
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const passwordMut = useMutation({
    mutationFn: () => usersApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success("Senha alterada com sucesso");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
    },
    onError: (err: ApiError) => {
      if (err.status === 401) {
        setPasswordError("Senha atual incorreta");
      } else {
        setPasswordError(err.message);
      }
    },
  });

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem");
      return;
    }
    passwordMut.mutate();
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <UserCircle className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu perfil</h1>
          <p className="text-sm text-muted-foreground">
            Atualize seu nome e foto de perfil.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Dados pessoais</h2>

        <div className="flex items-center gap-4">
          <AvatarPreview avatarUrl={avatarUrl} fullName={fullName} />
          <p className="text-xs text-muted-foreground">
            Cole a URL de uma foto para atualizar o avatar.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Nome completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              URL da foto de perfil
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <button
          onClick={() => updateMut.mutate()}
          disabled={!profileDirty || updateMut.isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {updateMut.isPending ? "Salvando..." : "Salvar alterações"}
        </button>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Alterar senha</h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Senha atual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setPasswordError("");
              }}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Nova senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {passwordError && (
            <p className="text-sm text-red-600">{passwordError}</p>
          )}

          <button
            type="submit"
            disabled={passwordMut.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {passwordMut.isPending ? "Alterando..." : "Alterar senha"}
          </button>
        </form>
      </section>
    </div>
  );
}
