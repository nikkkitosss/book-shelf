import { Request, Response } from "express";
import { loanService } from "../services/loanService";
import type { LoanStatus } from "../types";

export const loanController = {
  async getAll(_req: Request, res: Response): Promise<void> {
    const loans = await loanService.getAll();
    res.json(loans);
  },

  async getMy(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const status = req.query["status"] as LoanStatus | undefined;
    const page = Math.max(
      1,
      parseInt((req.query["page"] as string) ?? "1", 10),
    );
    const limit = Math.min(
      50,
      Math.max(1, parseInt((req.query["limit"] as string) ?? "8", 10)),
    );

    try {
      res.json(
        await loanService.getByUserId(req.user.userId, { status, page, limit }),
      );
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { bookId } = req.body;
    if (!bookId || typeof bookId !== "string") {
      res.status(400).json({ error: "bookId is required" });
      return;
    }

    try {
      res
        .status(201)
        .json(await loanService.create({ userId: req.user.userId, bookId }));
    } catch (err: any) {
      res.status(422).json({ error: err.message });
    }
  },

  async returnBook(req: Request, res: Response): Promise<void> {
    try {
      const loan = await loanService.returnBook(req.params["id"] as string);
      if (!loan) {
        res.status(404).json({ error: "Loan not found" });
        return;
      }
      res.json(loan);
    } catch (err: any) {
      res.status(422).json({ error: err.message });
    }
  },
};
