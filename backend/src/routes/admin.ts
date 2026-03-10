import { Router } from "express";
import { adminController } from "../controllers/adminController";
import { authenticate, requireAdmin } from "../middleware/authenticate";

const router = Router();

router.post("/reindex", authenticate, requireAdmin, adminController.reindexPdf);
router.get(
  "/index-stats",
  authenticate,
  requireAdmin,
  adminController.indexStats,
);

export default router;
