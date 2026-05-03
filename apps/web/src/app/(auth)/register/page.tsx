"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { GosfIcon } from "@/components/ui/GosfIcon";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import { institutionsApi } from "@/lib/api/institutions";
import { billingApi } from "@/lib/api/billing";
import { useAuthStore } from "@/store/auth.store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    slug: z
      .string()
      .min(2, "Slug deve ter pelo menos 2 caracteres")
      .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
    adminName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    adminEmail: z.string().email("E-mail inválido"),
    adminPassword: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.adminPassword === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const intervalParam = searchParams.get("interval");
  const login = useAuthStore((s) => s.login);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
      confirmPassword: "",
    },
  });

  const nameValue = form.watch("name");

  useEffect(() => {
    if (!form.getValues("slug") || form.getValues("slug") === toSlug(form.getValues("name"))) {
      form.setValue("slug", toSlug(nameValue), { shouldValidate: false });
    }
  }, [nameValue, form]);

  const { isSubmitting } = form.formState;

  async function onSubmit(values: FormValues) {
    try {
      await institutionsApi.register({
        name: values.name,
        slug: values.slug,
        adminName: values.adminName,
        adminEmail: values.adminEmail,
        adminPassword: values.adminPassword,
      });

      const res = await api.post<{ accessToken: string; refreshToken: string }>(
        "/auth/login",
        { institutionSlug: values.slug, email: values.adminEmail, password: values.adminPassword },
        true,
      );
      const redirectTo = login(res.accessToken, res.refreshToken);
      if (planParam && intervalParam) {
        try {
          const { url } = await billingApi.createCheckoutSession(planParam, intervalParam);
          window.location.href = url;
          return;
        } catch {
          // Segue para coordinator normalmente se checkout falhar
        }
      }
      router.push(redirectTo);
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 409
          ? "Este slug já está em uso. Escolha outro identificador para sua escola."
          : "Erro ao cadastrar. Verifique os dados e tente novamente.";
      toast.error(message);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {planParam && (
        <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-sm text-foreground">
          Você está assinando o plano{" "}
          <span className="font-semibold capitalize">{planParam}</span>
          {" "}— após o cadastro, você será redirecionado para o pagamento.
        </div>
      )}

      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Dados da escola
      </p>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Nome da escola
        </label>
        <Input
          {...form.register("name")}
          placeholder="ex: Escola Estadual João da Silva"
        />
        {form.formState.errors.name && (
          <p className="mt-1 text-xs text-error">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Identificador (slug)
        </label>
        <Input
          {...form.register("slug")}
          placeholder="ex: escola-joao-silva"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Usado no login: apenas letras minúsculas, números e hífens.
        </p>
        {form.formState.errors.slug && (
          <p className="mt-1 text-xs text-error">{form.formState.errors.slug.message}</p>
        )}
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">
        Administrador
      </p>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Nome completo
        </label>
        <Input
          {...form.register("adminName")}
          placeholder="ex: Maria Souza"
          autoComplete="name"
        />
        {form.formState.errors.adminName && (
          <p className="mt-1 text-xs text-error">
            {form.formState.errors.adminName.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">E-mail</label>
        <Input
          {...form.register("adminEmail")}
          type="email"
          placeholder="admin@escola.com"
          autoComplete="email"
        />
        {form.formState.errors.adminEmail && (
          <p className="mt-1 text-xs text-error">
            {form.formState.errors.adminEmail.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Senha</label>
          <Input
            {...form.register("adminPassword")}
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
          />
          {form.formState.errors.adminPassword && (
            <p className="mt-1 text-xs text-error">
              {form.formState.errors.adminPassword.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            Confirmar senha
          </label>
          <Input
            {...form.register("confirmPassword")}
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
          />
          {form.formState.errors.confirmPassword && (
            <p className="mt-1 text-xs text-error">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Cadastrando..." : "Criar conta"}
      </Button>
    </form>
  );
}

export default function RegisterPage() {
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
          <div className="flex items-center gap-2 lg:hidden">
            <GosfIcon size={34} variant="filled" />
            <span className="text-base font-bold">GOSF</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Cadastrar instituição
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie a conta da sua escola e comece hoje mesmo
            </p>
          </div>

          <Suspense>
            <RegisterForm />
          </Suspense>

          <p className="text-center text-xs text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="text-primary hover:underline font-semibold">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
