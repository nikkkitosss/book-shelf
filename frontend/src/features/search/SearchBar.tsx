import { useState } from "react";
import {
  InputAdornment,
  TextField,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/SearchRounded";
import SubjectIcon from "@mui/icons-material/SubjectRounded";
import AbcIcon from "@mui/icons-material/AbcRounded";

export type SearchMode = "meta" | "content";

interface Props {
  onSearch: (q: string, mode: SearchMode) => void;
}

export function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<SearchMode>("meta");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value.trim()) onSearch(value.trim(), mode);
  };

  const handleModeChange = (
    _: React.MouseEvent,
    newMode: SearchMode | null,
  ) => {
    if (newMode) setMode(newMode);
  };

  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
      <TextField
        fullWidth
        placeholder={
          mode === "meta"
            ? "Search by title, author, ISBN..."
            : "Search within book content (full text)..."
        }
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            height: 52,
            fontSize: "0.95rem",
          },
        }}
      />

      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleModeChange}
        size="small"
        sx={{
          flexShrink: 0,
          height: 52,
        }}
      >
        <Tooltip title="Search by title / author / ISBN">
          <ToggleButton
            value="meta"
            sx={{ px: 2, fontSize: "0.8rem", gap: 0.75 }}
          >
            <AbcIcon sx={{ fontSize: 18 }} />
            Catalog
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Search within book text content (Elasticsearch)">
          <ToggleButton
            value="content"
            sx={{ px: 2, fontSize: "0.8rem", gap: 0.75 }}
          >
            <SubjectIcon sx={{ fontSize: 18 }} />
            Content
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
    </Box>
  );
}
