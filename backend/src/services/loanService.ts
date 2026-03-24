import { prisma } from "../db/prisma";
import type { PaginatedResult, LoanStatus } from "../types";

export const loanService = {
  async getAll() {
    return prisma.loan.findMany({ include: { book: true, user: true } });
  },

  async getByUserId(
    userId: string,
    params: { status?: LoanStatus; page?: number; limit?: number } = {},
  ): Promise<PaginatedResult<any>> {
    const { status, page = 1, limit = 8 } = params;
    const skip = (page - 1) * limit;
    const where = { userId, ...(status ? { status } : {}) };

    const [data, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        include: { book: true },
        orderBy: { loanDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.loan.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async create(data: { userId: string; bookId: string }) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new Error(`User with id "${data.userId}" not found`);

    const book = await prisma.book.findUnique({ where: { id: data.bookId } });
    if (!book) throw new Error(`Book with id "${data.bookId}" not found`);
    if (!book.available)
      throw new Error(`Book "${book.title}" is not available for loan`);

    const [loan] = await prisma.$transaction([
      prisma.loan.create({
        data: { userId: data.userId, bookId: data.bookId },
      }),
      prisma.book.update({
        where: { id: data.bookId },
        data: { available: false },
      }),
    ]);

    return loan;
  },

  async returnBook(loanId: string) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new Error("Loan not found");
    if (loan.status === "RETURNED")
      throw new Error("This loan has already been returned");
  
    if (!loan.bookId) {
      return prisma.loan.update({
        where: { id: loanId },
        data: { status: "RETURNED", returnDate: new Date() },
      });
    }
  
    const [updated] = await prisma.$transaction([
      prisma.loan.update({
        where: { id: loanId },
        data: { status: "RETURNED", returnDate: new Date() },
      }),
      prisma.book.update({
        where: { id: loan.bookId },
        data: { available: true },
      }),
    ]);
  
    return updated;
  },
};
