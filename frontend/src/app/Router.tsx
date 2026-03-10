import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "@/widgets/header/Header";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { HomePage } from "@/pages/home/HomePage";
import { BookDetailPage } from "@/pages/book/BookDetailPage";
import { MyLoansPage } from "@/pages/loans/MyLoansPage";
import { useAuthStore } from "@/entities/user/model/authStore";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route
          path="/my-loans"
          element={
            <PrivateRoute>
              <MyLoansPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
