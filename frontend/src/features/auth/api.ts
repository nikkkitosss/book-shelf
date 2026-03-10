import { api } from "@/shared/api/instance";
import type { AuthResponse } from "../../entities/types";

export const authApi = {
  login: (email: string, password: string) =>
    api
      .post<AuthResponse>("/auth/login", { email, password })
      .then((r) => r.data),

  register: (
    name: string,
    email: string,
    password: string,
    adminSecret?: string,
  ) =>
    api
      .post<AuthResponse>("/auth/register", {
        name,
        email,
        password,
        ...(adminSecret ? { adminSecret } : {}),
      })
      .then((r) => r.data),
};
