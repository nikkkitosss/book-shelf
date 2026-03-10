import { Router } from "express";
import { loanController } from "../controllers/loanController";
import { authenticate, requireAdmin } from "../middleware/authenticate";

const router = Router();

router.get("/my", authenticate, loanController.getMy);
router.get("/", authenticate, requireAdmin, loanController.getAll);
router.post("/", authenticate, loanController.create);
router.patch("/:id/return", authenticate, loanController.returnBook);

export default router;
