import { Client } from "@elastic/elasticsearch";

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
});

export const BOOKS_INDEX = "books";

export async function ensureBooksIndex(): Promise<void> {
  const exists = await esClient.indices.exists({ index: BOOKS_INDEX });
  if (exists) return;

  await esClient.indices.create({
    index: BOOKS_INDEX,
    mappings: {
      properties: {
        id: { type: "keyword" },
        title: {
          type: "text",
          analyzer: "english",
          fields: { keyword: { type: "keyword" } },
        },
        author: {
          type: "text",
          analyzer: "standard",
          fields: { keyword: { type: "keyword" } },
        },
        isbn: { type: "keyword" },
        genre: { type: "keyword" },
        year: { type: "integer" },
        available: { type: "boolean" },
        description: { type: "text", analyzer: "english" },
        content: { type: "text", analyzer: "english", store: false },
      },
    },
  });

  console.log(`[ES] Index "${BOOKS_INDEX}" created`);
}
