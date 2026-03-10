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
  Collapse,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStoriesRounded";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import { authApi } from "@/features/auth/api";
import { useAuthStore } from "@/entities/user/model/authStore";

export function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [adminSecret, setAdminSecret] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authApi.register(
        form.name,
        form.email,
        form.password,
        showAdmin ? adminSecret : undefined,
      );
      setAuth(data.user, data.token);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Registration failed");
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
      <Box sx={{ width: "100%", maxWidth: 420 }}>
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
            Create account
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, fontSize: "0.9rem" }}>
            Join LibraryOS and start reading
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Full name"
                name="name"
                value={form.name}
                onChange={handleChange}
                fullWidth
                required
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                fullWidth
                required
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ minLength: 6 }}
                helperText="At least 6 characters"
              />

              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={showAdmin}
                      onChange={(e) => {
                        setShowAdmin(e.target.checked);
                        setAdminSecret("");
                      }}
                      sx={{
                        color: "text.secondary",
                        "&.Mui-checked": { color: "primary.main" },
                      }}
                    />
                  }
                  label={
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                    >
                      <AdminPanelSettingsIcon
                        sx={{ fontSize: 16, color: "text.secondary" }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Register as administrator
                      </Typography>
                    </Box>
                  }
                />
                <Collapse in={showAdmin}>
                  <TextField
                    label="Admin secret key"
                    type="password"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    fullWidth
                    helperText="Provided by your system administrator"
                    sx={{ mt: 1.5 }}
                  />
                </Collapse>
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ py: 1.4, fontSize: "0.95rem" }}
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />
          <Typography align="center" variant="body2" color="text.secondary">
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "#2563EB",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </Typography>
        </Card>
      </Box>
    </Box>
  );
}
