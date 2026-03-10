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
- **Docker Compose** — service orchestration (PostgreSQL, Elasticsearch, MinIO)
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
- Full-text search by title, author, genre, and **PDF content**
- Borrow and return books
- View personal loan history filtered by status
- Download book files (PDF / EPUB) via a secure presigned URL

### Admins
- Add new books with file upload
- Edit book metadata
- Delete books (file is automatically removed from MinIO)
- Rebuild the Elasticsearch search index (`Reindex PDFs`)
- View index statistics
- Manage users

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
| `DELETE` | `/books/:id` | Admin | Delete a book |

### Search
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/search/books?q=...` | Full-text search |

Supported query params: `q`, `genre`, `available`, `from`, `size`

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

## Getting Started

### Prerequisites
- Node.js 18+
- Docker and Docker Compose

### 1. Start infrastructure

```bash
cd backend
docker-compose up -d
```

This starts:
- **PostgreSQL** on port `5432`
- **Elasticsearch** on port `9200`
- **MinIO** on port `9000` (UI: `9001`)

### 2. Backend setup

```bash
cd backend
npm install

# Copy and fill in environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start the dev server
npm run dev
```

The server will be available at `http://localhost:3000`.

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` with a proxy to the backend.

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the values. See `.env.example` for all required variables and their descriptions.

> **Never commit `.env` to version control.** Only `.env.example` should be pushed.

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
  id, userId, bookId, status (ACTIVE | RETURNED)
  loanDate, returnDate
```

---

## Implementation Notes

- **Full-text search** — when a PDF is uploaded, its text is extracted via `pdf-parse` and indexed in Elasticsearch. Search works across both metadata and document content.
- **Transactional integrity** — borrowing and returning books use Prisma transactions to keep the `available` flag consistent.
- **Secure file access** — files are stored in a private MinIO bucket; downloads use presigned URLs with a 1-hour TTL.
- **Role-based access** — `authenticate` and `requireAdmin` middleware protect the relevant routes.
- **Admin provisioning** — a user receives the `ADMIN` role at registration if the correct `ADMIN_SECRET` is provided.