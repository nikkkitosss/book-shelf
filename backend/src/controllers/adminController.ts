import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { downloadFile } from "../storage/minioClient";
import { indexBook } from "../search/bookIndexService";
import { esClient, BOOKS_INDEX } from "../search/elasticClient";

const pdfParse = require("pdf-parse");

export const adminController = {
  async reindexPdf(_req: Request, res: Response): Promise<void> {
    const books = await prisma.book.findMany();
    const pdfBooks = books.filter((b) => b.fileUrl);

    if (pdfBooks.length === 0) {
      res.json({
        message: "No books with files found",
        indexed: 0,
        failed: 0,
        total: 0,
      });
      return;
    }

    let indexed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const book of pdfBooks) {
      try {
        console.log(`[Reindex] Processing: ${book.title}`);
        const buffer = await downloadFile(book.fileUrl!);

        let content = "";
        if (book.fileUrl!.toLowerCase().endsWith(".pdf")) {
          const parsed = await pdfParse(buffer);
          content = parsed.text as string;
        }

        await indexBook(book, content);
        indexed++;
        console.log(`[Reindex] ✓ ${book.title} — ${content.length} chars`);
      } catch (err: any) {
        failed++;
        errors.push(`${book.title}: ${err.message}`);
        console.error(`[Reindex] ✗ ${book.title}:`, err.message);
      }
    }

    res.json({
      message: "Reindex complete",
      total: pdfBooks.length,
      indexed,
      failed,
      ...(errors.length > 0 ? { errors } : {}),
    });
  },

  async indexStats(_req: Request, res: Response): Promise<void> {
    try {
      const [totalRes, withContentRes, dbCount, pdfCount] = await Promise.all([
        esClient.count({ index: BOOKS_INDEX }),
        esClient.count({
          index: BOOKS_INDEX,
          query: {
            bool: {
              must: [{ exists: { field: "content" } }],
              must_not: [{ term: { content: "" } }],
            },
          },
        }),
        prisma.book.count(),
        prisma.book.count({ where: { fileUrl: { not: null } } }),
      ]);

      res.json({
        db_total: dbCount,
        db_with_pdf: pdfCount,
        es_total: totalRes.count,
        es_with_content: withContentRes.count,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
};
