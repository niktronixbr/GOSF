"use client";

import { create } from "zustand";
import { SessionUser, getSessionUser, logout as doLogout, ROLE_HOME } from "@/lib/auth/session";
import { setTokens } from "@/lib/auth/tokens";

interface AuthState {
  user: SessionUser | null;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) => string;
  logout: () => Promise<void>;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  hydrate: () => {
    const user = getSessionUser();
    set({ user, isLoading: false });
  },

  login: (accessToken, refreshToken) => {
    setTokens(accessToken, refreshToken);
    const user = getSessionUser();
    set({ user });
    return ROLE_HOME[user!.role];
  },

  logout: async () => {
    await doLogout();
    set({ user: null });
  },
}));
