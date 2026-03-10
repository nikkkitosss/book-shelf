import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Chip,
  Stack,
  Button,
  Divider,
  Alert,
  Snackbar,
  Paper,
  Skeleton,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBackRounded";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAddOutlined";
import DownloadIcon from "@mui/icons-material/FileDownloadOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNewRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditIcon from "@mui/icons-material/EditOutlined";
import { bookApi } from "@/entities/book/api/bookApi";
import type { Book } from "@/entities/types";
import { useAuthStore } from "@/entities/user/model/authStore";
import { EditBookModal } from "@/features/edit-book/EditBookModal";

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuthStore();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    bookApi
      .getById(id)
      .then(setBook)
      .catch(() => setError("Book not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLoan = async () => {
    if (!book || !user) return;
    try {
      await bookApi.loan(book.id);
      const updated = await bookApi.getById(book.id);
      setBook(updated);
      setSuccess("Book borrowed! Return it via My Loans.");
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Could not borrow");
    }
  };

  const handleDownload = async () => {
    if (!book) return;
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const { url } = await bookApi.getDownloadUrl(book.id);
      window.open(url, "_blank");
    } catch {
      setError("Could not get download link");
    }
  };

  const handleViewPdf = async () => {
    if (!book) return;
    if (!user) {
      navigate("/login");
      return;
    }
    setPdfLoading(true);
    try {
      const { url } = await bookApi.getDownloadUrl(book.id);
      setPdfUrl(url);
    } catch (e: any) {
      if (e.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError("Could not load PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!book || !confirm("Delete this book permanently?")) return;
    try {
      await bookApi.delete(book.id);
      navigate("/");
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Delete failed");
    }
  };

  if (loading)
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={300} />
      </Container>
    );

  if (error && !book)
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Back
        </Button>
      </Container>
    );

  if (!book) return null;

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
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{
                color: "text.secondary",
                "&:hover": { color: "text.primary" },
              }}
            >
              Back
            </Button>
            {isAdmin && (
              <Button
                startIcon={<EditIcon />}
                variant="outlined"
                size="small"
                onClick={() => setEditOpen(true)}
                sx={{ fontSize: "0.82rem" }}
              >
                Edit book
              </Button>
            )}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Stack direction={{ xs: "column", md: "row" }} spacing={5}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Chip
              label={book.available ? "Available" : "On Loan"}
              size="small"
              sx={{
                mb: 2,
                bgcolor: book.available
                  ? "rgba(5,150,105,0.1)"
                  : "rgba(220,38,38,0.1)",
                color: book.available ? "#059669" : "#DC2626",
                border:
                  "1px solid " +
                  (book.available
                    ? "rgba(5,150,105,0.3)"
                    : "rgba(220,38,38,0.3)"),
                fontWeight: 600,
              }}
            />

            <Typography
              variant="h2"
              sx={{
                fontFamily: '"DM Serif Display", serif',
                fontWeight: 400,
                fontSize: { xs: "2rem", md: "2.8rem" },
                color: "text.primary",
                lineHeight: 1.15,
                mb: 1.5,
              }}
            >
              {book.title}
            </Typography>

            <Typography
              sx={{ color: "text.secondary", fontSize: "1.1rem", mb: 1 }}
            >
              by{" "}
              <Box
                component="span"
                sx={{ color: "text.primary", fontWeight: 500 }}
              >
                {book.author}
              </Box>
            </Typography>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mb: 3 }}>
              <Chip
                label={String(book.year)}
                size="small"
                sx={{ bgcolor: "rgba(0,0,0,0.06)", color: "text.secondary" }}
              />
              {book.genre && (
                <Chip
                  label={book.genre}
                  size="small"
                  sx={{
                    bgcolor: "rgba(37,99,235,0.08)",
                    color: "primary.main",
                    border: "1px solid rgba(37,99,235,0.2)",
                  }}
                />
              )}
              {book.fileUrl && (
                <Chip
                  label="PDF available"
                  size="small"
                  sx={{
                    bgcolor: "rgba(124,58,237,0.08)",
                    color: "#7C3AED",
                    border: "1px solid rgba(124,58,237,0.2)",
                  }}
                />
              )}
            </Stack>

            {book.description && (
              <Typography
                sx={{
                  color: "text.secondary",
                  lineHeight: 1.8,
                  fontSize: "1rem",
                  mb: 3,
                }}
              >
                {book.description}
              </Typography>
            )}

            <Divider sx={{ mb: 3 }} />

            <Stack spacing={1.5} sx={{ mb: 4 }}>
              <MetaRow label="ISBN" value={book.isbn} />
              <MetaRow label="Year" value={String(book.year)} />
              {book.fileSize && (
                <MetaRow
                  label="File size"
                  value={`${(book.fileSize / 1024 / 1024).toFixed(1)} MB`}
                />
              )}
              <MetaRow
                label="Added"
                value={new Date(book.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
            </Stack>

            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              {user && book.available && (
                <Button
                  variant="contained"
                  startIcon={<BookmarkAddIcon />}
                  onClick={handleLoan}
                >
                  Borrow this book
                </Button>
              )}
              {book.fileUrl && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                  >
                    Download PDF
                  </Button>
                  {!pdfUrl && (
                    <Button
                      variant="outlined"
                      startIcon={<OpenInNewIcon />}
                      onClick={handleViewPdf}
                      disabled={pdfLoading}
                      sx={{
                        borderColor: "rgba(124,58,237,0.4)",
                        color: "#7C3AED",
                        "&:hover": {
                          borderColor: "#7C3AED",
                          bgcolor: "rgba(124,58,237,0.06)",
                        },
                      }}
                    >
                      {pdfLoading ? "Loading..." : "View PDF"}
                    </Button>
                  )}
                </>
              )}
              {isAdmin && (
                <Tooltip title="Delete book permanently">
                  <Button
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDelete}
                    sx={{
                      ml: "auto",
                      "&:hover": { bgcolor: "rgba(220,38,38,0.06)" },
                    }}
                  >
                    Delete
                  </Button>
                </Tooltip>
              )}
            </Stack>
          </Box>

          {pdfUrl && (
            <Box sx={{ flex: 1, minWidth: 0, minHeight: { xs: 400, md: 600 } }}>
              <Paper
                elevation={0}
                sx={{
                  height: { xs: 450, md: 650 },
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  overflow: "hidden",
                  bgcolor: "#F8FAFC",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", fontSize: "0.82rem" }}
                  >
                    PDF Preview
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      startIcon={<OpenInNewIcon />}
                      onClick={() => window.open(pdfUrl, "_blank")}
                      sx={{ color: "primary.main", fontSize: "0.78rem" }}
                    >
                      Open full screen
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setPdfUrl(null)}
                      sx={{ color: "text.secondary", fontSize: "0.78rem" }}
                    >
                      Close
                    </Button>
                  </Stack>
                </Box>
                <iframe
                  src={pdfUrl}
                  style={{
                    width: "100%",
                    height: "calc(100% - 48px)",
                    border: "none",
                  }}
                  title={book.title}
                />
              </Paper>
            </Box>
          )}
        </Stack>
      </Container>

      <EditBookModal
        open={editOpen}
        book={book}
        onClose={() => setEditOpen(false)}
        onSuccess={(updated) => {
          setBook(updated);
          setSuccess("Book updated successfully");
        }}
      />

      <Snackbar
        open={!!success}
        autoHideDuration={5000}
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

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={2} alignItems="baseline">
      <Typography
        sx={{ color: "text.secondary", fontSize: "0.82rem", minWidth: 80 }}
      >
        {label}
      </Typography>
      <Typography sx={{ color: "text.primary", fontSize: "0.9rem" }}>
        {value}
      </Typography>
    </Stack>
  );
}
