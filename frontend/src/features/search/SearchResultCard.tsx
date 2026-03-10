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

function matchLabel(
  score: number,
  hasContentHit: boolean,
): { label: string; color: string; bg: string; borderColor: string } {
  if (hasContentHit && score >= 15)
    return {
      label: "Exact match",
      color: "#15803d",
      bg: "rgba(22,163,74,0.1)",
      borderColor: "rgba(22,163,74,0.25)",
    };
  if (hasContentHit && score >= 5)
    return {
      label: "Strong match",
      color: "#2563eb",
      bg: "rgba(37,99,235,0.1)",
      borderColor: "rgba(37,99,235,0.25)",
    };
  if (hasContentHit)
    return {
      label: "Found in text",
      color: "#7c3aed",
      bg: "rgba(124,58,237,0.08)",
      borderColor: "rgba(124,58,237,0.25)",
    };
  if (score >= 3)
    return {
      label: "Good match",
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

function HighlightedText({ html }: { html: string }) {
  const parts = html.split(/(<em>.*?<\/em>)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("<em>") && part.endsWith("</em>") ? (
          <Box
            key={i}
            component="mark"
            sx={{
              bgcolor: "rgba(37,99,235,0.12)",
              color: "primary.dark",
              fontWeight: 600,
              borderRadius: "3px",
              px: "3px",
              py: "1px",
              fontStyle: "normal",
            }}
          >
            {part.slice(4, -5)}
          </Box>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

export function SearchResultCard({
  hit,
  isLoggedIn,
  onDownload,
  onLoan,
}: Props) {
  const navigate = useNavigate();
  const { book, highlight, score } = hit;

  const descHighlight = highlight?.description?.[0];
  const contentHighlight = highlight?.content;
  const isAvailable = book.available ?? false;
  const match = matchLabel(score, !!contentHighlight?.length);

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

          {descHighlight && (
            <Box
              sx={{
                mb: 1.5,
                p: 1.5,
                bgcolor: "rgba(37,99,235,0.03)",
                borderLeft: "3px solid",
                borderColor: "primary.light",
                borderRadius: "0 6px 6px 0",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  lineHeight: 1.7,
                  fontSize: "0.85rem",
                }}
              >
                <HighlightedText html={descHighlight} />
              </Typography>
            </Box>
          )}

          {contentHighlight && contentHighlight.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "text.disabled",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontSize: "0.65rem",
                  display: "block",
                  mb: 0.75,
                }}
              >
                Found in book content
              </Typography>
              <Stack spacing={0.75}>
                {contentHighlight.map((fragment, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 1.25,
                      bgcolor: "rgba(124,58,237,0.04)",
                      borderLeft: "3px solid",
                      borderColor: "rgba(124,58,237,0.4)",
                      borderRadius: "0 6px 6px 0",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        lineHeight: 1.7,
                        fontSize: "0.82rem",
                        fontStyle: "italic",
                      }}
                    >
                      "…
                      <HighlightedText html={fragment} />
                      …"
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
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
