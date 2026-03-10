import { z } from "zod";

export function zodMessage(issues: z.ZodIssue[]): string {
  return issues
    .map((i) => `${i.path.join(".") || "field"}: ${i.message}`)
    .join("; ");
}

const yearField = z.coerce
  .number()
  .int()
  .min(1000, "Year must be after 1000")
  .max(new Date().getFullYear(), "Year can't be in the future");

const isbnField = z.string().min(10, "ISBN must be at least 10 characters");

const emailField = z.string().email("Invalid email address");

export const createBookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  year: yearField,
  isbn: isbnField,
  genre: z.string().optional(),
  description: z.string().optional(),
});

export const updateBookSchema = z.object({
  title: z.string().min(1, "Title can't be empty").optional(),
  author: z.string().min(1, "Author can't be empty").optional(),
  year: yearField.optional(),
  isbn: isbnField.optional(),
  genre: z.string().optional(),
  description: z.string().optional(),
  available: z.coerce.boolean().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: emailField,
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["USER", "ADMIN"]).optional(),
  adminSecret: z.string().optional(),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: emailField,
});

export const createLoanSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  bookId: z.string().min(1, "bookId is required"),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
