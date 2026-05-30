import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma";
import { ensureBooksIndex } from "../search/solrClient";
import { syncMetadataToIndex } from "../search/bookIndexService";

const PASSWORD = "Password123!";

const GENRES = [
  "Fantasy",
  "Science Fiction",
  "Programming",
  "History",
  "Psychology",
  "Business",
  "Classics",
  "Education",
] as const;

type SeedUser = {
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

const SEED_USERS: SeedUser[] = [
  { name: "Admin User", email: "admin@demo.local", role: "ADMIN" },
  { name: "Nikita Reader", email: "nikita@demo.local", role: "USER" },
  { name: "Olena Reader", email: "olena@demo.local", role: "USER" },
  { name: "Taras Reader", email: "taras@demo.local", role: "USER" },
  { name: "Iryna Reader", email: "iryna@demo.local", role: "USER" },
  { name: "Marta Reader", email: "marta@demo.local", role: "USER" },
];

function isbn13(i: number): string {
  return `9780000${String(100000 + i).slice(-6)}`;
}

function yearByIndex(i: number): number {
  return 1998 + (i % 27);
}

function genreByIndex(i: number): string {
  return GENRES[i % GENRES.length];
}

function availableByIndex(i: number): boolean {
  return i % 4 !== 0;
}

async function seedUsers(passwordHash: string) {
  const users = await Promise.all(
    SEED_USERS.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name, role: u.role, passwordHash },
        create: {
          name: u.name,
          email: u.email,
          role: u.role,
          passwordHash,
        },
      }),
    ),
  );

  return users;
}

async function seedBooks() {
  const totalBooks = 48;
  const operations = Array.from({ length: totalBooks }, (_, i) => {
    const n = i + 1;
    const isbn = isbn13(n);
    const genre = genreByIndex(i);
    const year = yearByIndex(i);
    const available = availableByIndex(i);

    return prisma.book.upsert({
      where: { isbn },
      update: {
        title: `Demo Book ${n}`,
        author: `Author ${((i % 12) + 1).toString().padStart(2, "0")}`,
        year,
        genre,
        description: `Seeded ${genre.toLowerCase()} book ${n} for search and UI testing.`,
        available,
      },
      create: {
        title: `Demo Book ${n}`,
        author: `Author ${((i % 12) + 1).toString().padStart(2, "0")}`,
        isbn,
        year,
        genre,
        description: `Seeded ${genre.toLowerCase()} book ${n} for search and UI testing.`,
        available,
        fileUrl: null,
        fileSize: null,
      },
    });
  });

  return Promise.all(operations);
}

async function seedLoans(userIds: string[], bookIds: string[]) {
  await prisma.loan.deleteMany({
    where: { userId: { in: userIds } },
  });

  const active = [] as Array<{ userId: string; bookId: string }>;
  const returned = [] as Array<{
    userId: string;
    bookId: string;
    offset: number;
  }>;

  for (let i = 0; i < Math.min(18, bookIds.length); i += 1) {
    const userId = userIds[i % userIds.length];
    const bookId = bookIds[i];

    if (i % 3 === 0) {
      returned.push({ userId, bookId, offset: i + 2 });
    } else {
      active.push({ userId, bookId });
    }
  }

  if (active.length) {
    await prisma.loan.createMany({
      data: active.map((x) => ({
        userId: x.userId,
        bookId: x.bookId,
        status: "ACTIVE",
      })),
    });
  }

  for (const loan of returned) {
    const loanDate = new Date();
    loanDate.setDate(loanDate.getDate() - loan.offset - 7);
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() - loan.offset);

    await prisma.loan.create({
      data: {
        userId: loan.userId,
        bookId: loan.bookId,
        status: "RETURNED",
        loanDate,
        returnDate,
      },
    });
  }

  const activeIds = new Set(active.map((x) => x.bookId));
  await prisma.book.updateMany({
    where: { id: { in: Array.from(activeIds) } },
    data: { available: false },
  });
}

async function run() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await prisma.$connect();

  const users = await seedUsers(passwordHash);
  const books = await seedBooks();

  const userIds = users.filter((u) => u.role === "USER").map((u) => u.id);
  await seedLoans(
    userIds,
    books.map((b) => b.id),
  );

  await ensureBooksIndex();
  await syncMetadataToIndex(await prisma.book.findMany());

  console.log("\nSeed completed successfully.");
  console.log(`Users upserted: ${users.length}`);
  console.log(`Books upserted: ${books.length}`);
  console.log(`Demo password for all seeded users: ${PASSWORD}`);
  console.log("Admin login: admin@demo.local");
  console.log("User login: nikita@demo.local\n");
}

run()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
