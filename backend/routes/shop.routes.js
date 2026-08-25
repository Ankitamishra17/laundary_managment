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
  getShopBySlug,
} from "../controllers/shop.controller.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// =====================================================
// PUBLIC ROUTES
// IMPORTANT: Specific routes must come before /:id
// =====================================================

// List active shops
router.get("/public", getPublicShops);

// Find shop by slug
// Example: GET /api/shops/slug/tester
router.get("/slug/:slug", getShopBySlug);

// Active services of a shop
router.get("/public/:id/services", getPublicShopServices);

// =====================================================
// CUSTOMER ROUTES
// =====================================================

// Logged-in customer's shop context
router.get("/context", protect, allowRoles("customer"), getMyShopContext);

// =====================================================
// SUPER ADMIN ROUTES
// =====================================================

// Create shop
router.post("/", protect, allowRoles("super_admin"), createShop);

// Get all shops
router.get("/", protect, allowRoles("super_admin"), getShops);

// Get shop by ID
router.get("/:id", protect, allowRoles("super_admin"), getShopById);

// Update shop
router.put("/:id", protect, allowRoles("super_admin"), updateShop);

// Delete shop
router.delete("/:id", protect, allowRoles("super_admin"), deleteShop);

export default router;
