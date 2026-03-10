export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  isbn: string;
  available: boolean;
  genre: string | null;
  description: string | null;
  fileUrl: string | null;
  fileSize: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

export type LoanStatus = "ACTIVE" | "RETURNED";

export interface Loan {
  id: string;
  userId: string;
  bookId: string;
  loanDate: Date;
  returnDate: Date | null;
  status: LoanStatus;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
