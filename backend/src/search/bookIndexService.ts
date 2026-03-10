import { esClient, BOOKS_INDEX } from "./elasticClient";
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

export async function indexBook(book: Book, pdfContent = ""): Promise<void> {
  await esClient.index({
    index: BOOKS_INDEX,
    id: book.id,
    document: { ...bookMetadataFields(book), content: pdfContent },
  });
}

export async function updateBookMetadata(book: Book): Promise<void> {
  const params = bookMetadataFields(book);
  const source = Object.keys(params)
    .map((k) => `ctx._source.${k} = params.${k};`)
    .join(" ");

  try {
    await esClient.update({
      index: BOOKS_INDEX,
      id: book.id,
      script: { source, params },
      upsert: { ...params, content: "" },
    });
  } catch (err) {
    console.error(`[ES] Failed to update metadata for book ${book.id}:`, err);
  }
}

export async function removeBookFromIndex(bookId: string): Promise<void> {
  try {
    await esClient.delete({ index: BOOKS_INDEX, id: bookId });
  } catch {}
}

export async function syncMetadataToIndex(books: Book[]): Promise<void> {
  if (!books.length) return;
  await Promise.all(books.map(updateBookMetadata));
  console.log(`[ES] Synced metadata for ${books.length} books`);
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
    highlight?: Record<string, string[]>;
  }>;
}

function words(q: string): string[] {
  return q.trim().split(/\s+/).filter(Boolean);
}

function extractPhrases(q: string, len = 5, count = 3): string[] {
  const w = words(q);
  if (w.length <= len) return [q];
  const step = Math.floor((w.length - len) / (count - 1)) || 1;
  return [
    ...new Set(
      Array.from({ length: count }, (_, i) => {
        const start = Math.min(i * step, w.length - len);
        return w.slice(start, start + len).join(" ");
      }),
    ),
  ];
}

function metaQuery(query: string, wc: number): Record<string, unknown> {
  return {
    multi_match: {
      query,
      fields: ["title^4", "author^3", "description^2", "isbn"],
      fuzziness: wc === 1 ? "AUTO" : "0",
      operator: "or",
    },
  };
}

function contentQuery(query: string, wc: number): Record<string, unknown> {
  if (wc >= 6) {
    const phrases = extractPhrases(query);
    return {
      bool: {
        must: [
          {
            bool: {
              should: phrases.map((phrase) => ({
                match_phrase: { content: { query: phrase, slop: 2 } },
              })),
              minimum_should_match: 1,
            },
          },
        ],
        should: [
          ...phrases.map((phrase) => ({
            match_phrase: { content: { query: phrase, slop: 1, boost: 15 } },
          })),
          {
            more_like_this: {
              fields: ["content"],
              like: query,
              min_term_freq: 2,
              min_doc_freq: 2,
              max_query_terms: 12,
              minimum_should_match: "80%",
              boost: 5,
            },
          },
        ],
      },
    };
  }

  if (wc >= 2) {
    return {
      bool: {
        must: [
          {
            bool: {
              should: [
                { match_phrase: { content: { query, slop: 1 } } },
                { match: { content: { query, operator: "and" } } },
              ],
              minimum_should_match: 1,
            },
          },
        ],
        should: [
          { match_phrase: { content: { query, slop: 0, boost: 10 } } },
          { match_phrase: { content: { query, slop: 1, boost: 6 } } },
        ],
      },
    };
  }

  return { match: { content: { query, fuzziness: "AUTO" } } };
}

function minScore(mode: "meta" | "content", wc: number): number {
  if (mode === "meta") return 0.3;
  if (wc >= 6) return 8.0;
  if (wc >= 2) return 3.0;
  return 0.5;
}

type HighlightFields = Record<
  string,
  { fragment_size: number; number_of_fragments: number }
>;

function highlightFields(mode: "meta" | "content"): HighlightFields {
  return mode === "meta"
    ? { description: { fragment_size: 150, number_of_fragments: 1 } }
    : { content: { fragment_size: 200, number_of_fragments: 2 } };
}

function buildSort(sortBy: SearchSortBy, sortOrder: SortOrder) {
  if (sortBy === "relevance") return undefined;
  return [{ [sortBy]: { order: sortOrder } }];
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

  const wc = words(query).length;
  const mustQuery =
    mode === "meta" ? metaQuery(query, wc) : contentQuery(query, wc);
  const sort = buildSort(sortBy, sortOrder);

  const response = await esClient.search({
    index: BOOKS_INDEX,
    from,
    size,
    min_score: minScore(mode, wc),
    query: {
      bool: {
        must: [mustQuery],
        filter: [
          ...(genre !== undefined ? [{ term: { genre } }] : []),
          ...(available !== undefined ? [{ term: { available } }] : []),
        ],
      },
    },
    ...(sort ? { sort } : {}),
    highlight: {
      fields: highlightFields(mode),
      require_field_match: false,
    },
    _source: { excludes: ["content"] },
  });

  const total =
    typeof response.hits.total === "number"
      ? response.hits.total
      : (response.hits.total?.value ?? 0);

  return {
    total,
    hits: response.hits.hits.map((hit) => ({
      id: hit._id ?? "",
      score: hit._score ?? 0,
      book: hit._source as Record<string, unknown>,
      highlight: hit.highlight as Record<string, string[]> | undefined,
    })),
  };
}
