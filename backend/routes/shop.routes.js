import express from "express";
import { createShop } from "../controllers/shop.controller.js";
import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// Create Shop (Only Super Admin)
router.post(
  "/",
  protect,
  allowRoles("super_admin"),
  createShop
);

export default router;