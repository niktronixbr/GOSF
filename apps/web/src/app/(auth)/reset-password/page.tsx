"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

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

  async function onSubmit(data: FormData) {
    try {
      await api.post("/auth/reset-password", { token, password: data.password }, true);
      setDone(true);
    } catch (e) {
      const msg =
        e instanceof Error && (e.message.includes("inválido") || e.message.includes("expirado"))
          ? "Link inválido ou expirado. Solicite um novo link."
          : "Erro ao redefinir a senha. Tente novamente.";
      setError("root", { message: msg });
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-error font-medium">
          Link inválido. Solicite uma nova redefinição de senha.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          Solicitar novamente
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-container">
          <CheckCircle2 className="text-on-success-container" size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Senha redefinida!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua senha foi atualizada com sucesso. Faça login com a nova senha.
          </p>
        </div>
        <Button onClick={() => router.push("/login")} className="w-full">
          Ir para o login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">Nova senha</label>
        <div className="relative">
          <input
            {...register("password")}
            type={showPw ? "text" : "password"}
            placeholder="Mínimo 6 caracteres"
            className="h-10 w-full rounded-lg border border-transparent bg-input px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:bg-card focus:border-primary focus:border-2 focus:outline-none transition-colors"
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
          <p className="mt-1 text-xs text-error">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Confirmar senha
        </label>
        <div className="relative">
          <input
            {...register("confirm")}
            type={showConfirm ? "text" : "password"}
            placeholder="Repita a senha"
            className="h-10 w-full rounded-lg border border-transparent bg-input px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:bg-card focus:border-primary focus:border-2 focus:outline-none transition-colors"
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
          <p className="mt-1 text-xs text-error">{errors.confirm.message}</p>
        )}
      </div>

      {errors.root && (
        <p className="rounded-lg bg-error-container px-3 py-2 text-xs text-on-error-container">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Hero side - bg primary marrom */}
      <div className="relative hidden lg:flex flex-col justify-between bg-primary px-10 py-10 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/25">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="font-bold text-lg">GOSF</p>
            <p className="text-xs uppercase tracking-wider opacity-75">Academic Excellence</p>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight">
            Inteligência relacional<br />para educação de excelência
          </h1>
          <p className="text-base opacity-80 max-w-md">
            Avaliações cruzadas, planos personalizados por IA e dashboards claros
            para alunos, professores e coordenação.
          </p>
        </div>

        <div className="flex gap-8">
          {[
            { value: "1.2k+", label: "Escolas" },
            { value: "98%", label: "Adesão" },
            { value: "LGPD", label: "Compliance" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs opacity-75 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap size={16} />
            </div>
            <span className="text-base font-bold">GOSF</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Definir nova senha
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie uma senha forte
            </p>
          </div>

          <Suspense
            fallback={
              <div className="text-center text-sm text-muted-foreground">Carregando...</div>
            }
          >
            <ResetPasswordForm />
          </Suspense>

          <p className="text-center text-xs text-muted-foreground">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={13} />
              Voltar para login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
