"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api/client";

const schema = z.object({
  institutionSlug: z.string().min(1, "Obrigatório"),
  email: z.string().email("E-mail inválido"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await api.post(
        "/auth/forgot-password",
        { email: data.email, institutionSlug: data.institutionSlug },
        true,
      );
      setSent(true);
    } catch {
      setError("root", { message: "Erro ao processar a solicitação. Tente novamente." });
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={28} />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Verifique seu e-mail</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Se o e-mail estiver cadastrado, você receberá em instantes as instruções para
            redefinir sua senha. O link expira em <strong>1 hora</strong>.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft size={14} />
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">GOSF</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Plataforma de inteligência educacional
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <KeyRound className="text-primary" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Esqueci minha senha</h2>
              <p className="text-xs text-muted-foreground">
                Enviaremos um link de redefinição por e-mail
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Slug da instituição
              </label>
              <input
                {...register("institutionSlug")}
                placeholder="ex: escola-demo"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.institutionSlug && (
                <p className="mt-1 text-xs text-destructive">{errors.institutionSlug.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Seu e-mail
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="usuario@escola.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
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
              {isSubmitting ? "Enviando..." : "Enviar instruções"}
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
      </div>
    </div>
  );
}
