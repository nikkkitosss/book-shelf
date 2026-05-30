import { Box, Typography, Chip, Stack, Button, Paper } from "@mui/material";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAddOutlined";
import DownloadIcon from "@mui/icons-material/FileDownloadOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardRounded";
import { useNavigate } from "react-router-dom";
import type { SearchHit } from "@/entities/types";

interface Props {
  hit: SearchHit;
  isAdmin: boolean;
  isLoggedIn?: boolean;
  onDownload?: (id: string) => void;
  onLoan?: (id: string) => void;
}

function matchLabel(score: number): {
  label: string;
  color: string;
  bg: string;
  borderColor: string;
} {
  if (score >= 15)
    return {
      label: "Strong match",
      color: "#15803d",
      bg: "rgba(22,163,74,0.1)",
      borderColor: "rgba(22,163,74,0.25)",
    };
  if (score >= 5)
    return {
      label: "Match",
      color: "#2563eb",
      bg: "rgba(37,99,235,0.1)",
      borderColor: "rgba(37,99,235,0.25)",
    };
  return {
    label: "Partial match",
    color: "#64748b",
    bg: "rgba(0,0,0,0.05)",
    borderColor: "rgba(0,0,0,0.15)",
  };
}

export function SearchResultCard({
  hit,
  isLoggedIn,
  onDownload,
  onLoan,
}: Props) {
  const navigate = useNavigate();
  const { book, score } = hit;
  const isAvailable = book.available ?? false;
  const match = matchLabel(score);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        transition: "all 0.2s",
        cursor: "pointer",
        "&:hover": {
          borderColor: "primary.light",
          boxShadow: "0 4px 20px rgba(37,99,235,0.08)",
          transform: "translateY(-1px)",
        },
      }}
      onClick={() => navigate("/books/" + hit.id)}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2.5}
        alignItems="flex-start"
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            sx={{ mb: 1 }}
          >
            <Chip
              label={isAvailable ? "Available" : "On Loan"}
              size="small"
              sx={{
                fontSize: "0.67rem",
                fontWeight: 600,
                height: 20,
                bgcolor: isAvailable
                  ? "rgba(22,163,74,0.1)"
                  : "rgba(220,38,38,0.1)",
                color: isAvailable ? "#15803d" : "#dc2626",
                border:
                  "1px solid " +
                  (isAvailable
                    ? "rgba(22,163,74,0.25)"
                    : "rgba(220,38,38,0.25)"),
              }}
            />
            {book.genre && (
              <Chip
                label={book.genre}
                size="small"
                sx={{
                  fontSize: "0.67rem",
                  height: 20,
                  bgcolor: "rgba(37,99,235,0.08)",
                  color: "primary.main",
                  border: "1px solid rgba(37,99,235,0.2)",
                }}
              />
            )}
            {book.fileUrl && (
              <Chip
                label="PDF"
                size="small"
                sx={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  height: 20,
                  bgcolor: "rgba(124,58,237,0.08)",
                  color: "#7c3aed",
                  border: "1px solid rgba(124,58,237,0.2)",
                }}
              />
            )}
            <Chip
              label={match.label}
              size="small"
              sx={{
                ml: "auto",
                fontSize: "0.67rem",
                fontWeight: 600,
                height: 20,
                bgcolor: match.bg,
                color: match.color,
                border: `1px solid ${match.borderColor}`,
              }}
            />
          </Stack>

          <Typography
            sx={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: "1.15rem",
              fontWeight: 400,
              color: "text.primary",
              lineHeight: 1.3,
              mb: 0.5,
            }}
          >
            {book.title}
          </Typography>

          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
            {book.author}
            {book.year ? ` · ${book.year}` : ""}
          </Typography>

          {book.description && (
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                lineHeight: 1.7,
                fontSize: "0.85rem",
                mb: 1.5,
              }}
            >
              {book.description}
            </Typography>
          )}
        </Box>

        <Stack
          spacing={1}
          sx={{ flexShrink: 0, minWidth: 120 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="small"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            onClick={(e) => {
              e.stopPropagation();
              navigate("/books/" + hit.id);
            }}
            sx={{
              fontSize: "0.78rem",
              color: "primary.main",
              border: "1px solid rgba(37,99,235,0.25)",
              justifyContent: "space-between",
              "&:hover": {
                bgcolor: "rgba(37,99,235,0.06)",
                borderColor: "primary.main",
              },
            }}
          >
            View
          </Button>

          {isLoggedIn && isAvailable && onLoan && (
            <Button
              size="small"
              startIcon={<BookmarkAddIcon fontSize="small" />}
              onClick={(e) => {
                e.stopPropagation();
                onLoan(hit.id);
              }}
              sx={{
                fontSize: "0.78rem",
                color: "#15803d",
                border: "1px solid rgba(22,163,74,0.25)",
                justifyContent: "flex-start",
                "&:hover": {
                  bgcolor: "rgba(22,163,74,0.06)",
                  borderColor: "#16a34a",
                },
              }}
            >
              Borrow
            </Button>
          )}

          {book.fileUrl && onDownload && (
            <Button
              size="small"
              startIcon={<DownloadIcon fontSize="small" />}
              onClick={(e) => {
                e.stopPropagation();
                onDownload(hit.id);
              }}
              sx={{
                fontSize: "0.78rem",
                color: "text.secondary",
                border: "1px solid",
                borderColor: "divider",
                justifyContent: "flex-start",
                "&:hover": {
                  bgcolor: "rgba(0,0,0,0.04)",
                  borderColor: "text.secondary",
                },
              }}
            >
              Download
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
