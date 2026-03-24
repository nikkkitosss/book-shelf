import { prisma } from "../db/prisma";
import { uploadFile, deleteFile } from "../storage/minioClient";
import {
  indexBook,
  updateBookMetadata,
  removeBookFromIndex,
} from "../search/bookIndexService";
import type { PaginatedResult } from "../types";
import type { CreateBookInput, UpdateBookInput } from "../schemas";

const pdfParse = require("pdf-parse");

export type CatalogSortBy = "createdAt" | "year" | "title";
export type SortOrder = "asc" | "desc";

async function extractPdfContent(buffer: Buffer): Promise<string> {
  try {
    const parsed = await pdfParse(buffer);
    const text = parsed.text as string;
    console.log(`[PDF] Extracted ${text.length} characters`);
    return text;
  } catch (err) {
    console.warn("[PDF] Could not extract text:", err);
    return "";
  }
}

export const bookService = {
  async getAll({
    page = 1,
    limit = 12,
    available,
    sortBy = "createdAt",
    sortOrder = "desc",
  }: {
    page?: number;
    limit?: number;
    available?: boolean;
    sortBy?: CatalogSortBy;
    sortOrder?: SortOrder;
  } = {}): Promise<PaginatedResult<any>> {
    const skip = (page - 1) * limit;
    const where = available !== undefined ? { available } : {};

    const [data, total] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.book.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getById(id: string) {
    return prisma.book.findUnique({ where: { id } });
  },

  async create(
    data: CreateBookInput,
    file?: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
  ) {
    const existing = await prisma.book.findUnique({
      where: { isbn: data.isbn },
    });
    if (existing)
      throw new Error(`Book with ISBN "${data.isbn}" already exists`);

    let fileUrl: string | undefined;
    let pdfContent = "";

    if (file) {
      if (file.mimetype === "application/pdf") {
        pdfContent = await extractPdfContent(file.buffer);
      }
      const key = `books/${data.isbn}/${Date.now()}-${file.originalname}`;
      fileUrl = await uploadFile({
        key,
        body: file.buffer,
        contentType: file.mimetype,
        size: file.size,
      });
    }

    const book = await prisma.book.create({
      data: { ...data, fileUrl: fileUrl ?? null, fileSize: file?.size ?? null },
    });

    indexBook(book, pdfContent).catch((err) =>
      console.error(`[ES] Failed to index book ${book.id}:`, err),
    );

    return book;
  },

  async update(id: string, data: UpdateBookInput) {
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) return null;

    if (data.isbn && data.isbn !== book.isbn) {
      const conflict = await prisma.book.findUnique({
        where: { isbn: data.isbn },
      });
      if (conflict)
        throw new Error(`Book with ISBN "${data.isbn}" already exists`);
    }

    const updated = await prisma.book.update({ where: { id }, data });

    updateBookMetadata(updated).catch((err) =>
      console.error(`[ES] Failed to update index for book ${id}:`, err),
    );

    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) return false;
  
    const activeLoans = await prisma.loan.count({
      where: { bookId: id, status: "ACTIVE" },
    });
    if (activeLoans > 0) {
      throw new Error("Cannot delete book with active loans");
    }
  
    if (book.fileUrl) {
      deleteFile(book.fileUrl).catch((err) =>
        console.error(`[MinIO] Failed to delete file:`, err),
      );
    }
  
    await prisma.book.delete({ where: { id } });
  
    removeBookFromIndex(id).catch((err) =>
      console.error(`[ES] Failed to remove from index:`, err),
    );
  
    return true;
  },
};
