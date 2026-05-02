"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LockKeyhole, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api/client";

const schema = z
  .object({
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "As senhas não conferem",
    path: ["confirm"],
  });
type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm text-center">
        <p className="text-sm text-destructive font-medium">
          Link inválido. Solicite uma nova redefinição de senha.
        </p>
        <Link
          href="/forgot-password"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          Solicitar novamente
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={28} />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Senha redefinida!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sua senha foi atualizada com sucesso. Faça login com a nova senha.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="mt-6 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Ir para o login
        </button>
      </div>
    );
  }

  async function onSubmit(data: FormData) {
    try {
      await api.post("/auth/reset-password", { token, password: data.password }, true);
      setDone(true);
    } catch (e) {
      const msg = e instanceof Error && (e.message.includes("inválido") || e.message.includes("expirado"))
        ? "Link inválido ou expirado. Solicite um novo link."
        : "Erro ao redefinir a senha. Tente novamente.";
      setError("root", { message: msg });
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <LockKeyhole className="text-primary" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">Nova senha</h2>
          <p className="text-xs text-muted-foreground">Escolha uma senha forte com pelo menos 6 caracteres</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Nova senha</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPw ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Confirmar senha
          </label>
          <div className="relative">
            <input
              {...register("confirm")}
              type={showConfirm ? "text" : "password"}
              placeholder="Repita a senha"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirm && (
            <p className="mt-1 text-xs text-destructive">{errors.confirm.message}</p>
          )}
        </div>

        {errors.root && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {errors.root.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} />
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">GOSF</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Plataforma de inteligência educacional
          </p>
        </div>
        <Suspense fallback={<div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Carregando...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
