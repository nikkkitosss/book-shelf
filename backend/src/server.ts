import "dotenv/config";
import app from "./app";
import { prisma } from "./db/prisma";
import { ensureBucket } from "./storage/minioClient";
import { ensureBooksIndex } from "./search/elasticClient";
import { syncMetadataToIndex } from "./search/bookIndexService";

const PORT = process.env.PORT;
const MINIO_PORT = process.env.MINIO_PORT;

async function bootstrap() {
  await prisma.$connect();
  console.log("[DB] PostgreSQL connected");

  try {
    await ensureBucket();
    console.log("[MinIO] Ready");
  } catch (err) {
    console.error("[MinIO] Failed:", err);
  }

  try {
    await ensureBooksIndex();
    const books = await prisma.book.findMany();
    await syncMetadataToIndex(books);
    console.log("[ES] Ready");
  } catch (err) {
    console.error(
      "[ES] Elasticsearch init failed. Search will be unavailable:",
      err,
    );
  }

  app.listen(PORT, () => {
    console.log(`\nLibrary Management System → http://localhost:${PORT}`);
    console.log(`MinIO UI → http://localhost:${MINIO_PORT}`);
    console.log(`Search → GET /search/books?q=...`);
    console.log(`Upload book → POST /books (multipart/form-data)\n`);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal bootstrap error:", err);
  process.exit(1);
});
