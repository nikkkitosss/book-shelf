import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  Stack,
  Divider,
} from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStoriesRounded";
import { authApi } from "@/features/auth/api";
import { useAuthStore } from "@/entities/user/model/authStore";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      setAuth(data.user, data.token);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 400 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <AutoStoriesIcon
            sx={{ color: "primary.main", fontSize: 36, mb: 1 }}
          />
          <Typography
            sx={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: "1.8rem",
              color: "text.primary",
            }}
          >
            Library
            <Box component="span" sx={{ color: "primary.main" }}>
              OS
            </Box>
          </Typography>
        </Box>

        <Card
          elevation={0}
          sx={{
            width: "100%",
            p: { xs: 3, sm: 4 },
            border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: 3,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"DM Serif Display", serif',
              fontWeight: 400,
              mb: 0.5,
              color: "text.primary",
            }}
          >
            Welcome back
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, fontSize: "0.9rem" }}>
            Sign in to your library account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {error}
            </Alert>
          )}

          <Stack component="form" onSubmit={handleSubmit} spacing={2.5}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ py: 1.4, fontSize: "0.95rem" }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </Stack>

          <Divider sx={{ my: 3 }} />
          <Typography align="center" variant="body2" color="text.secondary">
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{
                color: "#2563EB",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Create one
            </Link>
          </Typography>
        </Card>
      </Box>
    </Box>
  );
}
