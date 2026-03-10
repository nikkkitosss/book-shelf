import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Grid2 as Grid,
  Button,
  Skeleton,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Stack,
  Snackbar,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/AddRounded";
import { bookApi } from "@/entities/book/api/bookApi";
import type {
  CatalogSortBy,
  SearchSortBy,
  SortOrder,
} from "@/entities/book/api/bookApi";
import type { PaginatedBooks } from "@/entities/types";
import { BookCard } from "@/entities/book/ui/BookCard";
import { SearchBar } from "@/features/search/SearchBar";
import type { SearchMode } from "@/features/search/SearchBar";
import { SearchResultCard } from "@/features/search/SearchResultCard";
import { UploadBookModal } from "@/features/upload-book/UploadBookModal";
import { useAuthStore } from "@/entities/user/model/authStore";
import type { Book, SearchHit } from "@/entities/types";

const LIMIT = 12;
type ViewMode = "catalog" | "search";

const CATALOG_SORT_OPTIONS: { value: CatalogSortBy; label: string }[] = [
  { value: "createdAt", label: "Date added" },
  { value: "year", label: "Year" },
  { value: "title", label: "Title" },
];

const SEARCH_SORT_OPTIONS: { value: SearchSortBy; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "year", label: "Year" },
];

export function HomePage() {
  const { isAdmin, user } = useAuthStore();

  const [paginated, setPaginated] = useState<PaginatedBooks | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "available">("all");

  const [catalogSortBy, setCatalogSortBy] =
    useState<CatalogSortBy>("createdAt");
  const [catalogSortOrder, setCatalogSortOrder] = useState<SortOrder>("desc");

  const [searchSortBy, setSearchSortBy] = useState<SearchSortBy>("relevance");
  const [searchSortOrder, setSearchSortOrder] = useState<SortOrder>("desc");

  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("catalog");
  const [lastQuery, setLastQuery] = useState<{
    q: string;
    mode: SearchMode;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const loadBooks = useCallback(
    async (
      p: number,
      f: "all" | "available",
      sb: CatalogSortBy,
      so: SortOrder,
    ) => {
      setLoading(true);
      setError("");
      try {
        const data = await bookApi.getAll(
          p,
          LIMIT,
          f === "available" ? true : undefined,
          sb,
          so,
        );
        setPaginated(data);
        setPage(p);
      } catch {
        setError("Failed to load books");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (viewMode === "catalog")
      loadBooks(1, filter, catalogSortBy, catalogSortOrder);
  }, [filter, viewMode, catalogSortBy, catalogSortOrder, loadBooks]);

  const runSearch = useCallback(
    async (q: string, mode: SearchMode, sb: SearchSortBy, so: SortOrder) => {
      setLoading(true);
      setError("");
      try {
        const data = await bookApi.search(q, {
          mode: mode === "content" ? "content" : "meta",
          available: filter === "available" ? true : undefined,
          sortBy: sb,
          sortOrder: so,
        });
        setHits(data.results);
        setSearchTotal(data.total);
      } catch {
        setError("Search failed");
      } finally {
        setLoading(false);
      }
    },
    [filter],
  );

  const handleSearch = (q: string, mode: SearchMode) => {
    setViewMode("search");
    setLastQuery({ q, mode });
    runSearch(q, mode, searchSortBy, searchSortOrder);
  };

  useEffect(() => {
    if (viewMode === "search" && lastQuery) {
      runSearch(lastQuery.q, lastQuery.mode, searchSortBy, searchSortOrder);
    }
  }, [filter, searchSortBy, searchSortOrder]);

  const handleBackToCatalog = () => {
    setViewMode("catalog");
    setHits([]);
    setLastQuery(null);
    loadBooks(1, filter, catalogSortBy, catalogSortOrder);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this book permanently?")) return;
    try {
      await bookApi.delete(id);
      loadBooks(page, filter, catalogSortBy, catalogSortOrder);
      setSuccess("Book deleted");
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Delete failed");
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const { url } = await bookApi.getDownloadUrl(id);
      window.open(url, "_blank");
    } catch {
      setError("Could not get download link");
    }
  };

  const handleLoan = async (id: string) => {
    if (!user) return;
    try {
      await bookApi.loan(id);
      if (viewMode === "catalog") {
        loadBooks(page, filter, catalogSortBy, catalogSortOrder);
      } else if (lastQuery) {
        runSearch(lastQuery.q, lastQuery.mode, searchSortBy, searchSortOrder);
      }
      setSuccess("Book borrowed! Check 'My Loans'");
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Could not borrow book");
    }
  };

  const catalogBooks = paginated?.data ?? [];
  const totalBooks = paginated?.total ?? 0;
  const totalPages = paginated?.totalPages ?? 1;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          py: { xs: 5, md: 8 },
          background:
            "linear-gradient(135deg, rgba(37,99,235,0.03) 0%, rgba(124,58,237,0.02) 100%)",
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
            <Chip
              label={`${totalBooks} books`}
              size="small"
              sx={{
                bgcolor: "rgba(37,99,235,0.08)",
                color: "primary.main",
                border: "1px solid rgba(37,99,235,0.2)",
                fontWeight: 500,
                fontSize: "0.78rem",
              }}
            />
          </Stack>

          <Typography
            variant="h2"
            sx={{
              fontFamily: '"DM Serif Display", serif',
              fontWeight: 400,
              fontSize: { xs: "2.2rem", md: "3.2rem" },
              color: "text.primary",
              mb: 1,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {user
              ? `Good day, ${user.name.split(" ")[0]}`
              : "Knowledge Library"}
          </Typography>
          <Typography
            sx={{
              color: "text.secondary",
              mb: 4,
              fontSize: { xs: "1rem", md: "1.1rem" },
            }}
          >
            {user
              ? "Your reading collection awaits"
              : "Search the catalog or dive into book contents"}
          </Typography>

          <SearchBar onSearch={handleSearch} />
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
          sx={{ mb: 3.5 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography
              sx={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: "1.3rem",
                color: "text.primary",
                fontWeight: 400,
              }}
            >
              {viewMode === "catalog" ? "Catalog" : "Search results"}
            </Typography>
            <Chip
              label={viewMode === "catalog" ? totalBooks : searchTotal}
              size="small"
              sx={{
                bgcolor: "rgba(0,0,0,0.06)",
                color: "text.secondary",
                fontWeight: 600,
                height: 22,
                fontSize: "0.75rem",
              }}
            />
            {viewMode === "search" && (
              <Button
                size="small"
                onClick={handleBackToCatalog}
                sx={{ color: "primary.main", fontSize: "0.82rem" }}
              >
                ← Back to catalog
              </Button>
            )}
          </Stack>

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            flexWrap="wrap"
          >
            {viewMode === "catalog" && (
              <>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel sx={{ fontSize: "0.8rem" }}>Sort by</InputLabel>
                  <Select
                    value={catalogSortBy}
                    label="Sort by"
                    onChange={(e) =>
                      setCatalogSortBy(e.target.value as CatalogSortBy)
                    }
                    sx={{ fontSize: "0.8rem" }}
                  >
                    {CATALOG_SORT_OPTIONS.map((o) => (
                      <MenuItem
                        key={o.value}
                        value={o.value}
                        sx={{ fontSize: "0.8rem" }}
                      >
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <ToggleButtonGroup
                  value={catalogSortOrder}
                  exclusive
                  size="small"
                  onChange={(_, v) => {
                    if (v) setCatalogSortOrder(v);
                  }}
                >
                  <ToggleButton
                    value="desc"
                    sx={{ px: 1.5, fontSize: "0.75rem" }}
                  >
                    ↓
                  </ToggleButton>
                  <ToggleButton
                    value="asc"
                    sx={{ px: 1.5, fontSize: "0.75rem" }}
                  >
                    ↑
                  </ToggleButton>
                </ToggleButtonGroup>
              </>
            )}

            {viewMode === "search" && (
              <>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel sx={{ fontSize: "0.8rem" }}>Sort by</InputLabel>
                  <Select
                    value={searchSortBy}
                    label="Sort by"
                    onChange={(e) =>
                      setSearchSortBy(e.target.value as SearchSortBy)
                    }
                    sx={{ fontSize: "0.8rem" }}
                  >
                    {SEARCH_SORT_OPTIONS.map((o) => (
                      <MenuItem
                        key={o.value}
                        value={o.value}
                        sx={{ fontSize: "0.8rem" }}
                      >
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {searchSortBy !== "relevance" && (
                  <ToggleButtonGroup
                    value={searchSortOrder}
                    exclusive
                    size="small"
                    onChange={(_, v) => {
                      if (v) setSearchSortOrder(v);
                    }}
                  >
                    <ToggleButton
                      value="desc"
                      sx={{ px: 1.5, fontSize: "0.75rem" }}
                    >
                      ↓
                    </ToggleButton>
                    <ToggleButton
                      value="asc"
                      sx={{ px: 1.5, fontSize: "0.75rem" }}
                    >
                      ↑
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}
              </>
            )}

            <ToggleButtonGroup
              value={filter}
              exclusive
              size="small"
              onChange={(_, v) => {
                if (v) setFilter(v);
              }}
            >
              <ToggleButton value="all" sx={{ px: 2, fontSize: "0.8rem" }}>
                All
              </ToggleButton>
              <ToggleButton
                value="available"
                sx={{ px: 2, fontSize: "0.8rem" }}
              >
                Available
              </ToggleButton>
            </ToggleButtonGroup>

            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                size="small"
                onClick={() => setModalOpen(true)}
                sx={{ px: 2.5 }}
              >
                Add Book
              </Button>
            )}
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {viewMode === "catalog" && (
          <>
            {loading ? (
              <Grid container spacing={2.5}>
                {Array.from({ length: LIMIT }).map((_, i) => (
                  <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <Skeleton
                      variant="rounded"
                      height={260}
                      sx={{ bgcolor: "rgba(0,0,0,0.06)", borderRadius: 2 }}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : catalogBooks.length === 0 ? (
              <Box sx={{ py: 10, textAlign: "center" }}>
                <Typography
                  sx={{
                    fontFamily: '"DM Serif Display", serif',
                    fontSize: "1.4rem",
                    color: "text.secondary",
                    mb: 1,
                  }}
                >
                  No books found
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  The catalog is empty
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2.5}>
                {catalogBooks.map((book) => (
                  <Grid key={book.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <BookCard
                      book={book}
                      isAdmin={isAdmin}
                      isLoggedIn={!!user}
                      onDelete={handleDelete}
                      onDownload={handleDownload}
                      onLoan={handleLoan}
                    />
                  </Grid>
                ))}
              </Grid>
            )}

            {totalPages > 1 && !loading && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, p) =>
                    loadBooks(p, filter, catalogSortBy, catalogSortOrder)
                  }
                  color="primary"
                  shape="rounded"
                  size="large"
                />
              </Box>
            )}
          </>
        )}

        {viewMode === "search" && (
          <>
            {loading ? (
              <Stack spacing={2}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rounded"
                    height={120}
                    sx={{ bgcolor: "rgba(0,0,0,0.06)", borderRadius: 2 }}
                  />
                ))}
              </Stack>
            ) : hits.length === 0 ? (
              <Box sx={{ py: 10, textAlign: "center" }}>
                <Typography
                  sx={{
                    fontFamily: '"DM Serif Display", serif',
                    fontSize: "1.4rem",
                    color: "text.secondary",
                    mb: 1,
                  }}
                >
                  No results found
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Try a different search query
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {hits.map((hit) => (
                  <SearchResultCard
                    key={hit.id}
                    hit={hit}
                    isAdmin={isAdmin}
                    isLoggedIn={!!user}
                    onDownload={handleDownload}
                    onLoan={handleLoan}
                  />
                ))}
              </Stack>
            )}
          </>
        )}
      </Container>

      <UploadBookModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => loadBooks(1, filter, catalogSortBy, catalogSortOrder)}
      />

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}
