import { api } from "./client";

export interface EvaluationQuestion {
  id: string;
  dimension: string;
  questionText: string;
  responseType: string;
  weight: number;
  order: number;
  isRequired: boolean;
}

export interface EvaluationForm {
  id: string;
  targetType: "STUDENT" | "TEACHER";
  title: string;
  questions: EvaluationQuestion[];
}

export interface EvaluationCycle {
  id: string;
  title: string;
  status: string;
  startsAt: string;
  endsAt: string;
}

export interface TeacherTarget {
  teacherId: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  subjects: string[];
  evaluated: boolean;
}

export interface StudentTarget {
  studentId: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  classGroup: string;
  evaluated: boolean;
}

export interface SubmitPayload {
  cycleId: string;
  formId: string;
  targetId: string;
  answers: Record<string, number>;
  comment?: string;
}

export const evaluationsApi = {
  // Targets
  getTeachersForStudent: () =>
    api.get<{ cycle: EvaluationCycle | null; teachers: TeacherTarget[] }>(
      "/evaluations/targets/teachers"
    ),
  getStudentsForTeacher: () =>
    api.get<{ cycle: EvaluationCycle | null; students: StudentTarget[] }>(
      "/evaluations/targets/students"
    ),

  // Forms
  getForms: (targetType: "STUDENT" | "TEACHER") =>
    api.get<EvaluationForm[]>(`/evaluations/forms?targetType=${targetType}`),

  // Active cycle
  getActiveCycle: () =>
    api.get<EvaluationCycle | null>("/evaluations/cycles/active"),

  // Submit
  submitTeacherEvaluation: (payload: SubmitPayload) =>
    api.post("/evaluations/submit/teacher", payload),
  submitStudentEvaluation: (payload: SubmitPayload) =>
    api.post("/evaluations/submit/student", payload),
};
