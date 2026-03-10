import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Alert,
  LinearProgress,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/CloseRounded";
import { api } from "@/shared/api/instance";
import type { Book } from "@/entities/types";

interface Props {
  open: boolean;
  book: Book | null;
  onClose: () => void;
  onSuccess: (updated: Book) => void;
}

export function EditBookModal({ open, book, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    title: "",
    author: "",
    year: "",
    isbn: "",
    genre: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (book) {
      setForm({
        title: book.title,
        author: book.author,
        year: String(book.year),
        isbn: book.isbn,
        genre: book.genre ?? "",
        description: book.description ?? "",
      });
      setError("");
    }
  }, [book, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!book) return;
    setError("");
    if (!form.title || !form.author || !form.isbn) {
      setError("Title, author and ISBN are required");
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        author: form.author,
        year: Number(form.year),
        isbn: form.isbn,
      };
      if (form.genre) payload.genre = form.genre;
      if (form.description) payload.description = form.description;

      const { data } = await api.put<Book>(`/books/${book.id}`, payload);
      onSuccess(data);
      handleClose();
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Failed to update book");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: '"DM Serif Display", serif',
          fontWeight: 400,
          fontSize: "1.4rem",
          pt: 3,
          pb: 0,
          px: 3,
          color: "text.primary",
        }}
      >
        Edit Book
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ color: "text.secondary" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 2 }}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {loading && <LinearProgress sx={{ borderRadius: 2 }} />}

          <Stack direction="row" spacing={2}>
            <TextField
              label="Title *"
              name="title"
              value={form.title}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Author *"
              name="author"
              value={form.author}
              onChange={handleChange}
              fullWidth
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Year"
              name="year"
              value={form.year}
              onChange={handleChange}
              type="number"
              sx={{ width: 130, flexShrink: 0 }}
            />
            <TextField
              label="ISBN *"
              name="isbn"
              value={form.isbn}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Genre"
              name="genre"
              value={form.genre}
              onChange={handleChange}
              sx={{ width: 150, flexShrink: 0 }}
            />
          </Stack>

          <TextField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1.5 }}>
        <Button onClick={handleClose} sx={{ color: "text.secondary" }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ px: 4 }}
        >
          Save changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
