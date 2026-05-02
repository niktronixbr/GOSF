import { create } from "zustand";

interface SidebarStore {
  mobileOpen: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  mobileOpen: false,
  toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
  closeMobile: () => set({ mobileOpen: false }),
}));
