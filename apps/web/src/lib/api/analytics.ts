import { api } from "./client";

export interface ScoreAggregate {
  dimension: string;
  score: number;
}

export interface StudentDashboard {
  student: { id: string; gradeLevel: string | null };
  cycle: { id: string; title: string; status: string } | null;
  scores: ScoreAggregate[];
  plan: {
    id: string;
    status: string;
    aiOutputJson: {
      summary: string;
      strengths: string[];
      attention_points: string[];
      seven_day_plan: string[];
      motivation_message: string;
    } | null;
  } | null;
}

export interface TeacherDashboard {
  teacher: { id: string; department: string | null; specialty: string | null };
  cycle: { id: string; title: string; status: string } | null;
  scores: ScoreAggregate[];
  plan: {
    id: string;
    status: string;
    aiOutputJson: {
      summary: string;
      strengths: string[];
      development_points: string[];
      recommended_actions: string[];
      classroom_experiments: string[];
    } | null;
  } | null;
}

export const analyticsApi = {
  studentDashboard: () => api.get<StudentDashboard>("/analytics/dashboard/student"),
  teacherDashboard: () => api.get<TeacherDashboard>("/analytics/dashboard/teacher"),
  generateStudentPlan: (cycleId: string) =>
    api.post("/ai/plans/student/generate", {}, false),
  generateTeacherPlan: (cycleId: string) =>
    api.post("/ai/plans/teacher/generate", {}, false),
};
