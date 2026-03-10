import { api } from "@/shared/api/instance";
import type {
  Book,
  SearchHit,
  Loan,
  PaginatedBooks,
  PaginatedLoans,
} from "../../types";

export type CatalogSortBy = "createdAt" | "year" | "title";
export type SearchSortBy = "relevance" | "year";
export type SortOrder = "asc" | "desc";

export const bookApi = {
  getAll: (
    page = 1,
    limit = 12,
    available?: boolean,
    sortBy: CatalogSortBy = "createdAt",
    sortOrder: SortOrder = "desc",
  ) =>
    api
      .get<PaginatedBooks>("/books", {
        params: {
          page,
          limit,
          sortBy,
          sortOrder,
          ...(available !== undefined ? { available } : {}),
        },
      })
      .then((r) => r.data),

  getById: (id: string) => api.get<Book>(`/books/${id}`).then((r) => r.data),

  create: (form: FormData) =>
    api
      .post<Book>("/books", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),

  update: (id: string, data: Partial<Book>) =>
    api.put<Book>(`/books/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/books/${id}`),

  getDownloadUrl: (id: string) =>
    api
      .get<{ url: string; expiresIn: number }>(`/books/${id}/download`)
      .then((r) => r.data),

  search: (
    q: string,
    params?: {
      genre?: string;
      available?: boolean;
      mode?: "content" | "meta";
      sortBy?: SearchSortBy;
      sortOrder?: SortOrder;
    },
  ) =>
    api
      .get<{ total: number; results: SearchHit[] }>("/search/books", {
        params: {
          q,
          mode: params?.mode ?? "content",
          sortBy: params?.sortBy ?? "relevance",
          sortOrder: params?.sortOrder ?? "desc",
          ...(params?.genre !== undefined ? { genre: params.genre } : {}),
          ...(params?.available !== undefined
            ? { available: params.available }
            : {}),
        },
      })
      .then((r) => r.data),

  loan: (bookId: string) =>
    api.post<Loan>("/loans", { bookId }).then((r) => r.data),

  returnBook: (loanId: string) =>
    api.patch<Loan>(`/loans/${loanId}/return`).then((r) => r.data),

  getMyLoans: (params?: {
    status?: "ACTIVE" | "RETURNED";
    page?: number;
    limit?: number;
  }) => api.get<PaginatedLoans>("/loans/my", { params }).then((r) => r.data),
};
