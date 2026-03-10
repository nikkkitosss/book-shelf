import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

const initialUser = loadUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  token: localStorage.getItem("token"),
  isAdmin: initialUser?.role === "ADMIN",

  setAuth: (user, token) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    set({ user, token, isAdmin: user.role === "ADMIN" });
  },

  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    set({ user: null, token: null, isAdmin: false });
  },
}));
