export type UserRole = "STUDENT" | "TEACHER" | "COORDINATOR" | "ADMIN";
export type PlanStatus = "PENDING" | "GENERATING" | "READY" | "FAILED" | "ARCHIVED";

export interface JwtUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  institutionId: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
