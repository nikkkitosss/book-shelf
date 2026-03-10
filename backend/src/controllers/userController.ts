import { Request, Response } from "express";
import { userService } from "../services/userService";

export const userController = {
  async getAll(_req: Request, res: Response): Promise<void> {
    res.json(await userService.getAll());
  },

  async getById(req: Request, res: Response): Promise<void> {
    const user = await userService.getById(req.params["id"] as string);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  },
};
