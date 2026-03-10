import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Alert,
  Chip,
  Button,
  Skeleton,
  Paper,
  Pagination,
} from "@mui/material";
import BookmarkIcon from "@mui/icons-material/BookmarksRounded";
import ArrowBackIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import { useNavigate } from "react-router-dom";
import { bookApi } from "@/entities/book/api/bookApi";
import type { Loan, PaginatedLoans } from "@/entities/types";

const LIMIT = 8;

export function MyLoansPage() {
  const navigate = useNavigate();

  const [active, setActive] = useState<PaginatedLoans | null>(null);
  const [returned, setReturned] = useState<PaginatedLoans | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [returnedPage, setReturnedPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadActive = useCallback(async (page: number) => {
    const data = await bookApi.getMyLoans({
      status: "ACTIVE",
      page,
      limit: LIMIT,
    });
    setActive(data);
    setActivePage(page);
  }, []);

  const loadReturned = useCallback(async (page: number) => {
    const data = await bookApi.getMyLoans({
      status: "RETURNED",
      page,
      limit: LIMIT,
    });
    setReturned(data);
    setReturnedPage(page);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadActive(1), loadReturned(1)]);
    } catch {
      setError("Failed to load loans");
    } finally {
      setLoading(false);
    }
  }, [loadActive, loadReturned]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleReturn = async (loan: Loan) => {
    try {
      await bookApi.returnBook(loan.id);
      setSuccess(`"${loan.book?.title ?? "Book"}" returned successfully`);
      await Promise.all([loadActive(activePage), loadReturned(returnedPage)]);
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Return failed");
    }
  };

  const totalLoans = (active?.total ?? 0) + (returned?.total ?? 0);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 8 }}>
      <Box
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          py: 2,
          bgcolor: "background.paper",
        }}
      >
        <Container maxWidth="lg">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}
            sx={{
              color: "text.secondary",
              "&:hover": { color: "text.primary" },
            }}
          >
            Back to catalog
          </Button>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 5 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
          <BookmarkIcon sx={{ color: "primary.main", fontSize: 28 }} />
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"DM Serif Display", serif',
              fontWeight: 400,
              color: "text.primary",
            }}
          >
            My Loans
          </Typography>
        </Stack>
        <Typography sx={{ color: "text.secondary", mb: 4 }}>
          {active?.total ?? 0} active · {returned?.total ?? 0} returned
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        {loading ? (
          <Stack spacing={2}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={100}
                sx={{ bgcolor: "rgba(0,0,0,0.06)" }}
              />
            ))}
          </Stack>
        ) : totalLoans === 0 ? (
          <Box sx={{ py: 10, textAlign: "center" }}>
            <Typography
              sx={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: "1.4rem",
                color: "text.secondary",
                mb: 1,
              }}
            >
              No loans yet
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              Browse the catalog and borrow your first book
            </Typography>
            <Button variant="contained" onClick={() => navigate("/")}>
              Go to catalog
            </Button>
          </Box>
        ) : (
          <Stack spacing={4}>
            {(active?.total ?? 0) > 0 && (
              <Box>
                <Typography
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    mb: 2,
                  }}
                >
                  Currently borrowed ({active?.total})
                </Typography>
                <Stack spacing={2}>
                  {active?.data.map((loan) => (
                    <LoanCard
                      key={loan.id}
                      loan={loan}
                      onReturn={handleReturn}
                      onNavigate={() => navigate("/books/" + loan.bookId)}
                    />
                  ))}
                </Stack>
                {(active?.totalPages ?? 1) > 1 && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 3 }}
                  >
                    <Pagination
                      count={active?.totalPages ?? 1}
                      page={activePage}
                      onChange={(_, p) => loadActive(p)}
                      color="primary"
                      shape="rounded"
                      size="medium"
                    />
                  </Box>
                )}
              </Box>
            )}

            {(returned?.total ?? 0) > 0 && (
              <Box>
                <Typography
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    mb: 2,
                  }}
                >
                  Returned ({returned?.total})
                </Typography>
                <Stack spacing={2}>
                  {returned?.data.map((loan) => (
                    <LoanCard
                      key={loan.id}
                      loan={loan}
                      onReturn={handleReturn}
                      onNavigate={() => navigate("/books/" + loan.bookId)}
                    />
                  ))}
                </Stack>
                {(returned?.totalPages ?? 1) > 1 && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 3 }}
                  >
                    <Pagination
                      count={returned?.totalPages ?? 1}
                      page={returnedPage}
                      onChange={(_, p) => loadReturned(p)}
                      color="primary"
                      shape="rounded"
                      size="medium"
                    />
                  </Box>
                )}
              </Box>
            )}
          </Stack>
        )}
      </Container>
    </Box>
  );
}

function LoanCard({
  loan,
  onReturn,
  onNavigate,
}: {
  loan: Loan;
  onReturn: (loan: Loan) => void;
  onNavigate: () => void;
}) {
  const isActive = loan.status === "ACTIVE";
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        transition: "border-color 0.2s, box-shadow 0.2s",
        "&:hover": {
          borderColor: isActive
            ? "rgba(37,99,235,0.35)"
            : "rgba(5,150,105,0.3)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={2}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mb: 0.5 }}
          >
            <Chip
              label={isActive ? "Active" : "Returned"}
              size="small"
              sx={{
                fontSize: "0.67rem",
                fontWeight: 600,
                height: 20,
                bgcolor: isActive
                  ? "rgba(37,99,235,0.08)"
                  : "rgba(5,150,105,0.08)",
                color: isActive ? "primary.main" : "#059669",
                border:
                  "1px solid " +
                  (isActive ? "rgba(37,99,235,0.25)" : "rgba(5,150,105,0.25)"),
              }}
            />
            {!isActive && (
              <CheckCircleIcon sx={{ color: "#059669", fontSize: 16 }} />
            )}
          </Stack>

          <Typography
            sx={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: "1.1rem",
              color: "text.primary",
              cursor: "pointer",
              "&:hover": { color: "primary.main" },
              transition: "color 0.2s",
            }}
            onClick={onNavigate}
          >
            {loan.book?.title ?? `Book #${loan.bookId.slice(0, 8)}`}
          </Typography>

          {loan.book?.author && (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 0.25 }}
            >
              {loan.book.author}
            </Typography>
          )}

          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Borrowed:{" "}
              {new Date(loan.loanDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Typography>
            {loan.returnDate && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Returned:{" "}
                {new Date(loan.returnDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Typography>
            )}
          </Stack>
        </Box>

        {isActive && (
          <Button
            size="small"
            onClick={() => onReturn(loan)}
            sx={{
              color: "#059669",
              border: "1px solid rgba(5,150,105,0.3)",
              flexShrink: 0,
              "&:hover": {
                bgcolor: "rgba(5,150,105,0.06)",
                borderColor: "#059669",
              },
            }}
          >
            Return book
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
