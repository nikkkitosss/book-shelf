import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563EB",
      light: "#60A5FA",
      dark: "#1D4ED8",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#7C3AED",
      light: "#A78BFA",
      dark: "#5B21B6",
    },
    background: {
      default: "#F8FAFC",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F172A",
      secondary: "#64748B",
    },
    divider: "rgba(0,0,0,0.08)",
    success: { main: "#059669", contrastText: "#FFFFFF" },
    error: { main: "#DC2626" },
    warning: { main: "#D97706" },
  },
  typography: {
    fontFamily: '"DM Sans", system-ui, sans-serif',
    h1: {
      fontFamily: '"DM Serif Display", Georgia, serif',
      fontWeight: 400,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontFamily: '"DM Serif Display", Georgia, serif',
      fontWeight: 400,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontFamily: '"DM Serif Display", Georgia, serif',
      fontWeight: 400,
      letterSpacing: "-0.02em",
    },
    h4: { fontFamily: '"DM Serif Display", Georgia, serif', fontWeight: 400 },
    h5: { fontFamily: '"DM Serif Display", Georgia, serif', fontWeight: 400 },
    h6: { fontFamily: '"DM Serif Display", Georgia, serif', fontWeight: 400 },
    button: {
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 600,
      letterSpacing: "0.02em",
    },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
        * { box-sizing: border-box; }
        body { background: #F8FAFC; }
        ::-webkit-scrollbar { width: 6px; background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.25); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(37,99,235,0.45); }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: "none",
          fontWeight: 600,
          letterSpacing: "0.02em",
        },
        contained: {
          background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
          color: "#FFFFFF",
          boxShadow: "0 2px 10px rgba(37,99,235,0.25)",
          "&:hover": {
            background: "linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)",
            boxShadow: "0 4px 18px rgba(37,99,235,0.35)",
          },
        },
        outlined: {
          borderColor: "rgba(37,99,235,0.4)",
          color: "#2563EB",
          "&:hover": {
            borderColor: "#2563EB",
            background: "rgba(37,99,235,0.05)",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(255,255,255,0.95)",
          color: "#0F172A",
          boxShadow: "none",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          backdropFilter: "blur(12px)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "#FFFFFF",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          background: "#FFFFFF",
          "& fieldset": { borderColor: "rgba(0,0,0,0.15)" },
          "&:hover fieldset": { borderColor: "rgba(37,99,235,0.45)" },
          "&.Mui-focused fieldset": { borderColor: "#2563EB" },
        },
        input: { color: "#0F172A" },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: "#64748B", "&.Mui-focused": { color: "#2563EB" } },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: "#FFFFFF",
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: 16,
          boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(0,0,0,0.1)",
          color: "#64748B",
          textTransform: "none",
          fontWeight: 500,
          "&.Mui-selected": {
            color: "#2563EB",
            background: "rgba(37,99,235,0.08)",
            borderColor: "rgba(37,99,235,0.4)",
            "&:hover": { background: "rgba(37,99,235,0.13)" },
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { background: "rgba(37,99,235,0.1)", borderRadius: 4 },
        bar: { background: "linear-gradient(90deg, #60A5FA, #2563EB)" },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8 },
        standardError: {
          background: "rgba(220,38,38,0.07)",
          border: "1px solid rgba(220,38,38,0.2)",
        },
        standardSuccess: {
          background: "rgba(5,150,105,0.07)",
          border: "1px solid rgba(5,150,105,0.2)",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: "rgba(0,0,0,0.08)" },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});
