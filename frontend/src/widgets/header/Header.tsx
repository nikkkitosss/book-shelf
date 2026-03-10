import { AppBar, Toolbar, Typography, Button, Box, Chip } from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStoriesRounded";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/entities/user/model/authStore";

export function Header() {
  const { user, isAdmin, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar
        sx={{
          maxWidth: 1280,
          mx: "auto",
          width: "100%",
          px: { xs: 2, md: 4 },
          minHeight: "64px !important",
        }}
      >
        <Box
          onClick={() => navigate("/")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: "pointer",
            mr: 4,
            flexShrink: 0,
          }}
        >
          <AutoStoriesIcon sx={{ color: "primary.main", fontSize: 26 }} />
          <Typography
            sx={{
              fontFamily: '"DM Serif Display", serif',
              fontWeight: 400,
              fontSize: "1.35rem",
              color: "text.primary",
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            Library
            <Box component="span" sx={{ color: "primary.main" }}>
              OS
            </Box>
          </Typography>
        </Box>

        <Box
          sx={{ display: "flex", alignItems: "center", gap: 0.5, flexGrow: 1 }}
        >
          <Button
            onClick={() => navigate("/")}
            sx={{
              color:
                location.pathname === "/" ? "text.primary" : "text.secondary",
              fontSize: "0.875rem",
              fontWeight: location.pathname === "/" ? 600 : 400,
              "&:hover": { color: "text.primary", bgcolor: "rgba(0,0,0,0.04)" },
            }}
          >
            Catalog
          </Button>
          {user && (
            <Button
              onClick={() => navigate("/my-loans")}
              sx={{
                color:
                  location.pathname === "/my-loans"
                    ? "text.primary"
                    : "text.secondary",
                fontSize: "0.875rem",
                fontWeight: location.pathname === "/my-loans" ? 600 : 400,
                "&:hover": {
                  color: "text.primary",
                  bgcolor: "rgba(0,0,0,0.04)",
                },
              }}
            >
              My Loans
            </Button>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {user ? (
            <>
              {isAdmin && (
                <Chip
                  label="Admin"
                  size="small"
                  sx={{
                    fontSize: "0.67rem",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    bgcolor: "rgba(196,125,10,0.1)",
                    color: "primary.dark",
                    border: "1px solid rgba(196,125,10,0.3)",
                    height: 22,
                  }}
                />
              )}
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontSize: "0.82rem",
                  display: { xs: "none", sm: "block" },
                }}
              >
                {user.name}
              </Typography>
              <Button
                size="small"
                onClick={logout}
                sx={{
                  color: "text.secondary",
                  fontSize: "0.82rem",
                  border: "1px solid rgba(0,0,0,0.12)",
                  "&:hover": {
                    color: "text.primary",
                    border: "1px solid rgba(0,0,0,0.25)",
                    bgcolor: "rgba(0,0,0,0.04)",
                  },
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => navigate("/login")}
                sx={{
                  color: "text.secondary",
                  fontSize: "0.875rem",
                  "&:hover": {
                    color: "text.primary",
                    bgcolor: "rgba(0,0,0,0.04)",
                  },
                }}
              >
                Sign in
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate("/register")}
                sx={{ px: 2.5 }}
              >
                Get started
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
