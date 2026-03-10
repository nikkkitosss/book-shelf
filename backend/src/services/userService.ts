import { prisma } from "../db/prisma";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export const userService = {
  async getAll() {
    return prisma.user.findMany({ select: USER_SELECT });
  },

  async getById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  },
};
