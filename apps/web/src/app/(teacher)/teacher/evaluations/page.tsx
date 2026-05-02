"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { evaluationsApi, StudentTarget } from "@/lib/api/evaluations";
import { CheckCircle, Clock, User } from "lucide-react";
import { Chip } from "@/components/ui/chip";

function StudentCard({ student }: { student: StudentTarget }) {
  return (
    <Link
      href={student.evaluated ? "#" : `/teacher/evaluations/${student.studentId}`}
      className={`block rounded-xl border bg-card p-5 shadow-sm transition-all ${
        student.evaluated
          ? "opacity-60 cursor-default border-border"
          : "border-border hover:border-primary/50 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <User size={20} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">{student.fullName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{student.classGroup}</p>
          </div>
        </div>

        <div className="flex-shrink-0">
          {student.evaluated ? (
            <Chip variant="success">
              <CheckCircle size={12} />
              Avaliado
            </Chip>
          ) : (
            <Chip variant="warning">
              <Clock size={12} />
              Pendente
            </Chip>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function TeacherEvaluationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["teacher-targets"],
    queryFn: () => evaluationsApi.getStudentsForTeacher(),
  });

  const pending = data?.students.filter((s) => !s.evaluated) ?? [];
  const done = data?.students.filter((s) => s.evaluated) ?? [];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Avaliar Alunos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data?.cycle
            ? `Ciclo: ${data.cycle.title}`
            : "Nenhum ciclo de avaliação aberto no momento."}
        </p>
      </div>

      {!data?.cycle && !isLoading && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Aguarde a abertura do próximo ciclo de avaliação.
        </div>
      )}

      {isLoading && (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Pendentes ({pending.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              {done.length}/{data?.students.length ?? 0} concluídas
            </span>
          </div>
          {pending.map((s) => (
            <StudentCard key={s.studentId} student={s} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Concluídas ({done.length})
          </h2>
          {done.map((s) => (
            <StudentCard key={s.studentId} student={s} />
          ))}
        </div>
      )}

      {data?.cycle && data.students.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Nenhum aluno vinculado às suas turmas ainda.
        </div>
      )}
    </div>
  );
}
