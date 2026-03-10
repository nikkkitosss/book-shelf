import express, { Request, Response, NextFunction } from "express";
import bookRouter from "./routes/books";
import userRouter from "./routes/users";
import loanRouter from "./routes/loans";
import searchRouter from "./routes/search";
import authRouter from "./routes/auth";
import adminRouter from "./routes/admin";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

app.use("/auth", authRouter);
app.use("/books", bookRouter);
app.use("/users", userRouter);
app.use("/loans", loanRouter);
app.use("/search", searchRouter);
app.use("/admin", adminRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

export default app;
