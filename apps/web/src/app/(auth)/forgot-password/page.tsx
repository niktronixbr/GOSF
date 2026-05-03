"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, ArrowLeft, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-container">
                <CheckCircle2 className="text-on-success-container" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Verifique seu e-mail</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Se o e-mail estiver cadastrado, você receberá em instantes as instruções para
                  redefinir sua senha. O link expira em <strong>1 hora</strong>.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <ArrowLeft size={14} />
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Recuperar senha
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enviaremos um link no seu e-mail
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Slug da instituição
                  </label>
                  <Input
                    {...register("institutionSlug")}
                    placeholder="ex: escola-demo"
                  />
                  {errors.institutionSlug && (
                    <p className="mt-1 text-xs text-error">{errors.institutionSlug.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Seu e-mail
                  </label>
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="usuario@escola.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-error">{errors.email.message}</p>
                  )}
                </div>

                {errors.root && (
                  <p className="rounded-lg bg-error-container px-3 py-2 text-xs text-on-error-container">
                    {errors.root.message}
                  </p>
                )}

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Enviando..." : "Enviar instruções"}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={13} />
                  Voltar para login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
