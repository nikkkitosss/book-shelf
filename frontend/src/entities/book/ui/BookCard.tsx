import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/FileDownloadOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAddOutlined";
import { useNavigate } from "react-router-dom";
import type { Book } from "../../types.ts";

interface Props {
  book: Book;
  isAdmin: boolean;
  isLoggedIn?: boolean;
  onDelete?: (id: string) => void;
  onDownload?: (id: string) => void;
  onLoan?: (id: string) => void;
}

const GENRE_COLORS: Record<string, string> = {
  Fiction: "#3A5FCC",
  Science: "#1E8A4A",
  History: "#C47D0A",
  Philosophy: "#7B52CC",
  Art: "#CC3D7A",
  Technology: "#1A8AA0",
  Biography: "#CC6A28",
};

function getGenreColor(genre: string | null): string {
  if (!genre) return "#2563EB";
  return GENRE_COLORS[genre] ?? "#64748B";
}

export function BookCard({
  book,
  isAdmin,
  isLoggedIn,
  onDelete,
  onDownload,
  onLoan,
}: Props) {
  const navigate = useNavigate();
  const accentColor = getGenreColor(book.genre);

  const goToBook = () => navigate(`/books/${book.id}`);

  const stopAndRun = (e: React.MouseEvent, fn: () => void) => {
    e.stopPropagation();
    fn();
  };

  return (
    <Card
      elevation={0}
      onClick={goToBook}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          border: `1px solid ${accentColor}55`,
          boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box
        sx={{
          height: 3,
          background: `linear-gradient(90deg, ${accentColor} 0%, transparent 100%)`,
          opacity: book.available ? 1 : 0.35,
        }}
      />

      <CardContent sx={{ flexGrow: 1, p: 2.5, pb: 1 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Chip
            label={book.available ? "Available" : "On Loan"}
            size="small"
            sx={{
              fontSize: "0.68rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              height: 22,
              bgcolor: book.available
                ? "rgba(5,150,105,0.1)"
                : "rgba(220,38,38,0.1)",
              color: book.available ? "#059669" : "#DC2626",
              border:
                "1px solid " +
                (book.available
                  ? "rgba(5,150,105,0.3)"
                  : "rgba(220,38,38,0.3)"),
            }}
          />
          {book.fileUrl && (
            <Tooltip title="PDF available">
              <Box
                sx={{
                  width: 28,
                  height: 20,
                  borderRadius: "4px",
                  bgcolor: "rgba(37,99,235,0.08)",
                  border: "1px solid rgba(37,99,235,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    color: "primary.main",
                    lineHeight: 1,
                  }}
                >
                  PDF
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Stack>

        <Typography
          variant="h6"
          sx={{
            fontFamily: '"DM Serif Display", serif',
            fontWeight: 400,
            fontSize: "1.1rem",
            lineHeight: 1.25,
            color: "text.primary",
            mb: 0.75,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {book.title}
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontSize: "0.82rem", mb: 1.5 }}
        >
          {book.author} · {book.year}
        </Typography>

        {book.genre && (
          <Chip
            label={book.genre}
            size="small"
            sx={{
              fontSize: "0.67rem",
              height: 20,
              bgcolor: accentColor + "18",
              color: accentColor,
              border: "1px solid " + accentColor + "33",
              borderRadius: "4px",
            }}
          />
        )}

        {book.description && (
          <Typography
            variant="body2"
            sx={{
              mt: 1.5,
              fontSize: "0.8rem",
              lineHeight: 1.6,
              color: "text.secondary",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {book.description}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ px: 2.5, pb: 2, pt: 0.5, gap: 1 }}>
        {book.fileUrl && (
          <Tooltip title="Download PDF">
            <IconButton
              size="small"
              onClick={(e) => stopAndRun(e, () => onDownload?.(book.id))}
              sx={{
                color: "text.secondary",
                "&:hover": { color: "primary.main" },
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {isLoggedIn && book.available && (
          <Button
            size="small"
            startIcon={<BookmarkAddIcon />}
            onClick={(e) => stopAndRun(e, () => onLoan?.(book.id))}
            sx={{
              ml: "auto",
              fontSize: "0.75rem",
              px: 1.5,
              py: 0.5,
              bgcolor: "rgba(37,99,235,0.08)",
              color: "primary.main",
              border: "1px solid rgba(37,99,235,0.25)",
              "&:hover": {
                bgcolor: "rgba(37,99,235,0.15)",
                borderColor: "primary.main",
              },
            }}
          >
            Borrow
          </Button>
        )}

        {isAdmin && (
          <Tooltip title="Delete book">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => stopAndRun(e, () => onDelete?.(book.id))}
              sx={{ ml: isLoggedIn && book.available ? 0 : "auto" }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
}
