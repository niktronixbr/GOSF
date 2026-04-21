import { api } from "./client";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
}

export const usersApi = {
  getMe: () => api.get<UserProfile>("/users/me"),
  updateProfile: (data: { fullName?: string; avatarUrl?: string }) =>
    api.patch<UserProfile>("/users/me", data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<void>("/users/me/password", { currentPassword, newPassword }),
};
