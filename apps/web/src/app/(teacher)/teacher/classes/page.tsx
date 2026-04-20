"use client";

import { useQuery } from "@tanstack/react-query";
import { coordinatorApi, TeacherClassAssignment } from "@/lib/api/coordinator";
import { BookOpen, GraduationCap, Tag } from "lucide-react";

function ClassCard({ item }: { item: TeacherClassAssignment }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <BookOpen size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{item.classGroup.name}</p>
            <p className="text-xs text-muted-foreground">Período: {item.classGroup.academicPeriod}</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <GraduationCap size={14} />
          {item.classGroup._count.enrollments} alunos
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Tag size={13} className="text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground">
          {item.subject.name}
          {item.subject.code ? (
            <span className="ml-1 text-xs text-muted-foreground/60">· {item.subject.code}</span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

export default function TeacherClassesPage() {
  const { data: classes, isLoading } = useQuery({
    queryKey: ["my-classes"],
    queryFn: () => coordinatorApi.getMyClasses(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minhas turmas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Turmas e disciplinas às quais você está atribuído.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted" />
          ))}
        </div>
      ) : classes?.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          Você ainda não foi atribuído a nenhuma turma.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {classes?.map((item) => (
            <ClassCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
