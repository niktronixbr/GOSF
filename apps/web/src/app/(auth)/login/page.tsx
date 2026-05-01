import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

const heroStats = [
  { value: "1.2k+", label: "Escolas parceiras" },
  { value: "98%",   label: "Taxa de adesão" },
  { value: "LGPD",  label: "Em conformidade" },
];

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Hero — lado esquerdo */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between bg-sidebar px-12 py-14 overflow-hidden">
        {/* Glow teal — canto superior */}
        <div
          className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.08 195), transparent 70%)" }}
        />
        {/* Glow âmbar — canto inferior */}
        <div
          className="pointer-events-none absolute -bottom-40 right-0 h-80 w-80 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, oklch(0.62 0.13 60), transparent 70%)" }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal">
            <span className="text-sm font-bold text-white">G</span>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">GOSF</span>
        </div>

        {/* Copy central */}
        <div className="relative space-y-4">
          <h1 className="text-[36px] font-extrabold leading-tight tracking-[-0.8px] text-white">
            Inteligência
            <br />
            Relacional
            <br />
            Educacional
          </h1>
          <p className="text-[15px] text-white/60 leading-relaxed max-w-xs">
            Plataforma SaaS que transforma dados de avaliação em planos personalizados de desenvolvimento para alunos e professores.
          </p>
        </div>

        {/* Stats */}
        <div className="relative flex gap-8">
          {heroStats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-white/50 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Formulário — lado direito */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-8 py-12">
        {/* Logo mobile */}
        <div className="flex lg:hidden items-center gap-2 mb-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal">
            <span className="text-sm font-bold text-white">G</span>
          </div>
          <span className="text-base font-bold tracking-tight">GOSF</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-[22px] font-bold tracking-tight text-foreground">
              Acesse sua conta
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Entre com as credenciais da sua instituição
            </p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Sua escola ainda não está cadastrada?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Cadastrar nova escola
            </Link>
          </p>

          <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Dados protegidos conforme a LGPD
          </div>
        </div>
      </div>
    </div>
  );
}
