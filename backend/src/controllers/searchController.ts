import { Request, Response } from "express";
import { searchBooks } from "../search/bookIndexService";
import type { SearchSortBy, SortOrder } from "../search/bookIndexService";

const VALID_SEARCH_SORT: SearchSortBy[] = ["relevance", "year"];
const VALID_ORDER: SortOrder[] = ["asc", "desc"];

export const searchController = {
  async searchBooks(req: Request, res: Response): Promise<void> {
    const q = req.query["q"] as string | undefined;
    if (!q || q.trim() === "") {
      res.status(400).json({ error: "Query param 'q' is required" });
      return;
    }

    const mode = (req.query["mode"] as string) === "meta" ? "meta" : "content";
    const genre = req.query["genre"] as string | undefined;
    const available = req.query["available"] as string | undefined;
    const page = parseInt((req.query["page"] as string) ?? "1", 10);
    const limit = parseInt((req.query["limit"] as string) ?? "20", 10);

    const sortByRaw = req.query["sortBy"] as string | undefined;
    const sortBy: SearchSortBy = VALID_SEARCH_SORT.includes(
      sortByRaw as SearchSortBy,
    )
      ? (sortByRaw as SearchSortBy)
      : "relevance";

    const sortOrderRaw = req.query["sortOrder"] as string | undefined;
    const sortOrder: SortOrder = VALID_ORDER.includes(sortOrderRaw as SortOrder)
      ? (sortOrderRaw as SortOrder)
      : "desc";

    try {
      const result = await searchBooks({
        query: q,
        mode,
        genre,
        available: available !== undefined ? available === "true" : undefined,
        sortBy,
        sortOrder,
        from: (page - 1) * limit,
        size: limit,
      });

      res.json({ total: result.total, page, limit, results: result.hits });
    } catch (err: any) {
      console.error("[Search] Error:", err);
      res.status(500).json({ error: "Search failed", detail: err.message });
    }
  },
};
