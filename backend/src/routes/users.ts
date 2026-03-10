import { Router } from "express";
import { userController } from "../controllers/userController";
import { authenticate, requireAdmin } from "../middleware/authenticate";

const router = Router();

router.get("/", authenticate, requireAdmin, userController.getAll);
router.get("/:id", authenticate, requireAdmin, userController.getById);

export default router;
