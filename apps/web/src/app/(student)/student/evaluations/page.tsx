"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { evaluationsApi, TeacherTarget } from "@/lib/api/evaluations";
import { CheckCircle, Clock, User } from "lucide-react";

function TeacherCard({ teacher }: { teacher: TeacherTarget }) {
  return (
    <Link
      href={teacher.evaluated ? "#" : `/student/evaluations/${teacher.teacherId}`}
      className={`block rounded-xl border bg-card p-5 shadow-sm transition-all ${
        teacher.evaluated
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
            <p className="font-medium text-foreground">{teacher.fullName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {teacher.subjects.join(" · ")}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0">
          {teacher.evaluated ? (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle size={14} />
              Avaliado
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium text-yellow-600">
              <Clock size={14} />
              Pendente
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function StudentEvaluationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["student-targets"],
    queryFn: () => evaluationsApi.getTeachersForStudent(),
  });

  const pending = data?.teachers.filter((t) => !t.evaluated) ?? [];
  const done = data?.teachers.filter((t) => t.evaluated) ?? [];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Avaliações</h1>
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
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Pendentes ({pending.length})
          </h2>
          {pending.map((t) => (
            <TeacherCard key={t.teacherId} teacher={t} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Concluídas ({done.length})
          </h2>
          {done.map((t) => (
            <TeacherCard key={t.teacherId} teacher={t} />
          ))}
        </div>
      )}

      {data?.cycle && data.teachers.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Nenhum professor vinculado às suas turmas ainda.
        </div>
      )}
    </div>
  );
}
