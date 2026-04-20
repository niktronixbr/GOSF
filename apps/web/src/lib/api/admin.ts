import { api } from "./client";

export type UserRole = "STUDENT" | "TEACHER" | "COORDINATOR" | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export const adminApi = {
  listUsers: () => api.get<AdminUser[]>("/users"),
  createUser: (data: { email: string; fullName: string; password: string; role: UserRole }) =>
    api.post<AdminUser>("/users", data),
  updateUser: (id: string, data: { fullName?: string; role?: UserRole; status?: UserStatus }) =>
    api.patch<AdminUser>(`/users/${id}`, data),
  toggleStatus: (id: string) => api.patch<AdminUser>(`/users/${id}/toggle-status`, {}),
};
