import { Request, Response } from "express";
import { bookService } from "../services/bookService";
import { getDownloadUrl } from "../storage/minioClient";
import { createBookSchema, updateBookSchema, zodMessage } from "../schemas";
import type { CatalogSortBy, SortOrder } from "../services/bookService";

const VALID_SORT_BY: CatalogSortBy[] = ["createdAt", "year", "title"];
const VALID_SORT_ORDER: SortOrder[] = ["asc", "desc"];

function parseSortBy(val: unknown): CatalogSortBy {
  return VALID_SORT_BY.includes(val as CatalogSortBy)
    ? (val as CatalogSortBy)
    : "createdAt";
}

function parseSortOrder(val: unknown): SortOrder {
  return VALID_SORT_ORDER.includes(val as SortOrder)
    ? (val as SortOrder)
    : "desc";
}

export const bookController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(
        1,
        parseInt((req.query["page"] as string) ?? "1", 10),
      );
      const limit = Math.min(
        50,
        Math.max(1, parseInt((req.query["limit"] as string) ?? "12", 10)),
      );
      const available =
        req.query["available"] !== undefined
          ? req.query["available"] === "true"
          : undefined;
      const sortBy = parseSortBy(req.query["sortBy"]);
      const sortOrder = parseSortOrder(req.query["sortOrder"]);

      res.json(
        await bookService.getAll({ page, limit, available, sortBy, sortOrder }),
      );
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const book = await bookService.getById(req.params["id"] as string);
      if (!book) {
        res.status(404).json({ error: "Book not found" });
        return;
      }
      res.json(book);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    const result = createBookSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: zodMessage(result.error.issues) });
      return;
    }

    try {
      const file = req.file
        ? {
            buffer: req.file.buffer,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : undefined;
      res.status(201).json(await bookService.create(result.data, file));
    } catch (err: any) {
      res.status(409).json({ error: err.message });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    const result = updateBookSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: zodMessage(result.error.issues) });
      return;
    }

    try {
      const book = await bookService.update(
        req.params["id"] as string,
        result.data,
      );
      if (!book) {
        res.status(404).json({ error: "Book not found" });
        return;
      }
      res.json(book);
    } catch (err: any) {
      res.status(409).json({ error: err.message });
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await bookService.delete(req.params["id"] as string);
      if (!deleted) {
        res.status(404).json({ error: "Book not found" });
        return;
      }
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async download(req: Request, res: Response): Promise<void> {
    try {
      const book = await bookService.getById(req.params["id"] as string);
      if (!book) {
        res.status(404).json({ error: "Book not found" });
        return;
      }
      if (!book.fileUrl) {
        res.status(404).json({ error: "No file attached to this book" });
        return;
      }
      res.json({ url: await getDownloadUrl(book.fileUrl), expiresIn: 3600 });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
};
