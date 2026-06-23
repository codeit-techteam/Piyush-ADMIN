import { create } from "zustand";
import type { AdminUser } from "@/types";

interface AuthState {
  user: AdminUser | null;
  accessToken: string | null;
  setAuth: (user: AdminUser, accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setAuth: (user, accessToken) => {
    localStorage.setItem("admin_access_token", accessToken);
    set({ user, accessToken });
  },
  clearAuth: () => {
    localStorage.removeItem("admin_access_token");
    set({ user: null, accessToken: null });
  },
}));
