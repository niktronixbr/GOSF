import { api } from "./client";
import { EvaluationCycle } from "./evaluations";

export interface TeacherWithScores {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  status: string;
  department: string | null;
  specialty: string | null;
  planStatus: string | null;
  avgScore: number | null;
  scores: { dimension: string; score: number }[];
}

export interface InstitutionOverview {
  teacherScores: { id: string; targetId: string; dimension: string; score: number }[];
  studentScores: { id: string; targetId: string; dimension: string; score: number }[];
  atRiskTeachers: { id: string; targetId: string; dimension: string; score: number }[];
  atRiskStudents: { id: string; targetId: string; dimension: string; score: number }[];
}

export interface ReportEntry {
  type: "STUDENT" | "TEACHER";
  id: string;
  fullName: string;
  avgScore: number | null;
  atRisk: boolean;
  scores: { dimension: string; score: number }[];
}

export const coordinatorApi = {
  // Cycles
  getCycles: () => api.get<EvaluationCycle[]>("/evaluations/cycles"),
  createCycle: (data: { title: string; startsAt: string; endsAt: string }) =>
    api.post<EvaluationCycle>("/evaluations/cycles", data),
  openCycle: (id: string) => api.patch<EvaluationCycle>(`/evaluations/cycles/${id}/open`, {}),
  closeCycle: (id: string) => api.patch<EvaluationCycle>(`/evaluations/cycles/${id}/close`, {}),

  // Analytics
  getOverview: (cycleId: string) =>
    api.get<InstitutionOverview>(`/analytics/overview?cycleId=${cycleId}`),
  getTeachers: (cycleId?: string) =>
    api.get<TeacherWithScores[]>(
      `/analytics/teachers${cycleId ? `?cycleId=${cycleId}` : ""}`
    ),
  getReports: (cycleId: string) =>
    api.get<ReportEntry[]>(`/analytics/reports?cycleId=${cycleId}`),
};
