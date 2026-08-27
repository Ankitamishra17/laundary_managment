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
// Specific routes MUST come before /:id
// =====================================================

// Get all active shops
// GET /api/shops/public
router.get("/public", getPublicShops);

// Get shop by slug
// GET /api/shops/slug/:slug
// Example: /api/shops/slug/amisha-laundry
router.get("/slug/:slug", getShopBySlug);

// Get active services of a public shop
// GET /api/shops/public/:id/services
router.get("/public/:id/services", getPublicShopServices);

// =====================================================
// CUSTOMER ROUTES
// =====================================================

// Get logged-in customer's linked shop and services
// GET /api/shops/context
router.get("/context", protect, allowRoles("customer"), getMyShopContext);

// =====================================================
// SUPER ADMIN ROUTES
// =====================================================

// Create shop
// POST /api/shops
router.post("/", protect, allowRoles("super_admin"), createShop);

// Get all shops
// GET /api/shops
router.get("/", protect, allowRoles("super_admin"), getShops);

// Get shop by ID
// GET /api/shops/:id
// IMPORTANT: Keep this after all named GET routes
router.get("/:id", protect, allowRoles("super_admin"), getShopById);

// Update shop
// PUT /api/shops/:id
router.put("/:id", protect, allowRoles("super_admin"), updateShop);

// Delete/deactivate shop
// DELETE /api/shops/:id
router.delete("/:id", protect, allowRoles("super_admin"), deleteShop);

export default router;
