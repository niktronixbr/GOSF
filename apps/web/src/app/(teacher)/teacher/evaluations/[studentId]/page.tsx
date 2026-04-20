"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { evaluationsApi } from "@/lib/api/evaluations";
import { EvaluationFormComponent } from "@/features/evaluations/evaluation-form";

export default function EvaluateStudentPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: targetsData, isLoading: loadingTargets } = useQuery({
    queryKey: ["teacher-targets"],
    queryFn: () => evaluationsApi.getStudentsForTeacher(),
  });

  const { data: forms, isLoading: loadingForms } = useQuery({
    queryKey: ["forms", "STUDENT"],
    queryFn: () => evaluationsApi.getForms("STUDENT"),
  });

  const student = targetsData?.students.find((s) => s.studentId === studentId);
  const cycle = targetsData?.cycle;
  const form = forms?.[0];

  const mutation = useMutation({
    mutationFn: (payload: { answers: Record<string, number>; comment: string }) =>
      evaluationsApi.submitStudentEvaluation({
        cycleId: cycle!.id,
        formId: form!.id,
        targetId: studentId,
        answers: payload.answers,
        comment: payload.comment,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-targets"] });
      router.push("/teacher/evaluations");
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

  if (!student) {
    return (
      <div className="max-w-2xl rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Aluno não encontrado ou não vinculado às suas turmas.
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
        <h1 className="text-2xl font-bold text-foreground">Avaliar aluno</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ciclo: {cycle.title} · Turma: {student.classGroup}
        </p>
      </div>

      <EvaluationFormComponent
        form={form}
        targetName={student.fullName}
        onSubmit={(answers, comment) => mutation.mutateAsync({ answers, comment })}
        onCancel={() => router.push("/teacher/evaluations")}
      />
    </div>
  );
}
