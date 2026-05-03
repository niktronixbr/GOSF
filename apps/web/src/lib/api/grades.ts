import { api } from "./client";

export interface GradeItem {
  id: string;
  title: string;
  weight: number;
  value: number;
}

export interface StudentGradeEntry {
  studentId: string;
  userId: string;
  fullName: string;
  weightedAverage: number | null;
  atRisk: boolean;
  grades: GradeItem[];
}

export interface ClassSubjectGroup {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  cycleId: string | null;
  cycleTitle: string | null;
  classAvg: number | null;
  students: StudentGradeEntry[];
}

export interface SubjectGrades {
  subjectId: string;
  subjectName: string;
  weightedAverage: number | null;
  grades: GradeItem[];
}

export interface MyGradesResponse {
  cycleId: string | null;
  cycleTitle: string | null;
  subjects: SubjectGrades[];
}

export interface SubjectOverview {
  subjectId: string;
  subjectName: string;
  avg: number;
  studentCount: number;
  atRiskCount: number;
}

export interface GradesOverview {
  cycleId: string | null;
  cycleTitle: string | null;
  atRiskSubjects: SubjectOverview[];
  bySubject: SubjectOverview[];
}

export interface GradeHistorySubject {
  subjectId: string;
  subjectName: string;
  weightedAverage: number | null;
  grades: GradeItem[];
}

export interface GradeHistoryCycle {
  cycleId: string;
  cycleTitle: string;
  subjects: GradeHistorySubject[];
}

export interface CreateGradePayload {
  studentId: string;
  subjectId: string;
  cycleId: string;
  title: string;
  weight: number;
  value: number;
}

export const gradesApi = {
  getStudentsForTeacher: () => api.get<ClassSubjectGroup[]>("/grades/students"),
  getMyGrades: () => api.get<MyGradesResponse>("/grades/my"),
  getMyGradesHistory: () => api.get<GradeHistoryCycle[]>("/grades/my/history"),
  getOverview: () => api.get<GradesOverview>("/grades/overview"),
  upsertGrade: (payload: CreateGradePayload) => api.post<GradeItem>("/grades", payload),
  deleteGrade: (id: string) => api.delete<{ deleted: boolean }>(`/grades/${id}`),
};
