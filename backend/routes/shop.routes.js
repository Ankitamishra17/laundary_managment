import express from "express";
import {
  createShop,
  getShops,
  getShopById,
  updateShop,
  deleteShop,
} from "../controllers/shop.controller.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// Create Shop
router.post("/", protect, allowRoles("super_admin"), createShop);

// Get All Shops
router.get("/", protect, allowRoles("super_admin"), getShops);

// Get Shop By ID
router.get("/:id", protect, allowRoles("super_admin"), getShopById);

// Update Shop
router.put("/:id", protect, allowRoles("super_admin"), updateShop);

// Delete Shop
router.delete("/:id", protect, allowRoles("super_admin"), deleteShop);

export default router;