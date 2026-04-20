import { api } from "./client";

export type GoalStatus = "PENDING" | "IN_PROGRESS" | "DONE";

export interface StudentGoal {
  id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const goalsApi = {
  list: () => api.get<StudentGoal[]>("/goals"),
  create: (data: { title: string; description?: string; dueDate?: string }) =>
    api.post<StudentGoal>("/goals", data),
  update: (id: string, data: { title?: string; description?: string; status?: GoalStatus; dueDate?: string }) =>
    api.patch<StudentGoal>(`/goals/${id}`, data),
  remove: (id: string) => api.delete<{ deleted: boolean }>(`/goals/${id}`),
};
