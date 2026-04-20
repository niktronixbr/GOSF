import { api } from "./client";
import { EvaluationCycle } from "./evaluations";

export interface InstitutionSettings {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  academicPeriod: string;
  institutionId: string;
  createdAt: string;
  _count: { enrollments: number; classAssignments: number };
}

export interface SubjectInfo {
  id: string;
  name: string;
  code: string | null;
}

export interface EnrolledStudent {
  id: string;
  studentId: string;
  student: {
    id: string;
    user: { id: string; fullName: string; email: string };
  };
}

export interface ClassAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  teacher: { id: string; user: { id: string; fullName: string; email: string } };
  subject: SubjectInfo;
}

export interface ClassDetail {
  id: string;
  name: string;
  academicPeriod: string;
  enrollments: EnrolledStudent[];
  classAssignments: ClassAssignment[];
}

export interface StudentOption {
  id: string;
  userId: string;
  user: { id: string; fullName: string; email: string };
}

export interface TeacherOption {
  id: string;
  userId: string;
  user: { id: string; fullName: string; email: string };
}

export interface TeacherClassAssignment {
  id: string;
  classGroup: {
    id: string;
    name: string;
    academicPeriod: string;
    _count: { enrollments: number };
  };
  subject: SubjectInfo;
}

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

export interface ClassBenchmark {
  classId: string;
  className: string;
  academicPeriod: string;
  studentCount: number;
  avgScore: number | null;
  dimensions: { dimension: string; avg: number }[];
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
  getBenchmarking: (cycleId?: string) =>
    api.get<ClassBenchmark[]>(`/analytics/benchmarking${cycleId ? `?cycleId=${cycleId}` : ""}`),

  // Institution settings
  getInstitution: () => api.get<InstitutionSettings>("/institutions/me"),
  updateInstitution: (data: { name?: string; status?: string }) =>
    api.patch<InstitutionSettings>("/institutions/me", data),

  // Classes
  getClasses: () => api.get<ClassGroup[]>("/classes"),
  createClass: (data: { name: string; academicPeriod: string }) =>
    api.post<ClassGroup>("/classes", data),
  getClassDetail: (id: string) => api.get<ClassDetail>(`/classes/${id}`),
  enrollStudent: (classId: string, studentId: string) =>
    api.post(`/classes/${classId}/enrollments`, { studentId }),
  unenrollStudent: (classId: string, studentId: string) =>
    api.delete(`/classes/${classId}/enrollments/${studentId}`),
  assignTeacher: (classId: string, data: { teacherId: string; subjectId: string }) =>
    api.post(`/classes/${classId}/assignments`, data),
  removeAssignment: (classId: string, assignmentId: string) =>
    api.delete(`/classes/${classId}/assignments/${assignmentId}`),
  getStudentOptions: () => api.get<StudentOption[]>("/classes/students"),
  getTeacherOptions: () => api.get<TeacherOption[]>("/classes/teachers"),
  getMyClasses: () => api.get<TeacherClassAssignment[]>("/classes/mine"),

  // Subjects
  getSubjects: () => api.get<SubjectInfo[]>("/subjects"),
  createSubject: (data: { name: string; code?: string }) =>
    api.post<SubjectInfo>("/subjects", data),
  deleteSubject: (id: string) => api.delete<{ deleted: boolean }>(`/subjects/${id}`),
};
