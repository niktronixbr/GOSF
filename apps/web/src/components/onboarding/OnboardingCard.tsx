"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { coordinatorApi } from "@/lib/api/coordinator";
import { useAuthStore } from "@/store/auth.store";
import { OnboardingStepSubjects } from "./OnboardingStepSubjects";
import { OnboardingStepClasses } from "./OnboardingStepClasses";
import { OnboardingStepTeachers } from "./OnboardingStepTeachers";
import { OnboardingStepStudents } from "./OnboardingStepStudents";

const DISMISS_KEY = "gosf_onboarding_dismissed";

const STEPS = [
  { key: "subjects", label: "Disciplinas" },
  { key: "classes", label: "Turmas" },
  { key: "teachers", label: "Professores" },
  { key: "students", label: "Alunos" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function OnboardingCard() {
  const user = useAuthStore((s) => s.user);
  const [dismissed, setDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [expanded, setExpanded] = useState<StepKey | null>(null);
  const bannerShownRef = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) setDismissed(true);
  }, []);

  const { data: subjects } = useQuery({ queryKey: ["onboarding-subjects"], queryFn: () => coordinatorApi.getSubjects() });
  const { data: classes } = useQuery({ queryKey: ["onboarding-classes"], queryFn: () => coordinatorApi.getClasses() });
  const { data: teachers } = useQuery({ queryKey: ["onboarding-teachers"], queryFn: () => coordinatorApi.getTeacherOptions() });
  const { data: students } = useQuery({ queryKey: ["onboarding-students"], queryFn: () => coordinatorApi.getStudentOptions() });

  const completed = useMemo(
    () =>
      new Set<StepKey>([
        ...(subjects && subjects.length > 0 ? ["subjects" as StepKey] : []),
        ...(classes && classes.length > 0 ? ["classes" as StepKey] : []),
        ...(teachers && teachers.length > 0 ? ["teachers" as StepKey] : []),
        ...(students && students.length > 0 ? ["students" as StepKey] : []),
      ]),
    [subjects, classes, teachers, students],
  );

  const allDone = completed.size === 4;

  useEffect(() => {
    if (allDone && !bannerShownRef.current) {
      bannerShownRef.current = true;
      setShowBanner(true);
      const t = setTimeout(() => {
        sessionStorage.setItem(DISMISS_KEY, "1");
        setDismissed(true);
        setShowBanner(false);
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [allDone]);

  const hasAutoOpenedRef = useRef(false);
  useEffect(() => {
    if (hasAutoOpenedRef.current || allDone) return;
    if (!subjects || !classes || !teachers || !students) return;
    const first = STEPS.find((s) => !completed.has(s.key));
    if (first) {
      setExpanded(first.key);
      hasAutoOpenedRef.current = true;
    }
  }, [subjects, classes, teachers, students, allDone, completed]);

  function handleComplete(nextKey?: StepKey) {
    if (nextKey) setExpanded(nextKey);
    else setExpanded(null);
  }

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  if (user?.role !== "COORDINATOR") return null;
  if (dismissed) return null;
  if (allDone && !showBanner) return null;

  if (allDone && showBanner) {
    return (
      <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5 text-center">
        <p className="text-xl mb-1">🎉</p>
        <p className="font-semibold text-green-800 text-sm">Tudo configurado! Sua instituição está pronta.</p>
        <p className="text-xs text-green-500 mt-1">Este card vai desaparecer em instantes...</p>
      </div>
    );
  }

  const doneCount = completed.size;
  const progressPct = (doneCount / 4) * 100;

  return (
    <div className={`mb-6 rounded-xl border p-5 ${doneCount > 0 ? "border-green-200 bg-green-50/50" : "border-primary/30 bg-primary/5"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground">Configure sua instituição</span>
          <span className="text-xs text-muted-foreground">{doneCount} de 4 etapas concluídas</span>
        </div>
        <button onClick={dismiss} className="text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-0.5 bg-background">
          Fazer depois
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-border mb-4 overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Steps */}
      <div className="flex gap-2 mb-4">
        {STEPS.map((step, i) => {
          const isCompleted = completed.has(step.key);
          const isActive = expanded === step.key;
          return (
            <button
              key={step.key}
              onClick={() => setExpanded(isActive ? null : step.key)}
              className={`flex-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all border
                ${isCompleted ? "bg-green-100 border-green-300 text-green-800" :
                  isActive ? "bg-background border-primary text-primary ring-1 ring-primary" :
                  "bg-muted/50 border-border text-muted-foreground"}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                ${isCompleted ? "bg-green-500 text-white" : isActive ? "bg-primary text-primary-foreground" : "bg-border text-muted-foreground"}`}>
                {isCompleted ? "✓" : i + 1}
              </span>
              {step.label}
            </button>
          );
        })}
      </div>

      {/* Inline form */}
      {expanded && !completed.has(expanded) && (
        <div className="rounded-lg border border-border bg-background p-4">
          {expanded === "subjects" && (
            <OnboardingStepSubjects onComplete={() => handleComplete("classes")} />
          )}
          {expanded === "classes" && (
            <OnboardingStepClasses onComplete={() => handleComplete("teachers")} />
          )}
          {expanded === "teachers" && (
            <OnboardingStepTeachers onComplete={() => handleComplete("students")} />
          )}
          {expanded === "students" && (
            <OnboardingStepStudents onComplete={() => handleComplete()} />
          )}
        </div>
      )}
    </div>
  );
}
