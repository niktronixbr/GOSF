"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { evaluationsApi } from "@/lib/api/evaluations";
import { EvaluationFormComponent } from "@/features/evaluations/evaluation-form";

export default function EvaluateTeacherPage() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: targetsData, isLoading: loadingTargets } = useQuery({
    queryKey: ["student-targets"],
    queryFn: () => evaluationsApi.getTeachersForStudent(),
  });

  const { data: forms, isLoading: loadingForms } = useQuery({
    queryKey: ["forms", "TEACHER"],
    queryFn: () => evaluationsApi.getForms("TEACHER"),
  });

  const teacher = targetsData?.teachers.find((t) => t.teacherId === teacherId);
  const cycle = targetsData?.cycle;
  const form = forms?.[0];

  const mutation = useMutation({
    mutationFn: (payload: { answers: Record<string, number>; comment: string }) =>
      evaluationsApi.submitTeacherEvaluation({
        cycleId: cycle!.id,
        formId: form!.id,
        targetId: teacherId,
        answers: payload.answers,
        comment: payload.comment,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-targets"] });
      router.push("/student/evaluations");
    },
  });

  if (loadingTargets || loadingForms) {
    return (
      <div className="max-w-2xl space-y-4 animate-pulse">
        <div className="h-24 rounded-xl bg-muted" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="max-w-2xl rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Nenhum ciclo de avaliação aberto.
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="max-w-2xl rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Professor não encontrado ou não vinculado às suas turmas.
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-2xl rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Nenhum formulário de avaliação disponível. Contate o coordenador.
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Avaliar professor</h1>
        <p className="text-sm text-muted-foreground mt-1">Ciclo: {cycle.title}</p>
      </div>

      <EvaluationFormComponent
        form={form}
        targetName={teacher.fullName}
        onSubmit={(answers, comment) => mutation.mutateAsync({ answers, comment }) as Promise<void>}
        onCancel={() => router.push("/student/evaluations")}
      />
    </div>
  );
}
