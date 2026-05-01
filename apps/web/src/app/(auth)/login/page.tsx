import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Hero — sidebar navy */}
      <div className="relative hidden lg:flex flex-col justify-between bg-sidebar px-10 py-10 overflow-hidden">
        {/* Glows decorativos */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.08 195 / 0.18), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.62 0.13 60 / 0.12), transparent 70%)" }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-teal">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-[18px] font-extrabold text-white tracking-tight">GOSF</span>
        </div>

        {/* Body */}
        <div className="relative space-y-4">
          <h1 className="text-[28px] font-extrabold text-white leading-tight tracking-tight">
            Inteligência relacional<br />para educação de excelência
          </h1>
          <p className="text-[14px] text-white/50 leading-relaxed max-w-sm">
            Avaliações cruzadas, planos personalizados por IA e dashboards claros
            para alunos, professores e coordenação.
          </p>
        </div>

        {/* Stats */}
        <div className="relative flex gap-8">
          {[
            { value: "1.2k+", label: "Escolas" },
            { value: "98%",   label: "Adesão" },
            { value: "LGPD",  label: "Compliance" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-[18px] font-extrabold text-white tracking-tight">{value}</p>
              <p className="text-[11px] text-white/35 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-[16px] font-extrabold tracking-tight">GOSF</span>
          </div>

          <div>
            <h2 className="text-[22px] font-extrabold text-foreground tracking-tight">
              Entrar na plataforma
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Use suas credenciais institucionais
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-[12px] text-muted-foreground">
            Sua escola ainda não está cadastrada?{" "}
            <Link href="/register" className="text-primary hover:underline font-semibold">
              Cadastrar nova escola
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
