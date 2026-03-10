import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma";
import { signToken } from "./jwt";
import type { User } from "../types";

function formatUser(u: {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}): User {
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: "USER" | "ADMIN";
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new Error(`Email "${data.email}" is already taken`);

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role ?? "USER",
      },
    });

    return {
      user: formatUser(user),
      token: signToken({ userId: user.id, role: user.role }),
    };
  },

  async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new Error("Invalid email or password");

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new Error("Invalid email or password");

    return {
      user: formatUser(user),
      token: signToken({ userId: user.id, role: user.role }),
    };
  },
};
