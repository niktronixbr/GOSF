import { api } from "./client";

export interface ScoreAggregate {
  dimension: string;
  score: number;
}

export interface StudentPlanOutput {
  summary: string;
  strengths: string[];
  attention_points: string[];
  seven_day_plan: string[];
  thirty_day_plan: string[];
  motivation_message: string;
  confidence_notes: string[];
}

export interface TeacherPlanOutput {
  summary: string;
  strengths: string[];
  development_points: string[];
  recommended_actions: string[];
  classroom_experiments: string[];
  next_cycle_focus: string[];
}

export interface StudentPlan {
  id: string;
  status: string;
  version: number;
  generatedAt: string | null;
  aiOutputJson: StudentPlanOutput | null;
}

export interface TeacherPlan {
  id: string;
  status: string;
  version: number;
  generatedAt: string | null;
  aiOutputJson: TeacherPlanOutput | null;
}

export interface StudentDashboard {
  student: { id: string; gradeLevel: string | null };
  cycle: { id: string; title: string; status: string } | null;
  scores: ScoreAggregate[];
  plan: StudentPlan | null;
}

export interface TeacherDashboard {
  teacher: { id: string; department: string | null; specialty: string | null };
  cycle: { id: string; title: string; status: string } | null;
  scores: ScoreAggregate[];
  plan: TeacherPlan | null;
}

export const analyticsApi = {
  studentDashboard: () => api.get<StudentDashboard>("/analytics/dashboard/student"),
  teacherDashboard: () => api.get<TeacherDashboard>("/analytics/dashboard/teacher"),
  getStudentPlan: (cycleId: string) =>
    api.get<StudentPlan | null>(`/ai/plans/student?cycleId=${cycleId}`),
  getTeacherPlan: (cycleId: string) =>
    api.get<TeacherPlan | null>(`/ai/plans/teacher?cycleId=${cycleId}`),
  generateStudentPlan: (cycleId: string) =>
    api.post<StudentPlan>(`/ai/plans/student/generate?cycleId=${cycleId}`, {}),
  generateTeacherPlan: (cycleId: string) =>
    api.post<TeacherPlan>(`/ai/plans/teacher/generate?cycleId=${cycleId}`, {}),
};
