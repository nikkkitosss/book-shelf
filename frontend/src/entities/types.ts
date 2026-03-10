export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  isbn: string;
  genre: string | null;
  description: string | null;
  available: boolean;
  fileUrl: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SearchHit {
  id: string;
  score: number;
  book: Partial<Book>;
  highlight: Record<string, string[]> | undefined;
}

export interface Loan {
  id: string;
  userId: string;
  bookId: string;
  loanDate: string;
  returnDate: string | null;
  status: "ACTIVE" | "RETURNED";
  book?: Book;
}

export interface PaginatedBooks {
  data: Book[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedLoans {
  data: Loan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  user: { id: string; name: string; email: string; role: "USER" | "ADMIN" };
  token: string;
}
