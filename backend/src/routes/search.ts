import { Router } from "express";
import { searchController } from "../controllers/searchController";

const router = Router();

router.get("/books", searchController.searchBooks);

export default router;
