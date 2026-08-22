import express from "express";

import {
  createPurchase,
  getPurchases,
  getPurchaseById,
  getSupplierPurchases,
  updatePurchase,
  cancelPurchase,
} from "../controllers/purchase.controller.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// =====================================================
// GET PURCHASES BY SUPPLIER
// GET /api/purchases/supplier/:supplierId
// =====================================================
//
// NOTE: this specific route must be declared BEFORE
// GET /:id, otherwise Express will match "supplier" as
// an :id param and this route will never be reached.
// =====================================================

router.get(
  "/supplier/:supplierId",
  protect,
  allowRoles("admin", "super_admin"),
  getSupplierPurchases,
);

// =====================================================
// ALL PURCHASES
// GET /api/purchases
// =====================================================

router.get("/", protect, allowRoles("admin", "super_admin"), getPurchases);

// =====================================================
// CREATE PURCHASE
// POST /api/purchases
// =====================================================

router.post("/", protect, allowRoles("admin", "super_admin"), createPurchase);

// =====================================================
// CANCEL PURCHASE
// PATCH /api/purchases/:id/cancel
// =====================================================

router.patch(
  "/:id/cancel",
  protect,
  allowRoles("admin", "super_admin"),
  cancelPurchase,
);

// =====================================================
// UPDATE PURCHASE
// PUT /api/purchases/:id
// =====================================================

router.put("/:id", protect, allowRoles("admin", "super_admin"), updatePurchase);

// =====================================================
// GET PURCHASE BY ID
// GET /api/purchases/:id
// =====================================================

router.get(
  "/:id",
  protect,
  allowRoles("admin", "super_admin"),
  getPurchaseById,
);

export default router;
