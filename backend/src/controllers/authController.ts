import { Request, Response } from "express";
import { authService } from "../auth/authService";
import { registerSchema, loginSchema, zodMessage } from "../schemas";

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: zodMessage(result.error.issues) });
      return;
    }

    const { name, email, password, adminSecret } = result.data;
    let role: "USER" | "ADMIN" = "USER";

    if (adminSecret) {
      const secret = process.env.ADMIN_SECRET;
      if (!secret) {
        res
          .status(400)
          .json({ error: "Admin registration is not enabled on this server" });
        return;
      }
      if (adminSecret !== secret) {
        res.status(403).json({ error: "Invalid admin secret key" });
        return;
      }
      role = "ADMIN";
    }

    try {
      res
        .status(201)
        .json(await authService.register({ name, email, password, role }));
    } catch (err: any) {
      res.status(409).json({ error: err.message });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: zodMessage(result.error.issues) });
      return;
    }

    try {
      res.json(await authService.login(result.data));
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  },

  async me(req: Request, res: Response): Promise<void> {
    res.json({ userId: req.user!.userId, role: req.user!.role });
  },
};
