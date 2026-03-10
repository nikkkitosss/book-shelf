import { useState } from "react";
import {
  Button,
  CircularProgress,
  Tooltip,
  Alert,
  Snackbar,
  Box,
  Typography,
} from "@mui/material";
import SyncIcon from "@mui/icons-material/SyncRounded";
import { api } from "@/shared/api/instance";

interface ReindexResult {
  message: string;
  total: number;
  indexed: number;
  failed: number;
  errors?: string[];
}

export function ReindexButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReindexResult | null>(null);
  const [open, setOpen] = useState(false);

  const handleReindex = async () => {
    if (
      !confirm(
        "This will re-read all PDFs from storage and rebuild the search index.\n" +
          "May take a few minutes. Continue?",
      )
    )
      return;

    setLoading(true);
    try {
      const { data } = await api.post<ReindexResult>("/admin/reindex");
      setResult(data);
      setOpen(true);
    } catch (e: any) {
      setResult({
        message: e.response?.data?.error ?? "Reindex failed",
        total: 0,
        indexed: 0,
        failed: 0,
      });
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip title="Re-read all PDFs and rebuild full-text search index">
        <span>
          <Button
            size="small"
            variant="outlined"
            startIcon={loading ? <CircularProgress size={14} /> : <SyncIcon />}
            onClick={handleReindex}
            disabled={loading}
            sx={{
              fontSize: "0.8rem",
              borderColor: "rgba(0,0,0,0.15)",
              color: "text.secondary",
              "&:hover": { borderColor: "primary.main", color: "primary.main" },
            }}
          >
            {loading ? "Indexing..." : "Reindex PDFs"}
          </Button>
        </span>
      </Tooltip>

      <Snackbar
        open={open}
        autoHideDuration={8000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={result?.failed === 0 ? "success" : "warning"}
          onClose={() => setOpen(false)}
          sx={{ minWidth: 280 }}
        >
          <Typography variant="body2" fontWeight={600}>
            {result?.message}
          </Typography>
          {result && (
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              {result.indexed}/{result.total} books indexed
              {result.failed > 0 && ` · ${result.failed} failed`}
            </Typography>
          )}
        </Alert>
      </Snackbar>
    </>
  );
}
