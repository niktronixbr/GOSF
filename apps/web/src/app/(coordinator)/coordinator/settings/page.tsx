"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coordinatorApi } from "@/lib/api/coordinator";
import { toast } from "sonner";
import { Save, Building2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  status: z.enum(["ACTIVE", "INACTIVE", "TRIAL", "SUSPENDED"]),
});

type FormValues = z.infer<typeof schema>;

function SkeletonForm() {
  return (
    <div className="animate-pulse space-y-5 max-w-lg">
      <div className="h-9 rounded-lg bg-muted w-2/3" />
      <div className="h-9 rounded-lg bg-muted" />
      <div className="h-9 rounded-lg bg-muted w-1/2" />
      <div className="h-9 rounded-lg bg-muted w-1/3" />
    </div>
  );
}

export default function CoordinatorSettingsPage() {
  const qc = useQueryClient();

  const { data: institution, isLoading } = useQuery({
    queryKey: ["institution-settings"],
    queryFn: () => coordinatorApi.getInstitution(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", status: "TRIAL" },
  });

  useEffect(() => {
    if (institution) {
      reset({
        name: institution.name,
        status: institution.status as FormValues["status"],
      });
    }
  }, [institution, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => coordinatorApi.updateInstitution(values),
    onSuccess: (updated) => {
      toast.success("Configurações salvas com sucesso.");
      qc.setQueryData(["institution-settings"], updated);
      reset({ name: updated.name, status: updated.status as FormValues["status"] });
    },
    onError: () => toast.error("Erro ao salvar configurações."),
  });

  const statusLabels: Record<string, string> = {
    ACTIVE: "Ativa",
    INACTIVE: "Inativa",
    TRIAL: "Período de teste",
    SUSPENDED: "Suspensa",
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-start gap-3">
        <Building2 size={24} className="text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações da instituição</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as informações básicas da sua instituição.
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonForm />
      ) : (
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground block">
                Nome da instituição
              </label>
              <input
                {...register("name")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nome da instituição"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground block">Slug</label>
              <input
                value={institution?.slug ?? ""}
                readOnly
                disabled
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                O slug é gerado automaticamente e não pode ser alterado.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground block">Status</label>
              <select
                {...register("status")}
                className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="text-xs text-destructive">{errors.status.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isDirty || mutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Save size={15} />
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
