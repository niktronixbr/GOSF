import { api } from "./client";

export const usersApi = {
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<void>("/users/me/password", { currentPassword, newPassword }),
};
