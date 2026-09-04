import express from "express";
import {
  generateInvoice,
  getMyInvoices,
  getAdminInvoices,
  getAllTenantInvoices,
  getInvoiceById,
  updateInvoice,
  payInvoice,
  getInvoiceStats,
} from "../controllers/invoice.controller.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// ============================================================
// CUSTOMER ROUTES
// ============================================================

// Get my invoices (customer)
router.get(
  "/my",
  protect,
  allowRoles("customer"),
  getMyInvoices
);

// ============================================================
// ADMIN / SUPER_ADMIN ROUTES
// ============================================================

// Invoice stats for dashboard
router.get(
  "/stats",
  protect,
  allowRoles("admin", "super_admin"),
  getInvoiceStats
);

// Get all invoices (admin - scoped to their shop)
router.get(
  "/admin",
  protect,
  allowRoles("admin", "super_admin"),
  getAdminInvoices
);

// Super Admin — get all tenant invoices (no shopId filter)
router.get(
  "/all",
  protect,
  allowRoles("super_admin"),
  getAllTenantInvoices
);

// Generate invoice from order
router.post(
  "/generate/:orderId",
  protect,
  allowRoles("admin", "super_admin"),
  generateInvoice
);

// ============================================================
// SHARED — GET / UPDATE INVOICE BY ID
// (must be after /admin, /all, /stats, /my, /generate to avoid conflicts)
// ============================================================

// Get invoice by ID (customers see their own, admins see their shop's, super admins see all)
router.get(
  "/:id",
  protect,
  allowRoles("customer", "admin", "super_admin"),
  getInvoiceById
);

// Update invoice details (admin / super admin)
router.patch(
  "/:id",
  protect,
  allowRoles("admin", "super_admin"),
  updateInvoice
);

// Mark invoice as paid
router.patch(
  "/:id/pay",
  protect,
  allowRoles("admin", "super_admin"),
  payInvoice
);

export default router;
