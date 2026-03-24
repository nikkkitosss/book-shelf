# 📚 Library Management System

A full-featured library management system with full-text search, file storage, and JWT-based authentication.

---

## Tech Stack

### Backend
- **Node.js + Express** — REST API server
- **TypeScript** — static typing
- **Prisma ORM** + **PostgreSQL** — database
- **Elasticsearch** — full-text search across book metadata and PDF content
- **MinIO** — S3-compatible object storage for PDF/EPUB files
- **JWT** — authentication and authorization
- **Zod** — request validation
- **pdf-parse** — PDF text extraction for search indexing

### Frontend
- **React 18 + TypeScript**
- **Vite** — build tool
- **Material UI (MUI)** — UI components
- **Zustand** — client state management (authStore)
- **Axios** — HTTP client
- **React Router v6** — routing

### Infrastructure
- **Docker Compose** — service orchestration
- **k6** — load testing

---

## Project Structure

```
LibrarySystem/
├── backend/
│   ├── prisma/           # DB schema and migrations
│   └── src/
│       ├── auth/         # JWT service and utilities
│       ├── controllers/  # HTTP request handlers
│       ├── middleware/   # Authentication, authorization
│       ├── routes/       # API routes
│       ├── schemas/      # Zod validation schemas
│       ├── search/       # Elasticsearch client and indexing
│       ├── services/     # Business logic
│       └── storage/      # MinIO client
├── frontend/
│   └── src/
│       ├── app/          # Router, theme
│       ├── entities/     # Types, book API, authStore
│       ├── features/     # Search, upload, edit components
│       ├── pages/        # Home, auth, book detail, loans
│       ├── shared/       # Axios instance
│       └── widgets/      # Header
└── k6/                   # Load testing scripts
```

---

## Features

### Users
- Register and log in
- Browse the book catalog with pagination, sorting, and filtering
- Full-text search by title, author, ISBN, genre, and **PDF content**
- Borrow and return books
- View personal loan history filtered by status
- Download book files (PDF / EPUB) via a secure presigned URL

### Admins
- Add new books with file upload
- Edit book metadata
- Delete books (only if no active loans; file is automatically removed from MinIO)
- Rebuild the Elasticsearch search index (`Reindex PDFs`)
- View index statistics
- Manage users

---

## Getting Started

### Prerequisites
- Docker and Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/nikkkitosss/book-shelf.git
cd book-shelf
```

### 2. Start everything

```bash
docker compose up --build -d
```

This builds and starts all services:
- **Frontend** on [http://localhost](http://localhost)
- **Backend API** on [http://localhost:3000](http://localhost:3000)
- **PostgreSQL** on port `5433`
- **Elasticsearch** on port `9200`
- **MinIO API** on port `9000` / **MinIO UI** on [http://localhost:9001](http://localhost:9001)

Database migrations run automatically on backend startup.

### 3. Check logs

```bash
docker compose logs -f backend
```

### 4. Stop everything

```bash
docker compose down
```

To also remove all data volumes:

```bash
docker compose down -v
```

---

## Environment Variables

The `docker-compose.yaml` contains all required environment variables with working defaults for local development. No `.env` file is needed to run the project locally.

For custom configuration, environment variables can be overridden directly in `docker-compose.yaml`:

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `super-secret-jwt-key-change-in-production` | JWT signing secret |
| `ADMIN_SECRET` | `supersecret123` | Secret key to register as admin |
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO access key |
| `MINIO_SECRET_KEY` | `minioadmin` | MinIO secret key |
| `MINIO_BUCKET` | `library-books` | MinIO bucket name |

> **Note:** Change `JWT_SECRET` and `ADMIN_SECRET` before deploying to production.

---

## Admin Access

To register as an admin, provide the `ADMIN_SECRET` value during registration. With default settings, use `supersecret123` as the admin secret key.

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Log in |
| `GET` | `/auth/me` | Get the current user |

### Books
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/books` | Public | List books with pagination and filters |
| `GET` | `/books/:id` | Public | Get book details |
| `GET` | `/books/:id/download` | Authenticated | Get a presigned download URL |
| `POST` | `/books` | Admin | Create a book (`multipart/form-data`) |
| `PUT` | `/books/:id` | Admin | Update book metadata |
| `DELETE` | `/books/:id` | Admin | Delete a book (blocked if active loans exist) |

### Search
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/search/books?q=...` | Full-text search |

Supported query params: `q`, `mode` (`meta` or `content`), `genre`, `available`, `sortBy`, `sortOrder`, `page`, `limit`

### Loans
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/loans/my` | Authenticated | My loans |
| `POST` | `/loans` | Authenticated | Borrow a book |
| `PATCH` | `/loans/:id/return` | Authenticated | Return a book |
| `GET` | `/loans` | Admin | All loans |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/admin/reindex` | Rebuild the search index |
| `GET` | `/admin/index-stats` | Elasticsearch index statistics |

---

## Load Testing (k6)

Three k6 scenarios are available in the `k6/` directory:

```bash
# Scenario 1: Metadata search
k6 run k6/scenario1_meta_search.js

# Scenario 2: Filtered search
k6 run k6/scenario2_filtered_search.js

# Scenario 3: Parallel load
k6 run k6/scenario3_parallel_load.js
```

---

## Database Schema

```
User
  id, name, email, passwordHash, role (USER | ADMIN), createdAt

Book
  id, title, author, year, isbn (unique), genre, description
  available, fileUrl, fileSize, createdAt, updatedAt

Loan
  id, userId, bookId (nullable), status (ACTIVE | RETURNED)
  loanDate, returnDate
```

---

## Implementation Notes

- **Full-text search** — when a PDF is uploaded, its text is extracted via `pdf-parse` and indexed in Elasticsearch. Search works across both metadata (title, author, ISBN) and document content.
- **Transactional integrity** — borrowing and returning books use Prisma transactions to keep the `available` flag consistent.
- **Secure file access** — files are stored in a private MinIO bucket; downloads use presigned URLs with a 1-hour TTL.
- **Role-based access** — `authenticate` and `requireAdmin` middleware protect the relevant routes.
- **Admin provisioning** — a user receives the `ADMIN` role at registration if the correct `ADMIN_SECRET` is provided.
- **Safe book deletion** — books with active loans cannot be deleted. Books with returned loans can be deleted; historical loan records are preserved with `bookId` set to `null`.
