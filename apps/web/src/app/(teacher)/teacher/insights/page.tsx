"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi, StudentInsight } from "@/lib/api/analytics";
import { AlertTriangle, CheckCircle2, Users, TrendingUp } from "lucide-react";
import { clsx } from "clsx";

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={clsx("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono w-8 text-right text-muted-foreground">
        {score}
      </span>
    </div>
  );
}

function StudentCard({ student }: { student: StudentInsight }) {
  return (
    <div
      className={clsx(
        "rounded-xl border bg-card p-5 shadow-sm transition-colors",
        student.atRisk ? "border-red-300 dark:border-red-800" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-semibold text-foreground">{student.fullName}</p>
          {student.avgScore !== null ? (
            <p className="text-sm text-muted-foreground mt-0.5">
              Score médio:{" "}
              <span
                className={clsx(
                  "font-semibold",
                  student.avgScore >= 70
                    ? "text-green-600"
                    : student.avgScore >= 50
                    ? "text-yellow-600"
                    : "text-red-600"
                )}
              >
                {student.avgScore}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">Sem dados no ciclo atual</p>
          )}
        </div>

        {student.atRisk ? (
          <div className="flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400 shrink-0">
            <AlertTriangle size={12} />
            Risco
          </div>
        ) : student.avgScore !== null ? (
          <div className="flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400 shrink-0">
            <CheckCircle2 size={12} />
            Regular
          </div>
        ) : null}
      </div>

      {student.scores.length > 0 && (
        <div className="space-y-2">
          {student.scores.map((s) => (
            <div key={s.dimension}>
              <p className="text-xs text-muted-foreground mb-1 capitalize">{s.dimension}</p>
              <ScoreBar score={s.score} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeacherInsightsPage() {
  const { data: students, isLoading } = useQuery({
    queryKey: ["teacher-student-insights"],
    queryFn: () => analyticsApi.teacherStudentInsights(),
  });

  const atRiskCount = students?.filter((s) => s.atRisk).length ?? 0;
  const regularCount = students?.filter((s) => !s.atRisk && s.avgScore !== null).length ?? 0;
  const noDataCount = students?.filter((s) => s.avgScore === null).length ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 rounded-xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Insights dos alunos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão analítica dos alunos que você avaliou no ciclo atual.
        </p>
      </div>

      {students && students.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
            <Users size={20} className="mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold text-foreground">{students.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Alunos avaliados</p>
          </div>
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-center shadow-sm">
            <AlertTriangle size={20} className="mx-auto text-red-500 mb-1" />
            <p className="text-2xl font-bold text-red-600">{atRiskCount}</p>
            <p className="text-xs text-red-500 mt-0.5">Em risco (score &lt; 50)</p>
          </div>
          <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 text-center shadow-sm">
            <TrendingUp size={20} className="mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold text-green-600">{regularCount}</p>
            <p className="text-xs text-green-500 mt-0.5">Em dia</p>
          </div>
        </div>
      )}

      {!students || students.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          <Users size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-foreground">Nenhum aluno avaliado ainda.</p>
          <p className="text-sm mt-1">
            Os insights aparecerão após você submeter avaliações para os alunos.
          </p>
        </div>
      ) : (
        <>
          {atRiskCount > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle size={14} />
                Alunos em risco — precisam de atenção
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {students
                  .filter((s) => s.atRisk)
                  .map((s) => (
                    <StudentCard key={s.studentId} student={s} />
                  ))}
              </div>
            </section>
          )}

          {regularCount > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Alunos em acompanhamento regular
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {students
                  .filter((s) => !s.atRisk && s.avgScore !== null)
                  .map((s) => (
                    <StudentCard key={s.studentId} student={s} />
                  ))}
              </div>
            </section>
          )}

          {noDataCount > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Sem dados no ciclo atual
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {students
                  .filter((s) => s.avgScore === null)
                  .map((s) => (
                    <StudentCard key={s.studentId} student={s} />
                  ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
