import { api } from "@/lib/api/client";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isTokenExpired,
  parseJwt,
} from "./tokens";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: "STUDENT" | "TEACHER" | "COORDINATOR" | "ADMIN";
  institutionId: string;
}

export async function getValidAccessToken(): Promise<string | null> {
  let access = getAccessToken();
  if (!access) return null;

  if (isTokenExpired(access)) {
    const refresh = getRefreshToken();
    if (!refresh) return null;
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string }>(
        "/auth/refresh",
        { refreshToken: refresh }
      );
      setTokens(res.accessToken, res.refreshToken);
      access = res.accessToken;
    } catch {
      clearTokens();
      return null;
    }
  }

  return access;
}

export function getSessionUser(): SessionUser | null {
  const token = getAccessToken();
  if (!token) return null;
  const payload = parseJwt(token);
  if (!payload) return null;
  return {
    id: payload.sub as string,
    email: payload.email as string,
    fullName: (payload.fullName as string) ?? "",
    role: payload.role as SessionUser["role"],
    institutionId: payload.institutionId as string,
  };
}

export async function logout() {
  const refresh = getRefreshToken();
  if (refresh) {
    await api.post("/auth/logout", { refreshToken: refresh }).catch(() => {});
  }
  clearTokens();
}

export const ROLE_HOME: Record<SessionUser["role"], string> = {
  STUDENT: "/student",
  TEACHER: "/teacher",
  COORDINATOR: "/coordinator",
  ADMIN: "/coordinator",
};
