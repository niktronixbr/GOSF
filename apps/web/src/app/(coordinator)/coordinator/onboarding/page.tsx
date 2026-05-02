"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, ChevronRight, SkipForward } from "lucide-react";
import { coordinatorApi } from "@/lib/api/coordinator";
import { adminApi } from "@/lib/api/admin";

const teacherSchema = z.object({
  fullName: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type TeacherForm = z.infer<typeof teacherSchema>;

const classSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  academicPeriod: z.string().min(1, "Informe o período"),
});
type ClassForm = z.infer<typeof classSchema>;

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              i + 1 < current
                ? "bg-emerald-500 text-white"
                : i + 1 === current
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1 < current ? <CheckCircle2 size={14} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 rounded ${i + 1 < current ? "bg-emerald-500" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function WelcomeStep({
  institutionName,
  onNext,
  onSkipAll,
}: {
  institutionName: string;
  onNext: () => void;
  onSkipAll: () => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Bem-vindo ao GOSF! 🎉</h2>
      <p className="text-muted-foreground leading-relaxed">
        Sua instituição <strong>{institutionName}</strong> está pronta para usar a plataforma.
        Vamos configurar os itens essenciais em menos de 2 minutos.
      </p>
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
        <p>✅ Passo 2 — Adicionar um professor</p>
        <p>✅ Passo 3 — Criar a primeira turma</p>
      </div>
      <div className="flex justify-between pt-2">
        <button
          onClick={onSkipAll}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <SkipForward size={14} />
          Pular tudo
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Continuar
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function TeacherStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeacherForm>({ resolver: zodResolver(teacherSchema) });

  const mutation = useMutation({
    mutationFn: (data: TeacherForm) => adminApi.createUser({ ...data, role: "TEACHER" }),
    onSuccess: () => {
      toast.success("Professor criado com sucesso!");
      onNext();
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao criar professor"),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <h2 className="text-xl font-bold">Adicionar um professor</h2>
      <p className="text-sm text-muted-foreground">Crie a conta do primeiro professor da instituição.</p>

      <div>
        <label className="mb-1 block text-sm font-medium">Nome completo</label>
        <input
          {...register("fullName")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Ex: Ana Pereira"
        />
        {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">E-mail</label>
        <input
          {...register("email")}
          type="email"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="professor@escola.com"
        />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Senha inicial</label>
        <input
          {...register("password")}
          type="password"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Mínimo 6 caracteres"
        />
        {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onSkip}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <SkipForward size={14} />
          Pular este passo
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {mutation.isPending ? "Criando..." : "Criar professor"}
          <ChevronRight size={16} />
        </button>
      </div>
    </form>
  );
}

function ClassStep({ onFinish, onSkip }: { onFinish: () => void; onSkip: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassForm>({ resolver: zodResolver(classSchema) });

  const mutation = useMutation({
    mutationFn: (data: ClassForm) => coordinatorApi.createClass(data),
    onSuccess: () => {
      toast.success("Turma criada com sucesso!");
      onFinish();
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao criar turma"),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <h2 className="text-xl font-bold">Criar a primeira turma</h2>
      <p className="text-sm text-muted-foreground">
        As turmas organizam alunos e professores nos ciclos de avaliação.
      </p>

      <div>
        <label className="mb-1 block text-sm font-medium">Nome da turma</label>
        <input
          {...register("name")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Ex: 9º Ano A"
        />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Período letivo</label>
        <input
          {...register("academicPeriod")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Ex: 2026"
        />
        {errors.academicPeriod && (
          <p className="mt-1 text-xs text-destructive">{errors.academicPeriod.message}</p>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onSkip}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <SkipForward size={14} />
          Pular e ir para o painel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {mutation.isPending ? "Criando..." : "Criar turma e começar"}
          <ChevronRight size={16} />
        </button>
      </div>
    </form>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const { data: institution } = useQuery({
    queryKey: ["institution-me"],
    queryFn: coordinatorApi.getInstitution,
  });

  function skipAll() {
    localStorage.setItem("gosf_onboarding_skipped", "1");
    router.replace("/coordinator");
  }

  function finish() {
    router.replace("/coordinator");
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-sm">
        <StepIndicator current={step} total={3} />
        {step === 1 && (
          <WelcomeStep
            institutionName={institution?.name ?? "sua instituição"}
            onNext={() => setStep(2)}
            onSkipAll={skipAll}
          />
        )}
        {step === 2 && (
          <TeacherStep onNext={() => setStep(3)} onSkip={() => setStep(3)} />
        )}
        {step === 3 && (
          <ClassStep onFinish={finish} onSkip={finish} />
        )}
      </div>
    </div>
  );
}
