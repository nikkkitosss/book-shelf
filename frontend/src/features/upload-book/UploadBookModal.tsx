import { useState } from "react";
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
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFileRounded";
import CloseIcon from "@mui/icons-material/CloseRounded";
import { bookApi } from "@/entities/book/api/bookApi";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadBookModal({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    title: "",
    author: "",
    year: new Date().getFullYear().toString(),
    isbn: "",
    genre: "",
    description: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.title || !form.author || !form.isbn) {
      setError("Title, author and ISBN are required");
      return;
    }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v) fd.append(k, v);
    });
    if (file) fd.append("file", file);
    setLoading(true);
    try {
      await bookApi.create(fd);
      onSuccess();
      handleClose();
      setForm({
        title: "",
        author: "",
        year: new Date().getFullYear().toString(),
        isbn: "",
        genre: "",
        description: "",
      });
      setFile(null);
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Failed to save the book");
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
          fontSize: "1.5rem",
          pb: 0,
          pt: 3,
          px: 3,
          color: "text.primary",
        }}
      >
        Add New Book
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
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}
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

          <Box>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon sx={{ flexShrink: 0 }} />}
              sx={{
                width: "100%",
                py: 2,
                borderStyle: "dashed",
                borderColor: file ? "primary.main" : "rgba(0,0,0,0.2)",
                color: file ? "primary.main" : "text.secondary",
                bgcolor: file ? "rgba(37,99,235,0.04)" : "transparent",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "rgba(37,99,235,0.04)",
                  color: "primary.main",
                },
                transition: "all 0.2s",
                "& .MuiButton-startIcon": { flexShrink: 0 },
              }}
            >
              <Box
                component="span"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                  display: "block",
                }}
              >
                {file ? file.name : "Upload PDF / EPUB"}
              </Box>
              <input
                type="file"
                hidden
                accept=".pdf,.epub"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Button>
            {file && (
              <Typography
                variant="caption"
                sx={{ mt: 0.75, display: "block", color: "text.secondary" }}
              >
                {(file.size / 1024 / 1024).toFixed(1)} MB ·{" "}
                {file.type || "unknown type"}
              </Typography>
            )}
          </Box>
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
          Save Book
        </Button>
      </DialogActions>
    </Dialog>
  );
}
