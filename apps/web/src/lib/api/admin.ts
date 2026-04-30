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

export interface PaginatedUsers {
  data: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole | "ALL";
}

export interface AdminMetrics {
  users: {
    total: number;
    active: number;
    byRole: { STUDENT: number; TEACHER: number; COORDINATOR: number; ADMIN: number };
  };
  cycles: {
    total: number;
    byStatus: { DRAFT: number; OPEN: number; CLOSED: number; ARCHIVED: number };
  };
  evaluations: { totalSubmissions: number };
  aiPlans: { studentPlans: number; teacherPlans: number };
}

export const adminApi = {
  listUsers: (params: ListUsersParams = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.search) qs.set("search", params.search);
    if (params.role && params.role !== "ALL") qs.set("role", params.role);
    const query = qs.toString();
    return api.get<PaginatedUsers>(`/users${query ? `?${query}` : ""}`);
  },
  createUser: (data: { email: string; fullName: string; password: string; role: UserRole }) =>
    api.post<AdminUser>("/users", data),
  updateUser: (id: string, data: { fullName?: string; role?: UserRole; status?: UserStatus }) =>
    api.patch<AdminUser>(`/users/${id}`, data),
  toggleStatus: (id: string) => api.patch<AdminUser>(`/users/${id}/toggle-status`, {}),
  fetchMetrics: () => api.get<AdminMetrics>("/admin/metrics"),
};
