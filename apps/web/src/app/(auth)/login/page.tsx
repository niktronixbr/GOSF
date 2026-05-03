import type { Metadata } from "next";
import Link from "next/link";
import { GosfIcon } from "@/components/ui/GosfIcon";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Entrar — GOSF" };

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Hero side - bg primary marrom */}
      <div className="relative hidden lg:flex flex-col justify-between bg-primary px-10 py-10 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/25">
            <GosfIcon size={22} variant="outline" />
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
          {/* Symbol — visible on all screens, large on desktop */}
          <div className="flex flex-col items-start gap-2">
            <GosfIcon size={96} variant="filled" />
            <span className="text-sm font-bold tracking-widest uppercase text-primary">GOSF</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Entrar na plataforma
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use suas credenciais institucionais
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-xs text-muted-foreground">
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
