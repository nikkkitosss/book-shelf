import { Router } from "express";
import multer from "multer";
import { bookController } from "../controllers/bookController";
import { authenticate, requireAdmin } from "../middleware/authenticate";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = ["application/pdf", "application/epub+zip"];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only PDF and EPUB files are allowed"));
  },
});

router.get("/", bookController.getAll);
router.get("/:id", bookController.getById);
router.get("/:id/download", authenticate, bookController.download);

router.post(
  "/",
  authenticate,
  requireAdmin,
  upload.single("file"),
  bookController.create,
);
router.put("/:id", authenticate, requireAdmin, bookController.update);
router.delete("/:id", authenticate, requireAdmin, bookController.delete);

export default router;
