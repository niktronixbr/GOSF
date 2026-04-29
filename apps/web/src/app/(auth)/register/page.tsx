"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import { institutionsApi } from "@/lib/api/institutions";
import { billingApi } from "@/lib/api/billing";
import { useAuthStore } from "@/store/auth.store";

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
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function RegisterPage() {
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
        true
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

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">GOSF</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Plataforma de inteligência educacional
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <h2 className="mb-1 text-xl font-semibold text-card-foreground">Cadastrar nova escola</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Crie a conta da sua instituição e comece a usar o GOSF.
          </p>

          {planParam && (
            <div className="mb-4 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3 text-sm text-indigo-800">
              Você está assinando o plano{" "}
              <span className="font-semibold capitalize">{planParam}</span>
              {" "}— após o cadastro, você será redirecionado para o pagamento.
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dados da escola
            </p>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nome da escola
              </label>
              <input
                {...form.register("name")}
                placeholder="ex: Escola Estadual João da Silva"
                className={inputClass}
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Identificador (slug)
              </label>
              <input
                {...form.register("slug")}
                placeholder="ex: escola-joao-silva"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Usado no login: apenas letras minúsculas, números e hífens.
              </p>
              {form.formState.errors.slug && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">
              Administrador
            </p>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nome completo
              </label>
              <input
                {...form.register("adminName")}
                placeholder="ex: Maria Souza"
                autoComplete="name"
                className={inputClass}
              />
              {form.formState.errors.adminName && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.adminName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">E-mail</label>
              <input
                {...form.register("adminEmail")}
                type="email"
                placeholder="admin@escola.com"
                autoComplete="email"
                className={inputClass}
              />
              {form.formState.errors.adminEmail && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.adminEmail.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Senha</label>
                <input
                  {...form.register("adminPassword")}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={inputClass}
                />
                {form.formState.errors.adminPassword && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.adminPassword.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Confirmar senha
                </label>
                <input
                  {...form.register("confirmPassword")}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={inputClass}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting ? "Cadastrando..." : "Criar conta"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
