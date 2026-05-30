import { solrSelect, solrUpdate } from "./solrClient";
import type { Book } from "../types";

function bookMetadataFields(book: Book) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    genre: book.genre ?? null,
    year: book.year,
    available: book.available,
    description: book.description ?? "",
  };
}

function toAtomicMetadataUpdate(book: Book): Record<string, unknown> {
  const params = bookMetadataFields(book);
  return {
    id: book.id,
    title: { set: params.title },
    author: { set: params.author },
    isbn: { set: params.isbn },
    genre: { set: params.genre },
    year: { set: params.year },
    available: { set: params.available },
    description: { set: params.description },
  };
}

export async function indexBook(book: Book, pdfContent = ""): Promise<void> {
  await solrUpdate(
    {
      add: {
        doc: { ...bookMetadataFields(book), content: pdfContent },
      },
    },
    { commitWithin: 2000, wt: "json" },
  );
}

export async function updateBookMetadata(book: Book): Promise<void> {
  try {
    await solrUpdate([toAtomicMetadataUpdate(book)], {
      commitWithin: 2000,
      wt: "json",
    });
  } catch (err) {
    console.error(`[Solr] Failed to update metadata for book ${book.id}:`, err);
  }
}

export async function removeBookFromIndex(bookId: string): Promise<void> {
  try {
    await solrUpdate(
      { delete: { id: bookId } },
      { commitWithin: 2000, wt: "json" },
    );
  } catch {}
}

export async function syncMetadataToIndex(books: Book[]): Promise<void> {
  if (!books.length) return;
  const countRes = await solrSelect<{ response: { numFound: number } }>({
    q: "*:*",
    rows: 0,
    wt: "json",
  });

  if (countRes.response.numFound === 0) {
    await solrUpdate(
      books.map((book) => ({
        ...bookMetadataFields(book),
        content: "",
      })),
      { commitWithin: 5000, wt: "json" },
    );
  } else {
    await solrUpdate(books.map(toAtomicMetadataUpdate), {
      commitWithin: 5000,
      wt: "json",
    });
  }
  console.log(`[Solr] Synced metadata for ${books.length} books`);
}

export type SearchSortBy = "relevance" | "year";
export type SortOrder = "asc" | "desc";

export interface SearchBooksOptions {
  query: string;
  mode?: "meta" | "content";
  genre?: string;
  available?: boolean;
  sortBy?: SearchSortBy;
  sortOrder?: SortOrder;
  from?: number;
  size?: number;
}

export interface SearchBooksResult {
  total: number;
  hits: Array<{
    id: string;
    score: number;
    book: Record<string, unknown>;
  }>;
  suggestions?: string[];
}

function escapeSolrQuery(q: string): string {
  return q.replace(/([+\-!(){}[\]^"~*?:\\/])/g, "\\$1");
}

function buildSort(sortBy: SearchSortBy, sortOrder: SortOrder): string | null {
  if (sortBy === "relevance") return null;
  return `${sortBy} ${sortOrder}`;
}

function buildQueryFields(mode: "meta" | "content"): string {
  return mode === "meta" ? "title^4 author^3 description^2 isbn" : "content";
}

function extractSuggestions(spellcheck: any, query: string): string[] {
  if (!spellcheck) return [];
  const cleanedQuery = query.trim().toLowerCase();
  const suggestions = new Set<string>();

  if (Array.isArray(spellcheck.collations)) {
    for (const item of spellcheck.collations) {
      if (typeof item === "string" && item !== "collation") {
        suggestions.add(item);
      } else if (item && typeof item === "object" && item.collationQuery) {
        suggestions.add(String(item.collationQuery));
      }
    }
  } else if (typeof spellcheck.collation === "string") {
    suggestions.add(spellcheck.collation);
  }

  if (Array.isArray(spellcheck.suggestions)) {
    for (let i = 0; i < spellcheck.suggestions.length; i += 2) {
      const entry = spellcheck.suggestions[i + 1];
      const list = entry?.suggestion;
      if (!Array.isArray(list)) continue;
      list.forEach((s: any) => {
        if (typeof s === "string") suggestions.add(s);
        else if (s?.word) suggestions.add(String(s.word));
      });
    }
  }

  return Array.from(suggestions)
    .filter((s) => s.trim().toLowerCase() !== cleanedQuery)
    .slice(0, 3);
}

export async function searchBooks(
  opts: SearchBooksOptions,
): Promise<SearchBooksResult> {
  const {
    query,
    mode = "content",
    genre,
    available,
    sortBy = "relevance",
    sortOrder = "desc",
    from = 0,
    size = 20,
  } = opts;
  const sort = buildSort(sortBy, sortOrder);
  const fq: string[] = [];

  if (genre !== undefined) {
    fq.push(`genre:"${escapeSolrQuery(genre)}"`);
  }

  if (available !== undefined) {
    fq.push(`available:${available ? "true" : "false"}`);
  }

  const params: Record<string, string | number | boolean | string[]> = {
    q: escapeSolrQuery(query),
    defType: "edismax",
    qf: buildQueryFields(mode),
    mm: "1",
    start: from,
    rows: size,
    fl: "id,title,author,isbn,genre,year,available,description,score",
    wt: "json",
    spellcheck: true,
    "spellcheck.q": query,
    "spellcheck.dictionary": mode === "meta" ? "meta" : "content",
    "spellcheck.count": 3,
    "spellcheck.collate": true,
    "spellcheck.maxCollations": 1,
    "spellcheck.extendedResults": true,
  };

  if (fq.length > 0) params.fq = fq;
  if (sort) params.sort = sort;

  const response = await solrSelect<{
    response: { numFound: number; docs: Array<Record<string, unknown>> };
    spellcheck?: Record<string, unknown>;
  }>(params);

  const hits = response.response.docs.map((doc) => {
    const id = String(doc["id"] ?? "");
    const score =
      typeof doc["score"] === "number" ? (doc["score"] as number) : 0;
    const { score: _score, ...book } = doc;

    return {
      id,
      score,
      book: book as Record<string, unknown>,
    };
  });

  return {
    total: response.response.numFound ?? 0,
    hits,
    suggestions: extractSuggestions(response.spellcheck, query),
  };
}
