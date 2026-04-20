"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  coordinatorApi,
  ClassGroup,
  ClassDetail,
  StudentOption,
  TeacherOption,
  SubjectInfo,
} from "@/lib/api/coordinator";
import {
  Plus,
  Users,
  BookOpen,
  ChevronDown,
  ChevronRight,
  X,
  GraduationCap,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { clsx } from "clsx";

function NewClassForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", academicPeriod: "" });
  const mutation = useMutation({
    mutationFn: () => coordinatorApi.createClass(form),
    onSuccess: () => {
      toast.success("Turma criada.");
      qc.invalidateQueries({ queryKey: ["classes"] });
      onClose();
    },
    onError: () => toast.error("Erro ao criar turma."),
  });
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
      <h2 className="font-semibold text-foreground">Nova turma</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Nome</label>
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ex: 3º A"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            Período letivo
          </label>
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ex: 2025"
            value={form.academicPeriod}
            onChange={(e) => setForm((f) => ({ ...f, academicPeriod: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
        <button
          disabled={!form.name || !form.academicPeriod || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          Criar
        </button>
      </div>
    </div>
  );
}

function EnrollPanel({
  classId,
  enrolled,
  allStudents,
}: {
  classId: string;
  enrolled: ClassDetail["enrollments"];
  allStudents: StudentOption[];
}) {
  const qc = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const enrolledIds = new Set(enrolled.map((e) => e.student.id));
  const available = allStudents.filter((s) => !enrolledIds.has(s.id));

  const enrollMutation = useMutation({
    mutationFn: () => coordinatorApi.enrollStudent(classId, selectedStudentId),
    onSuccess: () => {
      toast.success("Aluno matriculado.");
      qc.invalidateQueries({ queryKey: ["class-detail", classId] });
      setSelectedStudentId("");
    },
    onError: () => toast.error("Erro ao matricular aluno."),
  });

  const unenrollMutation = useMutation({
    mutationFn: (studentId: string) => coordinatorApi.unenrollStudent(classId, studentId),
    onSuccess: () => {
      toast.success("Matrícula removida.");
      qc.invalidateQueries({ queryKey: ["class-detail", classId] });
    },
    onError: () => toast.error("Erro ao remover matrícula."),
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="flex-1 appearance-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Selecionar aluno...</option>
          {available.map((s) => (
            <option key={s.id} value={s.id}>
              {s.user.fullName}
            </option>
          ))}
        </select>
        <button
          disabled={!selectedStudentId || enrollMutation.isPending}
          onClick={() => enrollMutation.mutate()}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
        >
          <Plus size={14} />
          Matricular
        </button>
      </div>
      {enrolled.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum aluno matriculado.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {enrolled.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between px-3 py-2.5 bg-card hover:bg-muted/40 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{e.student.user.fullName}</p>
                <p className="text-xs text-muted-foreground">{e.student.user.email}</p>
              </div>
              <button
                onClick={() => unenrollMutation.mutate(e.student.id)}
                disabled={unenrollMutation.isPending}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AssignPanel({
  classId,
  assignments,
  teachers,
  subjects,
}: {
  classId: string;
  assignments: ClassDetail["classAssignments"];
  teachers: TeacherOption[];
  subjects: SubjectInfo[];
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ teacherId: "", subjectId: "" });

  const assignMutation = useMutation({
    mutationFn: () => coordinatorApi.assignTeacher(classId, form),
    onSuccess: () => {
      toast.success("Professor atribuído.");
      qc.invalidateQueries({ queryKey: ["class-detail", classId] });
      setForm({ teacherId: "", subjectId: "" });
    },
    onError: () => toast.error("Erro ao atribuir professor."),
  });

  const removeMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      coordinatorApi.removeAssignment(classId, assignmentId),
    onSuccess: () => {
      toast.success("Atribuição removida.");
      qc.invalidateQueries({ queryKey: ["class-detail", classId] });
    },
    onError: () => toast.error("Erro ao remover atribuição."),
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <select
          value={form.teacherId}
          onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
          className="appearance-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Selecionar professor...</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.user.fullName}
            </option>
          ))}
        </select>
        <select
          value={form.subjectId}
          onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
          className="appearance-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Selecionar disciplina...</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.code ? ` (${s.code})` : ""}
            </option>
          ))}
        </select>
      </div>
      <button
        disabled={!form.teacherId || !form.subjectId || assignMutation.isPending}
        onClick={() => assignMutation.mutate()}
        className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        <Plus size={14} />
        Atribuir
      </button>
      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum professor atribuído.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {assignments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between px-3 py-2.5 bg-card hover:bg-muted/40 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{a.teacher.user.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {a.subject.name}
                  {a.subject.code ? ` · ${a.subject.code}` : ""}
                </p>
              </div>
              <button
                onClick={() => removeMutation.mutate(a.id)}
                disabled={removeMutation.isPending}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ClassCard({
  cls,
  students,
  teachers,
  subjects,
}: {
  cls: ClassGroup;
  students: StudentOption[];
  teachers: TeacherOption[];
  subjects: SubjectInfo[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"students" | "teachers">("students");

  const { data: detail, isLoading } = useQuery({
    queryKey: ["class-detail", cls.id],
    queryFn: () => coordinatorApi.getClassDetail(cls.id),
    enabled: expanded,
  });

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <BookOpen size={18} className="text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{cls.name}</p>
            <p className="text-xs text-muted-foreground">Período: {cls.academicPeriod}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <GraduationCap size={14} />
            {cls._count.enrollments} alunos
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users size={14} />
            {cls._count.classAssignments} prof.
          </span>
          {expanded ? (
            <ChevronDown size={16} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          <div className="flex rounded-lg border border-border bg-muted/30 overflow-hidden text-sm w-fit">
            <button
              onClick={() => setTab("students")}
              className={clsx(
                "px-4 py-1.5 font-medium transition-colors",
                tab === "students"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              Alunos
            </button>
            <button
              onClick={() => setTab("teachers")}
              className={clsx(
                "px-4 py-1.5 font-medium transition-colors",
                tab === "teachers"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              Professores
            </button>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-muted" />
              ))}
            </div>
          ) : detail ? (
            tab === "students" ? (
              <EnrollPanel
                classId={cls.id}
                enrolled={detail.enrollments}
                allStudents={students}
              />
            ) : (
              <AssignPanel
                classId={cls.id}
                assignments={detail.classAssignments}
                teachers={teachers}
                subjects={subjects}
              />
            )
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function CoordinatorClassesPage() {
  const [showForm, setShowForm] = useState(false);

  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: () => coordinatorApi.getClasses(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["student-options"],
    queryFn: () => coordinatorApi.getStudentOptions(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teacher-options"],
    queryFn: () => coordinatorApi.getTeacherOptions(),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => coordinatorApi.getSubjects(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Turmas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie turmas, alunos e professores da instituição.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancelar" : "Nova turma"}
        </button>
      </div>

      {showForm && <NewClassForm onClose={() => setShowForm(false)} />}

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted" />
          ))}
        </div>
      ) : classes?.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          Nenhuma turma cadastrada. Crie a primeira turma.
        </div>
      ) : (
        <div className="space-y-3">
          {classes?.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              students={students}
              teachers={teachers}
              subjects={subjects}
            />
          ))}
        </div>
      )}
    </div>
  );
}
