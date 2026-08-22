import express from "express";
import {
  createShop,
  getShops,
  getShopById,
  updateShop,
  deleteShop,
  getPublicShops,
  getPublicShopServices,
  getMyShopContext,
} from "../controllers/shop.controller.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// ---- Public (no auth) — must come BEFORE the /:id routes ----
// List active shops for the landing page & customer signup
router.get("/public", getPublicShops);

// Active services of a shop for the customer order page
router.get("/public/:id/services", getPublicShopServices);

// The WashFlow laundry serving the logged-in customer + its active services
// (must be registered before the /:id routes so "context" isn't parsed as an id)
router.get("/context", protect, allowRoles("customer"), getMyShopContext);

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