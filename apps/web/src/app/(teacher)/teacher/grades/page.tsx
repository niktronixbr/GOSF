"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gradesApi, ClassSubjectGroup, StudentGradeEntry } from "@/lib/api/grades";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { scoreVariant } from "@/lib/score-color";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";

function gradeColor(avg: number | null) {
  if (avg === null) return "text-muted-foreground";
  if (avg >= 8) return "text-green-600";
  if (avg >= 6) return "text-yellow-600";
  return "text-red-600";
}

function GradeModal({
  student,
  cycleId,
  subjectId,
  onClose,
}: {
  student: StudentGradeEntry;
  cycleId: string;
  subjectId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [weightPct, setWeightPct] = useState("");
  const [value, setValue] = useState("");

  const upsertMutation = useMutation({
    mutationFn: () =>
      gradesApi.upsertGrade({
        studentId: student.studentId,
        subjectId,
        cycleId,
        title: title.trim(),
        weight: parseFloat(weightPct) / 100,
        value: parseFloat(value),
      }),
    onSuccess: () => {
      toast.success("Nota salva.");
      qc.invalidateQueries({ queryKey: ["teacher-grades"] });
      setTitle("");
      setWeightPct("");
      setValue("");
    },
    onError: () => toast.error("Erro ao salvar nota."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => gradesApi.deleteGrade(id),
    onSuccess: () => {
      toast.success("Nota removida.");
      qc.invalidateQueries({ queryKey: ["teacher-grades"] });
    },
    onError: () => toast.error("Erro ao remover nota."),
  });

  const canSave =
    title.trim().length >= 2 &&
    !isNaN(parseFloat(weightPct)) &&
    parseFloat(weightPct) > 0 &&
    parseFloat(weightPct) <= 100 &&
    !isNaN(parseFloat(value)) &&
    parseFloat(value) >= 0 &&
    parseFloat(value) <= 10;

  const totalWeight = student.grades.reduce((sum, g) => sum + g.weight * 100, 0);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogTitle>{student.fullName}</DialogTitle>
        {student.weightedAverage !== null && (
          <p className={clsx("text-sm font-medium mb-4", gradeColor(student.weightedAverage))}>
            Média atual: {student.weightedAverage.toFixed(1)}
          </p>
        )}

        <div className="space-y-4">
          {student.grades.length > 0 ? (
            <div className="space-y-2">
              {student.grades.map((g) => (
                <div key={g.id} className="space-y-1">
                  <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2 text-sm">
                    <span className="font-medium">{g.title}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-xs">{(g.weight * 100).toFixed(0)}%</span>
                      <span className={clsx("font-bold", gradeColor(g.value))}>{g.value.toFixed(1)}</span>
                      <button
                        onClick={() => deleteMutation.mutate(g.id)}
                        disabled={deleteMutation.isPending}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <ProgressBar value={g.value} max={10} variant={scoreVariant(g.value * 10)} />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Peso total lançado: {totalWeight.toFixed(0)}%
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma nota lançada ainda.</p>
          )}

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nova avaliação</p>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Título (ex: Prova 1, Trabalho)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Peso"
                  value={weightPct}
                  onChange={(e) => setWeightPct(e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nota (0–10)"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => upsertMutation.mutate()}
              disabled={!canSave || upsertMutation.isPending}
            >
              <Plus size={14} />
              {upsertMutation.isPending ? "Salvando..." : "Salvar nota"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClassCard({ group }: { group: ClassSubjectGroup }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentGradeEntry | null>(null);

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{group.className}</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {group.subjectName}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{group.students.length} alunos</span>
              {group.classAvg !== null && (
                <span className={clsx("font-semibold", gradeColor(group.classAvg))}>
                  Média da turma: {group.classAvg.toFixed(1)}
                </span>
              )}
              {group.cycleTitle && <span>Ciclo: {group.cycleTitle}</span>}
            </div>
          </div>
          {expanded ? (
            <ChevronDown size={16} className="text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
          )}
        </button>

        {expanded && (
          <div className="border-t border-border px-5 pb-4 space-y-2 pt-3">
            {group.students.map((student) => (
              <button
                key={student.studentId}
                onClick={() => setSelectedStudent(student)}
                className="w-full flex items-center justify-between rounded-lg bg-muted/30 hover:bg-muted/60 px-4 py-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={clsx(
                      "h-2 w-2 rounded-full shrink-0",
                      student.atRisk
                        ? "bg-red-500"
                        : student.weightedAverage !== null
                        ? "bg-green-500"
                        : "bg-muted-foreground",
                    )}
                  />
                  <span className="text-sm font-medium text-foreground">{student.fullName}</span>
                  {student.grades.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {student.grades.length} avaliação(ões)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {student.weightedAverage !== null ? (
                    <>
                      <div className="w-16">
                        <ProgressBar
                          value={student.weightedAverage}
                          max={10}
                          variant={scoreVariant(student.weightedAverage * 10)}
                        />
                      </div>
                      <span
                        className={clsx(
                          "text-sm font-bold w-8 text-right",
                          gradeColor(student.weightedAverage),
                        )}
                      >
                        {student.weightedAverage.toFixed(1)}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem nota</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedStudent && group.cycleId && (
        <GradeModal
          student={selectedStudent}
          cycleId={group.cycleId}
          subjectId={group.subjectId}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {selectedStudent && !group.cycleId && (
        <Dialog open onOpenChange={(open) => { if (!open) setSelectedStudent(null); }}>
          <DialogContent className="max-w-sm">
            <DialogTitle>Nenhum ciclo ativo</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Abra um ciclo de avaliação para lançar notas.
            </p>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default function TeacherGradesPage() {
  const { data: groups, isLoading } = useQuery({
    queryKey: ["teacher-grades"],
    queryFn: () => gradesApi.getStudentsForTeacher(),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lance e gerencie as notas dos alunos por turma e disciplina.
        </p>
      </div>

      {isLoading ? (
        <SkeletonTable rows={4} />
      ) : !groups?.length ? (
        <EmptyState
          title="Nenhuma nota lançada"
          description="Selecione uma turma e lance as notas dos alunos."
        />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <ClassCard key={`${group.classId}-${group.subjectId}`} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
